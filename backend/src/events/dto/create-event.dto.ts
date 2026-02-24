import { IsString, IsNotEmpty, IsOptional, IsDateString, IsInt, IsBoolean, IsUrl, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({ description: 'Título do evento' })
  @IsString()
  @IsNotEmpty({ message: 'Título é obrigatório' })
  title: string;

  @ApiProperty({ description: 'Descrição completa do evento' })
  @IsString()
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  description: string;

  @ApiProperty({ description: 'Local do evento' })
  @IsString()
  @IsNotEmpty({ message: 'Local é obrigatório' })
  location: string;

  @ApiProperty({ description: 'Data e hora de início', example: '2024-12-25T14:00:00Z' })
  @IsDateString({}, { message: 'Data de início inválida' })
  @IsNotEmpty({ message: 'Data de início é obrigatória' })
  startAt: string;

  @ApiProperty({ description: 'Data e hora de término', example: '2024-12-25T18:00:00Z' })
  @IsDateString({}, { message: 'Data de término inválida' })
  @IsNotEmpty({ message: 'Data de término é obrigatória' })
  endAt: string;

  @ApiPropertyOptional({ description: 'Número máximo de participantes' })
  @IsOptional()
  @IsInt({ message: 'Máximo de participantes deve ser um número inteiro' })
  @Min(1, { message: 'Deve permitir pelo menos 1 participante' })
  maxParticipants?: number;

  @ApiPropertyOptional({ description: 'Evento é público (visível para todos)', default: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Requer membership no clube de vantagens', default: false })
  @IsOptional()
  @IsBoolean()
  requiresMembership?: boolean;

  @ApiPropertyOptional({ description: 'URL da imagem do evento' })
  @IsOptional()
  @IsUrl({}, { message: 'URL da imagem inválida' })
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Categoria do evento', example: 'Pedal, Oficina, Encontro' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'ID da loja organizadora (se aplicável)' })
  @IsOptional()
  @IsString()
  storeId?: string;
}
