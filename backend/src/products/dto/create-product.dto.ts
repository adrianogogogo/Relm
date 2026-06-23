import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MaxLength(120)
  serialNumber: string;

  @IsString()
  @MaxLength(120)
  model: string;

  @IsString()
  @MaxLength(60)
  productType: string; // Road, MTB, Gravel, E-bike, Acessórios

  @IsOptional()
  @IsString()
  @MaxLength(80)
  brand?: string;

  @IsOptional()
  @IsString()
  storeId?: string;
}
