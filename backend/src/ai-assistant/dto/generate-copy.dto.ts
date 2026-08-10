import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class GenerateCopyDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsString()
  @IsOptional()
  type?: 'LANDING_PAGE' | 'EMAIL_SUBJECT' | 'DAILY_RIDER_MESSAGE' | 'CAMPAIGN_COPY';

  @IsString()
  @IsOptional()
  targetAudience?: string;

  @IsString()
  @IsOptional()
  tone?: string;

  @IsString()
  @IsOptional()
  model?: string;
}
