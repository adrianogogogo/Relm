import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class ApproveProductDto {
  @ApiPropertyOptional({ description: 'Notas do admin sobre a aprovação' })
  @IsString()
  @IsOptional()
  adminNotes?: string;
}
