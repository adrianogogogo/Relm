import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class ApproveSolutionDto {
  @IsBoolean()
  approved: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  rejectionReason?: string;
}
