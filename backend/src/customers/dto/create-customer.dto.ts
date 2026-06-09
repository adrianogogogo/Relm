import { IsEmail, IsNotEmpty, IsOptional, IsString, IsBoolean, IsUUID } from 'class-validator';

export class CreateCustomerDto {
  @IsNotEmpty({ message: 'Nome completo é obrigatório' })
  @IsString()
  fullName: string;

  @IsNotEmpty({ message: 'Email é obrigatório' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  cpf?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsUUID('4', { message: 'ID da loja inválido' })
  storeId?: string | null;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  marketingConsent?: boolean;
}
