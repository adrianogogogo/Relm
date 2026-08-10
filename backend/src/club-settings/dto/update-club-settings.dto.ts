import { IsOptional, IsNumber, Min } from 'class-validator';

export class UpdateClubSettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  plusAnnualFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pointValueBrl?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  referralBonusPoints?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  birthdayBonusPoints?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  eventParticipationPoints?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  careQuotaAnnualRevisions?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  plusPointsMultiplier?: number;

  // Min(0) e não Min(1): zerar desliga o saldo mensal do Plus.
  @IsOptional()
  @IsNumber()
  @Min(0)
  plusMonthlyPoints?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  voucherValidityDays?: number;
}
