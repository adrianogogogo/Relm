import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * DTO para o registro PÚBLICO em eventos (POST /public/events/:id/register).
 * Aceita apenas os campos do formulário público.
 */
export class RegisterEventDto {
  @IsNotEmpty({ message: 'Email é obrigatório' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsNotEmpty({ message: 'Nome completo é obrigatório' })
  @IsString()
  @MaxLength(150)
  fullName: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}
