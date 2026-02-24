import { IsEmail, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateStoreUserDto {
  @IsUUID()
  storeId: string;

  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  password: string;

  @IsString()
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  name: string;
}
