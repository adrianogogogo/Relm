import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateCustomerPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'A senha antiga deve ter pelo menos 6 caracteres' })
  @MaxLength(72, { message: 'A senha antiga deve ter no máximo 72 caracteres' })
  oldPassword: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'A nova senha deve ter pelo menos 6 caracteres' })
  @MaxLength(72, { message: 'A nova senha deve ter no máximo 72 caracteres' })
  newPassword: string;
}
