import { IsString, IsEmail, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class CreateStoreDto {
  @IsString()
  tradeName: string;

  @IsString()
  legalName: string;

  @IsOptional()
  @IsString()
  cnpj?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aliases?: string[];

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsString()
  latitude?: string;

  @IsOptional()
  @IsString()
  longitude?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
