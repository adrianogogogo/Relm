import { IsOptional, IsString, IsIn, IsBoolean, IsNumber, MaxLength, Min } from 'class-validator';

export class CreateSolutionDto {
  @IsString()
  @MaxLength(2000)
  description: string;

  @IsOptional()
  @IsIn(['reparo', 'troca', 'reembolso', 'cortesia', 'outro'])
  solutionType?: string;

  @IsOptional()
  @IsBoolean()
  hasCost?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costValue?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  costNotes?: string;
}
