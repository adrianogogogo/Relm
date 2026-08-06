import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

// Auto-serviço do usuário da tabela User (equipe Relm / distribuidor).
// Só nome e e-mail — role, storeId, active NUNCA são editáveis pelo próprio
// usuário (evita escalada de privilégio).
export class UpdateOwnProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
