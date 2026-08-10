import { Injectable } from '@nestjs/common';
import { TierLevel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateClubSettingsDto } from './dto/update-club-settings.dto';
import { ENTITLEMENTS, TierEntitlements } from '../common/entitlements';

// Os knobs que também existem no ENTITLEMENTS DERIVAM dele — repetir o literal
// aqui já tinha causado divergência (este arquivo dizia 2 revisões para o Care,
// o ENTITLEMENTS dizia 1) e o default silenciosamente venceria o código.
const DEFAULT_SETTINGS: Record<string, string> = {
  plus_annual_fee: '299.00',
  point_value_brl: '0.05',
  referral_bonus_points: '500',
  birthday_bonus_points: '200',
  event_participation_points: '100',
  care_quota_annual_revisions: String(
    ENTITLEMENTS[TierLevel.CARE].serviceAllowancePerYear.REVISION_BASIC,
  ),
  plus_points_multiplier: String(ENTITLEMENTS[TierLevel.PLUS].pointsMultiplier),
  plus_monthly_points: String(ENTITLEMENTS[TierLevel.PLUS].monthlyPoints),
  voucher_validity_days: '60',
};

@Injectable()
export class ClubSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    const rows = await this.prisma.clubSettings.findMany();
    const map: Record<string, string> = { ...DEFAULT_SETTINGS };

    for (const row of rows) {
      map[row.key] = row.value;
    }

    return {
      plusAnnualFee: Number(map.plus_annual_fee || 0),
      pointValueBrl: Number(map.point_value_brl || 0.05),
      referralBonusPoints: Number(map.referral_bonus_points || 500),
      birthdayBonusPoints: Number(map.birthday_bonus_points || 200),
      eventParticipationPoints: Number(map.event_participation_points || 100),
      careQuotaAnnualRevisions: Number(map.care_quota_annual_revisions || 2),
      plusPointsMultiplier: Number(map.plus_points_multiplier || 2.0),
      plusMonthlyPoints: Number(map.plus_monthly_points || 0),
      voucherValidityDays: Number(map.voucher_validity_days || 60),
    };
  }

  /**
   * FONTE ÚNICA dos direitos por tier em runtime: ENTITLEMENTS é o default e o
   * ClubSettings sobrescreve quem tiver chave. Antes deste método os knobs da
   * tela admin (plus_points_multiplier, care_quota_annual_revisions) eram
   * gravados e nunca lidos — o Adriano salvava e nada acontecia.
   *
   * Só os knobs com chave no ClubSettings são sobrescritos. Os demais
   * (concierge, renewalBonusPoints, delivery…) seguem lidos direto do
   * ENTITLEMENTS pelos services, sem passar por aqui.
   */
  async resolveEntitlements(tier: TierLevel): Promise<TierEntitlements> {
    const s = await this.getSettings();
    const base = ENTITLEMENTS[tier];

    if (tier === TierLevel.PLUS) {
      return {
        ...base,
        pointsMultiplier: s.plusPointsMultiplier,
        monthlyPoints: s.plusMonthlyPoints,
      };
    }

    // Care: a cota de revisão básica é calibrável. freeBasicRevisionsPerYear é
    // derivado da cota (compat frontend), então move junto — senão a tela
    // mostraria um número e o enforcement usaria outro.
    return {
      ...base,
      serviceAllowancePerYear: {
        ...base.serviceAllowancePerYear,
        REVISION_BASIC: s.careQuotaAnnualRevisions,
      },
      freeBasicRevisionsPerYear: s.careQuotaAnnualRevisions,
    };
  }

  async updateSettings(dto: UpdateClubSettingsDto) {
    const updates: { key: string; value: string }[] = [];

    if (dto.plusAnnualFee !== undefined) {
      updates.push({ key: 'plus_annual_fee', value: dto.plusAnnualFee.toString() });
    }
    if (dto.pointValueBrl !== undefined) {
      updates.push({ key: 'point_value_brl', value: dto.pointValueBrl.toString() });
    }
    if (dto.referralBonusPoints !== undefined) {
      updates.push({ key: 'referral_bonus_points', value: dto.referralBonusPoints.toString() });
    }
    if (dto.birthdayBonusPoints !== undefined) {
      updates.push({ key: 'birthday_bonus_points', value: dto.birthdayBonusPoints.toString() });
    }
    if (dto.eventParticipationPoints !== undefined) {
      updates.push({ key: 'event_participation_points', value: dto.eventParticipationPoints.toString() });
    }
    if (dto.careQuotaAnnualRevisions !== undefined) {
      updates.push({ key: 'care_quota_annual_revisions', value: dto.careQuotaAnnualRevisions.toString() });
    }
    if (dto.plusPointsMultiplier !== undefined) {
      updates.push({ key: 'plus_points_multiplier', value: dto.plusPointsMultiplier.toString() });
    }
    if (dto.plusMonthlyPoints !== undefined) {
      updates.push({ key: 'plus_monthly_points', value: dto.plusMonthlyPoints.toString() });
    }
    if (dto.voucherValidityDays !== undefined) {
      updates.push({ key: 'voucher_validity_days', value: dto.voucherValidityDays.toString() });
    }

    for (const item of updates) {
      await this.prisma.clubSettings.upsert({
        where: { key: item.key },
        update: { value: item.value },
        create: { key: item.key, value: item.value },
      });
    }

    return this.getSettings();
  }
}
