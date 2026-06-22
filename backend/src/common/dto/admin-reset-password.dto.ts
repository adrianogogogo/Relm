import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * DTO para o ADMIN_RELM redefinir a senha de qualquer usuário (Customer,
 * StoreUser). Diferente de ChangePasswordDto, não exige a senha atual: o admin
 * define diretamente a nova senha. Mínimo de 6 caracteres; limite de 72
 * alinhado ao bcrypt.
 */
export class AdminResetPasswordDto {
  @IsString({ message: 'A senha é obrigatória' })
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  @MaxLength(72, { message: 'A senha deve ter no máximo 72 caracteres' })
  password: string;
}
