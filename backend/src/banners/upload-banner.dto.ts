import { IsString, IsOptional } from 'class-validator';

export class UploadBannerDto {
  @IsString()
  @IsOptional()
  bannerId?: string;
}
