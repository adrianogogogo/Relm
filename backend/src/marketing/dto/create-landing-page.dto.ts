import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class CreateLandingPageDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsNotEmpty()
  blocksJson: any[];

  @IsString()
  @IsOptional()
  storeId?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class UpdateLandingPageDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  blocksJson?: any[];

  @IsString()
  @IsOptional()
  storeId?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
