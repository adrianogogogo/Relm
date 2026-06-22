// NOTA (ORG-03): NÃO aplicamos @IsUrl em imageUrl/linkUrl. O frontend
// (BannersPage) usa caminhos RELATIVOS (ex: '/uploads/banners/banner1.png' e
// '/garantia'), que @IsUrl rejeitaria, quebrando a criação de banners em
// produção. Mantemos @IsString e removemos o import órfão de IsUrl.
import { IsString, IsOptional, IsBoolean, IsInt, IsIn } from 'class-validator';

export class CreateBannerDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsString()
  imageUrl: string;

  @IsOptional()
  @IsString()
  linkUrl?: string;

  @IsOptional()
  @IsString()
  linkText?: string;

  @IsOptional()
  @IsInt()
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsIn(['PUBLIC', 'CLIENTE', 'LOJA', 'ADMIN'])
  audience?: string;

  @IsOptional()
  @IsString()
  page?: string;
}
