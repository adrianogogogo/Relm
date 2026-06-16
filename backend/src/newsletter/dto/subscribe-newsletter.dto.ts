import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

export class SubscribeNewsletterDto {
  @IsNotEmpty({ message: 'Email é obrigatório' })
  @IsEmail({}, { message: 'Email inválido' })
  @MaxLength(255, { message: 'Email deve ter no máximo 255 caracteres' })
  email: string;
}
