import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum ReviewAction {
  APPROVE_UPDATE = 'APPROVE_UPDATE', // Yangi anketadagi ma'lumotlarni qabul qilish va fuqaroni yangilash
  REJECT = 'REJECT',                 // Yangi anketani rad etish (asossiz/xato deb topish)
}

export class ResolveSurveyDto {
  @ApiProperty({
    enum: ReviewAction,
    example: ReviewAction.APPROVE_UPDATE,
    description: 'Qabul qilingan qaror: Yangilashni tasdiqlash yoki Rad etish',
  })
  @IsEnum(ReviewAction, { message: 'Yaroqli tekshiruv qarorini tanlang' })
  @IsNotEmpty({ message: 'Qaror tanlanishi shart' })
  action: ReviewAction;

  @ApiProperty({
    example: 'Hujjatlar va fuqaro bilan bog\'lanib holat tekshirildi, yangi ish joyi tasdiqlandi.',
    description: 'Tekshiruvchi (Reviewer) xulosasi va izohi',
  })
  @IsString()
  @IsNotEmpty({ message: 'Tekshiruv xulosasi / izohi kiritilishi shart' })
  reviewerNote: string;
}
