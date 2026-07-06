import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateCustomerDto {
  @IsNotEmpty({ message: 'Nome completo é obrigatório' })
  @IsString()
  @MaxLength(150, { message: 'Nome completo deve ter no máximo 150 caracteres' })
  fullName: string;

  @IsNotEmpty({ message: 'Email é obrigatório' })
  @IsEmail({}, { message: 'Email inválido' })
  @MaxLength(255, { message: 'Email deve ter no máximo 255 caracteres' })
  email: string;

  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  @IsString()
  @MaxLength(30, { message: 'Telefone deve ter no máximo 30 caracteres' })
  phone: string;

  @IsOptional()
  @IsString()
  @MaxLength(14, { message: 'CPF deve ter no máximo 14 caracteres' })
  cpf?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Endereço deve ter no máximo 255 caracteres' })
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Cidade deve ter no máximo 100 caracteres' })
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Estado deve ter no máximo 50 caracteres' })
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10, { message: 'CEP deve ter no máximo 10 caracteres' })
  zipCode?: string;

  @IsOptional()
  @IsUUID('4', { message: 'ID da loja inválido' })
  storeId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Observações devem ter no máximo 1000 caracteres' })
  notes?: string;

  @IsOptional()
  @IsBoolean()
  marketingConsent?: boolean;

  @IsOptional()
  @IsString()
  currentTier?: 'CARE' | 'PLUS';
}
