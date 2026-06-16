import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CustomerRegisterDto {
  @IsEmail()
  @MaxLength(255, { message: 'Email deve ter no máximo 255 caracteres' })
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(72, { message: 'Senha deve ter no máximo 72 caracteres' })
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150, { message: 'Nome completo deve ter no máximo 150 caracteres' })
  fullName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30, { message: 'Telefone deve ter no máximo 30 caracteres' })
  phone: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100, { message: 'Número da nota fiscal deve ter no máximo 100 caracteres' })
  invoiceNumber: string;
}
