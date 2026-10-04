import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource as TypeOrmDataSource } from 'typeorm';
import { SurveyEntity } from '../../database/entities/survey.entity';
import { CitizenEntity } from '../../database/entities/citizen.entity';
import { MahallaEntity } from '../../database/entities/mahalla.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { EmploymentHistoryEntity } from '../../database/entities/employment-history.entity';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { FilterSurveyDto } from './dto/filter-survey.dto';
import {
  SurveyStatus,
  UserRole,
  DataSource,
  EmploymentCategory,
  NoWishReason,
} from '../../database/enums';

@Injectable()
export class SurveysService {
  constructor(
    @InjectRepository(SurveyEntity)
    private readonly surveyRepository: Repository<SurveyEntity>,
    @InjectRepository(CitizenEntity)
    private readonly citizenRepository: Repository<CitizenEntity>,
    @InjectRepository(MahallaEntity)
    private readonly mahallaRepository: Repository<MahallaEntity>,
    @InjectRepository(EmploymentHistoryEntity)
    private readonly historyRepository: Repository<EmploymentHistoryEntity>,
    private readonly dataSource: TypeOrmDataSource,
  ) {}

  /**
   * Yangi anketa yuborish (Operator yoki Admin)
   */
  async create(dto: CreateSurveyDto, currentUser: UserEntity) {
    // 1. Mahalla aniqlash va tekshirish
    let targetMahallaId = dto.mahallaId;

    if (currentUser.roleCode === UserRole.MAHALLA_OPERATOR) {
      if (!currentUser.mahallaId) {
        throw new ForbiddenException(
          'Sizga mahalla biriktirilmagan. Anketa to\'ldira olmaysiz.',
        );
      }
      targetMahallaId = currentUser.mahallaId;
    }

    if (!targetMahallaId) {
      throw new BadRequestException('Mahalla tanlanishi shart');
    }

    const mahalla = await this.mahallaRepository.findOne({
      where: { id: targetMahallaId },
      relations: { district: true },
    });
    if (!mahalla) {
      throw new NotFoundException(`Mahalla topilmadi (ID: ${targetMahallaId})`);
    }

    const targetDistrictId = mahalla.districtId;

    // 1.5. Yosh chegarasini tekshirish (18 - 60 yosh)
    const birth = new Date(dto.birthDate);
    if (isNaN(birth.getTime())) {
      throw new BadRequestException('Tug\'ilgan sana formati noto\'g\'ri');
    }
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    if (age < 18) {
      throw new BadRequestException(
        `Fuqaro yoshi ${age} da (voyaga yetmagan bola). Bandlik monitoringiga faqat 18 yoshga to'lgan fuqarolar kiritiladi`,
      );
    }
    if (age > 60) {
      throw new BadRequestException(
        `Fuqaro yoshi ${age} da. Bandlik monitoringi 18 dan 60 yoshgacha bo'lgan fuqarolar uchun o'tkaziladi`,
      );
    }

    // 2. JSHSHIR dublikati va ziddiyatlarni tekshirish (Conflict Queue mantiqi)
    const existingCitizen = await this.citizenRepository.findOne({
      where: { pinfl: dto.pinfl },
      relations: { mahalla: true, district: true },
    });

    // Tranzaksiya orqali xavfsiz saqlash
    return this.dataSource.transaction(async (manager) => {
      const newDetails = this.extractDetails(dto);

      // Agar fuqaro allaqachon mavjud bo'lsa -> Ziddiyat! Review Queue ga yo'naltirish
      if (existingCitizen) {
        const conflictReason = `Ushbu JSHSHIR (${dto.pinfl}) bo'yicha fuqaro allaqachon mavjud (${existingCitizen.fullName}, ${existingCitizen.mahalla?.name || 'boshqa mahalla'}). Yangi so'rovnoma tekshiruv navbatiga yo'naltirildi.`;

        const survey = manager.create(SurveyEntity, {
          citizenId: existingCitizen.id,
          citizenPinfl: dto.pinfl,
          citizenFullName: dto.fullName,
          operatorId: currentUser.id,
          districtId: targetDistrictId,
          mahallaId: targetMahallaId,
          surveyDate: new Date(dto.surveyDate),
          surveyMethod: dto.surveyMethod,
          mainCategory: dto.mainCategory,
          officialWorkplace: dto.officialWorkplace,
          unofficialActivityType: dto.unofficialActivityType,
          noWishReason: dto.noWishReason,
          unemployedDirections: dto.unemployedDirections,
          unemployedAdditionalNote: dto.unemployedAdditionalNote,
          otherReasonNote: dto.otherReasonNote,
          citizenSigned: dto.citizenSigned ?? true,
          operatorSigned: dto.operatorSigned ?? true,
          status: SurveyStatus.PENDING_REVIEW,
          conflictReason,
          dataSource: DataSource.SURVEY_OPERATOR,
        });

        const savedSurvey = await manager.save(SurveyEntity, survey);

        return {
          isConflict: true,
          message:
            'Diqqat: Ushbu JSHSHIR bo\'yicha fuqaro oldin ro\'yxatga olingan. So\'rovnoma tekshiruvchi (Data Reviewer) navbatiga yuborildi.',
          survey: savedSurvey,
        };
      }

      // Agar fuqaro bazada bo'lmasa -> Yangi fuqaroni yaratish
      const citizen = manager.create(CitizenEntity, {
        fullName: dto.fullName,
        birthDate: new Date(dto.birthDate),
        pinfl: dto.pinfl,
        phone: dto.phone,
        parentPhone: dto.parentPhone,
        address: dto.address,
        education: dto.education,
        specialty: dto.specialty,
        districtId: targetDistrictId,
        mahallaId: targetMahallaId,
        currentCategory: dto.mainCategory,
        currentStatusDetail: this.formatStatusSummary(dto),
      });

      const savedCitizen = await manager.save(CitizenEntity, citizen);

      // So'rovnomani saqlash (APPROVED holatda)
      const survey = manager.create(SurveyEntity, {
        citizenId: savedCitizen.id,
        citizenPinfl: dto.pinfl,
        citizenFullName: dto.fullName,
        operatorId: currentUser.id,
        districtId: targetDistrictId,
        mahallaId: targetMahallaId,
        surveyDate: new Date(dto.surveyDate),
        surveyMethod: dto.surveyMethod,
        mainCategory: dto.mainCategory,
        officialWorkplace: dto.officialWorkplace,
        unofficialActivityType: dto.unofficialActivityType,
        noWishReason: dto.noWishReason,
        unemployedDirections: dto.unemployedDirections,
        unemployedAdditionalNote: dto.unemployedAdditionalNote,
        otherReasonNote: dto.otherReasonNote,
        citizenSigned: dto.citizenSigned ?? true,
        operatorSigned: dto.operatorSigned ?? true,
        status: SurveyStatus.APPROVED,
        dataSource: DataSource.SURVEY_OPERATOR,
      });

      const savedSurvey = await manager.save(SurveyEntity, survey);

      // EmploymentHistory ga birlamchi log yozuvi kiritiladi
      const history = manager.create(EmploymentHistoryEntity, {
        citizenId: savedCitizen.id,
        surveyId: savedSurvey.id,
        previousCategory: undefined,
        previousDetails: undefined,
        newCategory: dto.mainCategory,
        newDetails: { note: newDetails, raw: dto },
        changedById: currentUser.id,
        changeReason: 'Birlamchi raqamli so\'rovnoma to\'ldirildi',
        dataSource: DataSource.SURVEY_OPERATOR,
      });

      await manager.save(EmploymentHistoryEntity, history);

      return {
        isConflict: false,
        message: 'So\'rovnoma muvaffaqiyatli qabul qilindi va bazaga kiritildi',
        survey: savedSurvey,
        citizen: savedCitizen,
      };
    });
  }

  /**
   * So'rovnomalar ro'yxati (Operator, District Admin, Super Admin va Reviewer uchun ruxsatlar bilan)
   */
  async findAll(filterDto: FilterSurveyDto & { districtId?: string }, currentUser: UserEntity) {
    const page = Number(filterDto.page) || 1;
    const limit = Number(filterDto.limit) || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.surveyRepository
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.citizen', 'citizen')
      .leftJoinAndSelect('s.operator', 'operator')
      .leftJoinAndSelect('s.district', 'district')
      .leftJoinAndSelect('s.mahalla', 'mahalla');

    if (currentUser.roleCode === UserRole.MAHALLA_OPERATOR) {
      queryBuilder.andWhere('s.mahallaId = :operatorMahallaId', {
        operatorMahallaId: currentUser.mahallaId,
      });
    } else if (currentUser.roleCode === UserRole.DISTRICT_ADMIN) {
      queryBuilder.andWhere('s.districtId = :adminDistrictId', {
        adminDistrictId: currentUser.districtId,
      });
      if (filterDto.mahallaId) {
        queryBuilder.andWhere('s.mahallaId = :mahallaId', {
          mahallaId: filterDto.mahallaId,
        });
      }
    } else {
      if (filterDto.districtId) {
        queryBuilder.andWhere('s.districtId = :districtId', {
          districtId: filterDto.districtId,
        });
      }
      if (filterDto.mahallaId) {
        queryBuilder.andWhere('s.mahallaId = :mahallaId', {
          mahallaId: filterDto.mahallaId,
        });
      }
    }

    if (filterDto.search && filterDto.search.trim()) {
      const cleanSearch = filterDto.search.trim();
      const cleanDigits = cleanSearch.replace(/\D/g, '');
      if (cleanDigits.length >= 4) {
        queryBuilder.andWhere(
          '(LOWER(s.citizenFullName) LIKE LOWER(:search) OR s.citizenPinfl LIKE :digits OR citizen.phone LIKE :search OR citizen.parentPhone LIKE :search OR REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(citizen.phone, \'\'), \' \', \'\'), \'-\', \'\'), \'(\', \'\'), \')\', \'\') LIKE :digits)',
          { search: `%${cleanSearch}%`, digits: `%${cleanDigits}%` },
        );
      } else {
        queryBuilder.andWhere(
          '(LOWER(s.citizenFullName) LIKE LOWER(:search) OR s.citizenPinfl LIKE :search OR citizen.phone LIKE :search)',
          { search: `%${cleanSearch}%` },
        );
      }
    }

    if (filterDto.status) {
      queryBuilder.andWhere('s.status = :status', { status: filterDto.status });
    }

    if (filterDto.category) {
      queryBuilder.andWhere('s.mainCategory = :category', {
        category: filterDto.category,
      });
    }

    if (filterDto.method) {
      queryBuilder.andWhere('s.surveyMethod = :method', {
        method: filterDto.method,
      });
    }

    if (filterDto.operatorId) {
      queryBuilder.andWhere('s.operatorId = :operatorId', {
        operatorId: filterDto.operatorId,
      });
    }

    if (filterDto.startDate) {
      queryBuilder.andWhere('s.surveyDate >= :startDate', {
        startDate: filterDto.startDate,
      });
    }

    if (filterDto.endDate) {
      queryBuilder.andWhere('s.surveyDate <= :endDate', {
        endDate: filterDto.endDate,
      });
    }

    queryBuilder
      .orderBy('s.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Bitta so'rovnomani ID bo'yicha to'liq ko'rish
   */
  async findOne(id: string, currentUser: UserEntity) {
    const survey = await this.surveyRepository.findOne({
      where: { id },
      relations: {
        citizen: true,
        operator: true,
        district: true,
        mahalla: true,
        reviewer: true,
        employmentHistories: true,
      },
    });

    if (!survey) {
      throw new NotFoundException(`So'rovnoma topilmadi (ID: ${id})`);
    }

    if (
      currentUser.roleCode === UserRole.MAHALLA_OPERATOR &&
      survey.mahallaId !== currentUser.mahallaId
    ) {
      throw new ForbiddenException('Siz faqat o\'z mahallangiz so\'rovnomalarini ko\'rishingiz mumkin');
    }

    if (
      currentUser.roleCode === UserRole.DISTRICT_ADMIN &&
      survey.districtId !== currentUser.districtId
    ) {
      throw new ForbiddenException('Siz faqat o\'z tumaningiz so\'rovnomalarini ko\'rishingiz mumkin');
    }

    return survey;
  }

  // ==========================================
  // YORDAMCHI FORMATLASH METODLARI
  // ==========================================
  private extractDetails(dto: CreateSurveyDto): string {
    switch (dto.mainCategory) {
      case EmploymentCategory.OFFICIALLY_EMPLOYED:
        return dto.officialWorkplace || 'Rasmiy band';
      case EmploymentCategory.UNOFFICIALLY_EMPLOYED:
        return dto.unofficialActivityType || 'Norasmiy band';
      case EmploymentCategory.NO_WISH_TO_WORK:
        return `Istagi yo'q: ${this.translateNoWish(dto.noWishReason)}`;
      case EmploymentCategory.UNEMPLOYED:
        return `Ishsiz: ${(dto.unemployedDirections || []).join(', ')}${
          dto.unemployedAdditionalNote ? ` (${dto.unemployedAdditionalNote})` : ''
        }`;
      case EmploymentCategory.OTHER:
        return dto.otherReasonNote || 'Boshqa sabab';
      default:
        return 'Aniqlanmagan';
    }
  }

  private formatStatusSummary(dto: CreateSurveyDto): string {
    return this.extractDetails(dto);
  }

  private translateNoWish(reason?: NoWishReason): string {
    switch (reason) {
      case NoWishReason.CHILD_CARE:
        return 'Bola tarbiyasida';
      case NoWishReason.HOUSEWIFE:
        return 'Uy bekasi';
      case NoWishReason.WEALTHY_FAMILY:
        return 'O\'ziga to\'q oila';
      case NoWishReason.APPLICANT:
        return 'Abituriyent';
      default:
        return 'Sabab ko\'rsatilmagan';
    }
  }
}
