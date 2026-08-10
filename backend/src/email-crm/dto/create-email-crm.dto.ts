import { IsString, IsNotEmpty, IsOptional, IsEnum, IsObject } from 'class-validator';

export enum CampaignSegmentEnum {
  ALL_CUSTOMERS = 'ALL_CUSTOMERS',
  PLUS_ONLY = 'PLUS_ONLY',
  EXPIRED_POINTS = 'EXPIRED_POINTS',
  STORES_ONLY = 'STORES_ONLY',
}

export class CreateEmailTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  bodyHtml: string;

  @IsObject()
  @IsOptional()
  variablesJson?: Record<string, any>;
}

export class CreateEmailCampaignDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  templateId: string;

  @IsEnum(CampaignSegmentEnum)
  @IsOptional()
  targetSegment?: CampaignSegmentEnum;
}

export class SendTestEmailDto {
  @IsString()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  bodyHtml: string;
}
