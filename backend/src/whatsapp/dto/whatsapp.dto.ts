import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsArray,
} from 'class-validator';

export enum BroadcastTarget {
  ALL = 'ALL',
  CARE = 'CARE',
  PLUS = 'PLUS',
  CUSTOM = 'CUSTOM',
}

export class UpdateWhatsappSettingsDto {
  @IsOptional()
  @IsString()
  number?: string;

  @IsOptional()
  @IsString()
  cloudToken?: string;

  @IsOptional()
  @IsString()
  phoneNumberId?: string;

  @IsOptional()
  @IsString()
  templateName?: string;
}

export class BroadcastDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  message: string;

  @IsEnum(BroadcastTarget)
  target: BroadcastTarget;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  customerIds?: string[];
}
