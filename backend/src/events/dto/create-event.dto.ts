import { IsString, IsNotEmpty, IsDateString, IsInt, IsOptional, IsBoolean, Min } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsDateString()
  @IsNotEmpty()
  startAt: string;

  @IsDateString()
  @IsNotEmpty()
  endAt: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  maxParticipants?: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
