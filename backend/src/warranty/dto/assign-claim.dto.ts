import { IsOptional, IsString } from 'class-validator';

export class AssignClaimDto {
  // userId do responsável; null/ausente remove a atribuição.
  @IsOptional()
  @IsString()
  userId?: string | null;
}
