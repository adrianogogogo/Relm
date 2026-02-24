#!/bin/bash
# Script to create Insurance DTOs and update Service/Controller

cd /var/www/relm-careplus-prod/backend

echo "=== 1. CREATE DTO DIRECTORY ==="
mkdir -p src/insurance/dto

echo ""
echo "=== 2. CREATE DTOs ==="

# Create Quote DTOs
cat > src/insurance/dto/create-quote.dto.ts << 'EOFDTO1'
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDecimal, IsOptional, IsNumber } from 'class-validator';

export class CreateQuoteDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '11987654321' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '12345678900' })
  @IsString()
  @IsNotEmpty()
  cpf: string;

  @ApiProperty({ example: 5000.00 })
  @IsNumber()
  bikeValue: number;

  @ApiProperty({ example: 'São Paulo' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'SP' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: 'Mountain Bike', required: false })
  @IsString()
  @IsOptional()
  bikeModel?: string;

  @ApiProperty({ example: 'Trek', required: false })
  @IsString()
  @IsOptional()
  bikeBrand?: string;
}
EOFDTO1

# Create Policy DTOs
cat > src/insurance/dto/create-policy.dto.ts << 'EOFDTO2'
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreatePolicyDto {
  @ApiProperty({ example: 'uuid-of-quote', required: false })
  @IsString()
  @IsOptional()
  quoteId?: string;

  @ApiProperty({ example: 'uuid-of-customer' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ example: 'uuid-of-product', required: false })
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiProperty({ example: 'Porto Seguro' })
  @IsString()
  @IsNotEmpty()
  insuranceCompany: string;

  @ApiProperty({ example: 5000.00 })
  @IsNumber()
  bikeValue: number;

  @ApiProperty({ example: 5000.00 })
  @IsNumber()
  coverageValue: number;

  @ApiProperty({ example: 89.90 })
  @IsNumber()
  monthlyPremium: number;

  @ApiProperty({ example: 1078.80 })
  @IsNumber()
  annualPremium: number;

  @ApiProperty({ example: '2024-03-01T00:00:00.000Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2025-03-01T00:00:00.000Z' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: 'Cobertura Completa', required: false })
  @IsString()
  @IsOptional()
  coverageType?: string;

  @ApiProperty({ example: 500.00, required: false })
  @IsNumber()
  @IsOptional()
  deductible?: number;

  @ApiProperty({ example: 'Apólice gerada a partir da cotação SEG-2024-00001', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
EOFDTO2

# Create Update DTOs
cat > src/insurance/dto/update-quote.dto.ts << 'EOFDTO3'
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateQuoteDto {
  @ApiProperty({ example: 'APPROVED', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 89.90, required: false })
  @IsNumber()
  @IsOptional()
  quoteValue?: number;

  @ApiProperty({ example: 'Porto Seguro', required: false })
  @IsString()
  @IsOptional()
  insuranceCompany?: string;
}
EOFDTO3

cat > src/insurance/dto/update-policy.dto.ts << 'EOFDTO4'
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UpdatePolicyDto {
  @ApiProperty({ example: 'CANCELLED', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: '2025-12-31T23:59:59.000Z', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ example: 'Cancelada a pedido do cliente', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
EOFDTO4

# Create index
cat > src/insurance/dto/index.ts << 'EOFDTO5'
export * from './create-quote.dto';
export * from './create-policy.dto';
export * from './update-quote.dto';
export * from './update-policy.dto';
EOFDTO5

echo "✅ DTOs created!"

ls -lh src/insurance/dto/

