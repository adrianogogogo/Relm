import { IsString, IsNotEmpty, IsOptional, IsNumber, IsPositive } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMembershipDto {
  @ApiProperty({ description: 'ID do cliente' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiPropertyOptional({ description: 'Tier inicial', default: 'BRONZE' })
  @IsOptional()
  @IsString()
  tier?: string;
}

export class AddPointsDto {
  @ApiProperty({ description: 'Quantidade de pontos a adicionar' })
  @IsNumber()
  @IsPositive()
  points: number;

  @ApiProperty({ description: 'Motivo da adição de pontos' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({ description: 'Tipo de referência (WARRANTY, PURCHASE, EVENT)' })
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiPropertyOptional({ description: 'ID da referência' })
  @IsOptional()
  @IsString()
  referenceId?: string;
}
