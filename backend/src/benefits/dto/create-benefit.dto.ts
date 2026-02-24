import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateBenefitDto {
  @ApiProperty({ example: 'Desconto em acessórios Relm' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: '20% de desconto em todos os acessórios oficiais Relm' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'Válido em lojas físicas e online', required: false })
  @IsOptional()
  @IsString()
  terms?: string;

  @ApiProperty({ example: '2026-03-01T00:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  validFrom: string;

  @ApiProperty({ example: '2026-12-31T23:59:59Z' })
  @IsDateString()
  @IsNotEmpty()
  validUntil: string;

  @ApiProperty({ example: 'CLIENTE', required: false })
  @IsOptional()
  @IsString()
  targetRole?: string;
}
