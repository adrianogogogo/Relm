import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateCustomerProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(150, { message: 'Nome completo deve ter no máximo 150 caracteres' })
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30, { message: 'Telefone deve ter no máximo 30 caracteres' })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  zipCode?: string;

  @IsOptional()
  @IsBoolean()
  marketingConsent?: boolean;
}
