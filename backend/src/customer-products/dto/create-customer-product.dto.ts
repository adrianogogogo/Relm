import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsDateString,
  IsNumber,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCustomerProductDto {
  @ApiProperty({ description: 'ID do cliente' })
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @ApiPropertyOptional({ description: 'ID do produto no catálogo' })
  @IsUUID()
  @IsOptional()
  productCatalogId?: string;

  @ApiPropertyOptional({ description: 'Nome customizado do produto' })
  @IsString()
  @IsOptional()
  customName?: string;

  @ApiPropertyOptional({ description: 'Número de série do produto' })
  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.invoiceUrl) // Obrigatório se não tiver nota
  serialNumber?: string;

  @ApiPropertyOptional({ description: 'Data de compra', example: '2024-01-15' })
  @IsDateString()
  @IsOptional()
  purchaseDate?: string;

  @ApiPropertyOptional({ description: 'Número da nota fiscal' })
  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @ApiPropertyOptional({ description: 'URL da nota fiscal (upload)' })
  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.serialNumber) // Obrigatório se não tiver serial
  invoiceUrl?: string;

  @ApiPropertyOptional({ description: 'Nome da loja' })
  @IsString()
  @IsOptional()
  storeName?: string;

  @ApiPropertyOptional({ description: 'ID da loja' })
  @IsUUID()
  @IsOptional()
  storeId?: string;

  @ApiPropertyOptional({ description: 'Preço de compra', example: 3500.00 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  purchasePrice?: number;

  @ApiPropertyOptional({ description: 'Valor declarado do produto', example: 3500.00 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  productValue?: number;

  @ApiPropertyOptional({ description: 'Notas do cliente' })
  @IsString()
  @IsOptional()
  notes?: string;
}
