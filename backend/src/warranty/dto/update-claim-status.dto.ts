import { IsOptional, IsString, IsInt, IsBoolean, MaxLength } from 'class-validator';

export class UpdateClaimStatusDto {
  @IsOptional()
  @IsInt()
  statusId?: number;

  // "passa a bola": novo responsável. Vazio = mantém com quem agiu.
  @IsOptional()
  @IsString()
  ballOwnerId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;

  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}
