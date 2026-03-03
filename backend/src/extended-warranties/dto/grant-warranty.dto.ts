import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsIn,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GrantWarrantyDto {
  @ApiProperty({ description: 'ID do produto registrado' })
  @IsUUID()
  @IsNotEmpty()
  customerProductId: string;

  @ApiProperty({ description: 'ID do cliente' })
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({
    description: 'Tipo de garantia',
    enum: ['PURCHASED', 'GRANTED', 'PROMOTIONAL', 'CLUB_REDEMPTION'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['PURCHASED', 'GRANTED', 'PROMOTIONAL', 'CLUB_REDEMPTION'])
  type: string;

  @ApiProperty({ description: 'Data de início', example: '2024-01-15' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ description: 'Duração em meses', example: 24 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  durationMonths: number;

  @ApiPropertyOptional({ description: 'Preço pago (0 se brinde)', example: 350.00, default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  pricePaid?: number;

  @ApiPropertyOptional({
    description: 'Status do pagamento',
    enum: ['PENDING', 'PAID', 'REFUNDED', 'FREE'],
    default: 'FREE',
  })
  @IsString()
  @IsOptional()
  @IsIn(['PENDING', 'PAID', 'REFUNDED', 'FREE'])
  paymentStatus?: string;

  @ApiPropertyOptional({ description: 'Método de pagamento' })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Pontos do clube usados', default: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  clubPointsUsed?: number;

  @ApiPropertyOptional({ description: 'Número de claims permitidos', default: 1 })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  claimsAllowed?: number;

  @ApiPropertyOptional({ description: 'Notas sobre a garantia' })
  @IsString()
  @IsOptional()
  notes?: string;
}
