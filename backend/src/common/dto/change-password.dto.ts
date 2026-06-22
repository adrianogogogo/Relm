import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * DTO compartilhado para troca de senha do usuário logado (User, StoreUser e
 * Customer). Não revela regras além do mínimo: senha atual obrigatória e nova
 * senha com no mínimo 8 caracteres (limite de 72 alinhado ao bcrypt).
 */
export class ChangePasswordDto {
  @IsString({ message: 'Senha atual é obrigatória' })
  @MinLength(1, { message: 'Senha atual é obrigatória' })
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: 'A nova senha deve ter no mínimo 8 caracteres' })
  @MaxLength(72, { message: 'A nova senha deve ter no máximo 72 caracteres' })
  newPassword: string;
}
