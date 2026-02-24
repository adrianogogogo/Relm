import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsOptional, IsInt, IsBoolean, Min } from 'class-validator';

export class CreateEventDto {
  @ApiProperty({ example: 'Pedal Noturno Relm Bikes' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Pedal noturno pelas ruas de São Paulo' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'Parque Ibirapuera - São Paulo, SP' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({ example: '2026-03-15T19:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  startAt: string;

  @ApiProperty({ example: '2026-03-15T22:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  endAt: string;

  @ApiProperty({ example: 50, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxParticipants?: number;

  @ApiProperty({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
