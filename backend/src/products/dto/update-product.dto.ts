import { IsOptional, IsString, MaxLength } from 'class-validator';

// serialNumber é imutável (chave de identidade) — não entra no update.
export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  model?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  productType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  brand?: string;

  @IsOptional()
  @IsString()
  storeId?: string;
}
