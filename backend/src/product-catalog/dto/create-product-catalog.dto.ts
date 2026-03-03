import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsInt, IsDecimal, IsOptional, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductCatalogDto {
  @ApiProperty({ description: 'Nome do produto', example: 'Bicicleta Relm Road Pro 2024' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Categoria do produto', enum: ['BICYCLE', 'ACCESSORY'], example: 'BICYCLE' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['BICYCLE', 'ACCESSORY'])
  category: string;

  @ApiPropertyOptional({ description: 'Tipo/modelo do produto', example: 'Road Bike' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ description: 'Marca do produto', example: 'Relm Bikes', default: 'Relm Bikes' })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional({ description: 'Modelo específico', example: 'Pro 2024' })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({ description: 'Descrição detalhada do produto' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Requer número de série?', default: true })
  @IsBoolean()
  @IsOptional()
  requiresSerial?: boolean;

  @ApiPropertyOptional({ description: 'URL da imagem do produto' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Produto ativo?', default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  // Garantia padrão
  @ApiPropertyOptional({ description: 'Tem garantia padrão?', default: false })
  @IsBoolean()
  @IsOptional()
  hasStandardWarranty?: boolean;

  @ApiPropertyOptional({ description: 'Meses de garantia padrão', example: 12 })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  standardWarrantyMonths?: number;

  // Garantia estendida
  @ApiPropertyOptional({ description: 'Pode ter garantia estendida?', default: false })
  @IsBoolean()
  @IsOptional()
  canExtendWarranty?: boolean;

  @ApiPropertyOptional({ description: 'Meses de garantia estendida', example: 24 })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  extendedWarrantyMonths?: number;

  @ApiPropertyOptional({ description: 'Preço sugerido da garantia estendida', example: 350.00 })
  @IsOptional()
  @Type(() => Number)
  extendedWarrantyPrice?: number;

  // Clube
  @ApiPropertyOptional({ description: 'Pontos base do clube ao registrar', example: 100, default: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  clubPointsBase?: number;
}
