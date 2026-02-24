import {
  IsString,
  IsNotEmpty,
  IsDecimal,
  IsDateString,
  IsEnum,
  IsOptional,
  IsInt,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { InsurancePolicyStatus } from '@prisma/client';

export class CreateInsurancePolicyDto {
  @IsString()
  @IsNotEmpty()
  policyNumber: string;

  @IsUUID()
  @IsOptional()
  quoteId?: string;

  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @IsUUID()
  @IsOptional()
  productId?: string;

  @IsString()
  @IsNotEmpty()
  insuranceCompany: string;

  @IsDecimal()
  @IsNotEmpty()
  policyValue: number;

  @IsDecimal()
  @IsNotEmpty()
  coverageAmount: number;

  @IsDecimal()
  @IsOptional()
  deductible?: number;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsEnum(InsurancePolicyStatus)
  @IsOptional()
  status?: InsurancePolicyStatus;

  @IsDecimal()
  @IsOptional()
  monthlyPayment?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(31)
  paymentDay?: number;

  @IsString()
  @IsOptional()
  policyDocumentUrl?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
