import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CancelWarrantyDto {
  @ApiProperty({ description: 'Motivo do cancelamento' })
  @IsString()
  @IsNotEmpty()
  cancellationReason: string;

  @ApiPropertyOptional({ description: 'Notas adicionais' })
  @IsString()
  @IsOptional()
  notes?: string;
}
