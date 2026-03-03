import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class RejectProductDto {
  @ApiProperty({ description: 'Motivo da rejeição' })
  @IsString()
  @IsNotEmpty()
  rejectionReason: string;

  @ApiPropertyOptional({ description: 'Notas do admin' })
  @IsString()
  @IsOptional()
  adminNotes?: string;
}
