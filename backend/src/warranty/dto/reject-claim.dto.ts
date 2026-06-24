import { IsString, MaxLength } from 'class-validator';

export class RejectClaimDto {
  @IsString()
  @MaxLength(1000)
  reason: string;
}
