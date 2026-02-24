import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsInt,
  IsDateString,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { BenefitCategory } from '@prisma/client';

export class CreateBenefitDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  terms?: string;

  @IsEnum(BenefitCategory)
  @IsOptional()
  category?: BenefitCategory;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(100)
  discountPercentage?: number;

  @IsString()
  @IsOptional()
  partnerName?: string;

  @IsString()
  @IsOptional()
  partnerLogo?: string;

  @IsString()
  @IsOptional()
  howToRedeem?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsDateString()
  @IsNotEmpty()
  validFrom: string;

  @IsDateString()
  @IsNotEmpty()
  validUntil: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @IsString()
  @IsOptional()
  targetRole?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  maxRedemptions?: number;
}
