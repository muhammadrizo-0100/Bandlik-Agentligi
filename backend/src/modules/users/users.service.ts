import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../../database/entities/user.entity';
import { RoleEntity } from '../../database/entities/role.entity';
import { DistrictEntity } from '../../database/entities/district.entity';
import { MahallaEntity } from '../../database/entities/mahalla.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterUserDto } from './dto/filter-user.dto';
import { UserRole } from '../../database/enums';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(DistrictEntity)
    private readonly districtRepository: Repository<DistrictEntity>,
    @InjectRepository(MahallaEntity)
    private readonly mahallaRepository: Repository<MahallaEntity>,
  ) {}

  /**
   * Yangi xodim hisobini yaratish (Super Admin yoki District Admin)
   */
  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    // 1. Username band emasligini tekshirish
    const existing = await this.userRepository.findOne({
      where: { username: createUserDto.username },
    });

    if (existing) {
      throw new ConflictException(
        `"${createUserDto.username}" loginli foydalanuvchi allaqachon mavjud`,
      );
    }

    // 2. Rolni tekshirish
    const roleCode = createUserDto.role || UserRole.MAHALLA_OPERATOR;
    const role = await this.roleRepository.findOne({ where: { code: roleCode } });
    if (!role) {
      throw new NotFoundException(`Rol topilmadi: ${roleCode}`);
    }

    // 3. Tuman va Mahalla tekshiruvi
    let district: DistrictEntity | undefined = undefined;
    let mahalla: MahallaEntity | undefined = undefined;

    if (roleCode === UserRole.DISTRICT_ADMIN) {
      if (!createUserDto.districtId) {
        throw new BadRequestException('Tuman administratori uchun tuman biriktirilishi shart');
      }
      const foundDistrict = await this.districtRepository.findOne({
        where: { id: createUserDto.districtId },
      });
      if (!foundDistrict) {
        throw new NotFoundException(`Tuman topilmadi: ${createUserDto.districtId}`);
      }
      district = foundDistrict;
    } else if (roleCode === UserRole.MAHALLA_OPERATOR) {
      if (!createUserDto.mahallaId) {
        throw new BadRequestException(
          'Mahalla yetakchisi (Operator) roli uchun mahalla biriktirilishi shart',
        );
      }
      const foundMahalla = await this.mahallaRepository.findOne({
        where: { id: createUserDto.mahallaId },
        relations: { district: true },
      });
      if (!foundMahalla) {
        throw new NotFoundException(
          `Biriktirilayotgan mahalla topilmadi (ID: ${createUserDto.mahallaId})`,
        );
      }
      mahalla = foundMahalla;
      district = foundMahalla.district;
    } else {
      if (createUserDto.districtId) {
        const foundDistrict = await this.districtRepository.findOne({
          where: { id: createUserDto.districtId },
        });
        if (foundDistrict) district = foundDistrict;
      }
      if (createUserDto.mahallaId) {
        const foundMahalla = await this.mahallaRepository.findOne({
          where: { id: createUserDto.mahallaId },
        });
        if (foundMahalla) mahalla = foundMahalla;
      }
    }

    // 4. Parolni hash qilish
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(createUserDto.password, salt);

    // 5. Saqlash
    const user = this.userRepository.create({
      username: createUserDto.username,
      email: createUserDto.email || undefined,
      fullName: createUserDto.fullName,
      phone: createUserDto.phone,
      passwordHash,
      role,
      roleId: role.id,
      roleCode: role.code,
      district,
      districtId: district?.id || undefined,
      mahalla,
      mahallaId: mahalla?.id || undefined,
      isActive: true,
    });

    return this.userRepository.save(user);
  }

  /**
   * Barcha xodimlar ro'yxatini filtr va qidiruv bilan olish
   */
  async findAll(filterDto: FilterUserDto & { districtId?: string }) {
    const page = Number(filterDto.page) || 1;
    const limit = Number(filterDto.limit) || 50;
    const skip = (page - 1) * limit;
    const { search, role, mahallaId, districtId, isActive } = filterDto;

    const queryBuilder = this.userRepository
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.role', 'role')
      .leftJoinAndSelect('u.district', 'district')
      .leftJoinAndSelect('u.mahalla', 'mahalla');

    if (search) {
      queryBuilder.andWhere(
        '(LOWER(u.fullName) LIKE LOWER(:search) OR LOWER(u.username) LIKE LOWER(:search) OR u.phone LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (role) {
      queryBuilder.andWhere('u.roleCode = :role', { role });
    }

    if (districtId) {
      queryBuilder.andWhere('u.districtId = :districtId', { districtId });
    }

    if (mahallaId) {
      queryBuilder.andWhere('u.mahallaId = :mahallaId', { mahallaId });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('u.isActive = :isActive', { isActive });
    }

    queryBuilder
      .orderBy('u.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    const formattedItems = items.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      fullName: u.fullName,
      phone: u.phone,
      role: u.roleCode || u.role?.code,
      roleCode: u.roleCode || u.role?.code,
      roleName: u.role?.name || u.roleCode,
      districtId: u.districtId,
      districtName: u.district?.name,
      mahallaId: u.mahallaId,
      mahallaName: u.mahalla?.name,
      isActive: u.isActive,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    return {
      items: formattedItems as any,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Xodimni ID bo'yicha olish
   */
  async findById(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: { role: true, district: true, mahalla: true },
    });
    if (!user) {
      throw new NotFoundException(`Foydalanuvchi topilmadi (ID: ${id})`);
    }
    return user;
  }

  /**
   * Login uchun username yoki email bo'yicha qidirish
   */
  async findByUsernameOrEmail(identifier: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: [{ username: identifier }, { email: identifier }],
      relations: { role: true, district: true, mahalla: true },
    });
  }

  /**
   * Xodim ma'lumotlarini yangilash
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    const user = await this.findById(id);

    // Parol o'zgargan bo'lsa
    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(updateUserDto.password, salt);
    }

    if (updateUserDto.fullName) user.fullName = updateUserDto.fullName;
    if (updateUserDto.phone !== undefined) user.phone = updateUserDto.phone;
    if (updateUserDto.email !== undefined) user.email = updateUserDto.email;
    if (updateUserDto.isActive !== undefined) user.isActive = updateUserDto.isActive;

    // Rol o'zgargan bo'lsa
    if (updateUserDto.role) {
      const role = await this.roleRepository.findOne({ where: { code: updateUserDto.role } });
      if (role) {
        user.role = role;
        user.roleId = role.id;
        user.roleCode = role.code;
      }
    }

    // Mahalla o'zgargan bo'lsa
    if (updateUserDto.mahallaId !== undefined) {
      if (updateUserDto.mahallaId) {
        const mahalla = await this.mahallaRepository.findOne({
          where: { id: updateUserDto.mahallaId },
          relations: { district: true },
        });
        if (mahalla) {
          user.mahalla = mahalla;
          user.mahallaId = mahalla.id;
          user.district = mahalla.district;
          user.districtId = mahalla.districtId;
        }
      } else {
        user.mahalla = undefined;
        user.mahallaId = undefined;
      }
    }

    return this.userRepository.save(user);
  }

  /**
   * Xodimni o'chirish (Faqat Super Admin)
   */
  async remove(id: string): Promise<void> {
    const user = await this.findById(id);

    if (user.roleCode === UserRole.SUPER_ADMIN) {
      const adminCount = await this.userRepository.count({
        where: { roleCode: UserRole.SUPER_ADMIN },
      });
      if (adminCount <= 1) {
        throw new BadRequestException(
          'Tizimdagi yagona Super Admin hisobini o\'chirish mumkin emas',
        );
      }
    }

    await this.userRepository.remove(user);
  }
}
