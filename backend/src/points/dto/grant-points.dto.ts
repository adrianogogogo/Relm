import { IsNotEmpty, IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class GrantPointsDto {
  @IsNotEmpty()
  @IsString()
  customerId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  points: number;

  @IsOptional()
  @IsString()
  description?: string;
}
