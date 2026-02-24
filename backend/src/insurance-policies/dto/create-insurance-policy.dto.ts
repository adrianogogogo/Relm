import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsOptional, IsNumber, IsInt, Min, Max } from 'class-validator';

export class CreateInsurancePolicyDto {
  @ApiProperty({ example: 'POL-2026-001234' })
  @IsString()
  @IsNotEmpty()
  policyNumber: string;

  @ApiProperty({ example: 'abc123-uuid', required: false })
  @IsOptional()
  @IsString()
  quoteId?: string;

  @ApiProperty({ example: 'customer-uuid' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ example: 'product-uuid', required: false })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiProperty({ example: 'Porto Seguro' })
  @IsString()
  @IsNotEmpty()
  insuranceCompany: string;

  @ApiProperty({ example: 15000.00 })
  @IsNumber()
  @Min(0)
  policyValue: number;

  @ApiProperty({ example: 20000.00 })
  @IsNumber()
  @Min(0)
  coverageAmount: number;

  @ApiProperty({ example: 500.00, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deductible?: number;

  @ApiProperty({ example: '2026-03-01' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ example: '2027-03-01' })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({ example: 'ACTIVE', enum: ['ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED'], default: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ example: 150.00, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyPayment?: number;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  paymentDay?: number;

  @ApiProperty({ example: 'https://example.com/policy.pdf', required: false })
  @IsOptional()
  @IsString()
  policyDocumentUrl?: string;

  @ApiProperty({ example: 'Cliente preferencial, desconto aplicado', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
