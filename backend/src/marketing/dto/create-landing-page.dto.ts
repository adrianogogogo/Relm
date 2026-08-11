import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsObject } from 'class-validator';

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

  /** PaginaGerada inteira (título, subtítulo, paleta e blocos), não só o array
   *  de blocos: a paleta vem do mesmo objeto e os dois renderizadores a leem. */
  @IsObject()
  @IsNotEmpty()
  blocksJson: Record<string, any>;

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

  @IsObject()
  @IsOptional()
  blocksJson?: Record<string, any>;

  @IsString()
  @IsOptional()
  storeId?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
