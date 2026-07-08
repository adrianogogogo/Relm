import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PointTxType, ReferralStatus } from '@prisma/client';

// Códigos dos badges (espelham os seeds da migration)
export const BADGE = {
  PRIMEIRA_COMPRA: 'PRIMEIRA_COMPRA',
  DEZ_PEDAIS:      'DEZ_PEDAIS',
  RENOVACAO_PLUS:  'RENOVACAO_PLUS',
  INDICOU_5:       'INDICOU_5',
  PONTOS_10K:      'PONTOS_10K',
} as const;

export type BadgeCode = (typeof BADGE)[keyof typeof BADGE];

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────────────────────────────────
  // GRANT ACHIEVEMENT — idempotente via @@unique([customerId, achievementId])
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Concede um badge ao cliente. Completamente idempotente:
   * se o badge já foi concedido, silencia o Prisma P2002 e retorna false.
   * @param tx  Transação Prisma opcional — se fornecida, usa ela; caso contrário
   *            usa a conexão padrão.
   */
  async grantAchievement(
    customerId: string,
    code: BadgeCode,
    tx?: any,
  ): Promise<boolean> {
    const client = tx ?? this.prisma;

    // Resolve o achievement pelo código
    const achievement = await (tx ?? this.prisma).achievement.findUnique({
      where: { code },
      select: { id: true, active: true },
    });
    if (!achievement || !achievement.active) return false;

    try {
      await client.customerAchievement.create({
        data: { customerId, achievementId: achievement.id },
      });
      this.logger.log(`Badge ${code} concedido ao cliente ${customerId}`);
      return true;
    } catch (err: any) {
      // P2002 = violação de unique → badge já existe → idempotente
      if (err?.code === 'P2002') return false;
      throw err;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CHECK AND GRANT — avalia todos os critérios para um cliente
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Avalia e concede todos os badges cujos critérios o cliente atende.
   * NUNCA lança exceção — falhas são logadas e ignoradas para não quebrar o
   * fluxo chamador (pagamento, presença, referral, etc.).
   *
   * Critérios implementados:
   *  - PRIMEIRA_COMPRA  : subscription com pelo menos 1 Payment CONFIRMED
   *  - DEZ_PEDAIS       : >= 10 EventRegistrations com attended=true
   *  - RENOVACAO_PLUS   : >= 2 Payments CONFIRMED (1ª ativação + 1 renovação)
   *  - INDICOU_5        : >= 5 Referrals COMPLETED como referrer
   *  - PONTOS_10K       : soma de EARN no PointsLedger (lifetime) >= 10000
   *
   * Critério NÃO implementado (sem campo avaliável):
   *  - Nenhum: todos os 5 badges têm dados acessíveis via modelos existentes.
   */
  async checkAndGrant(customerId: string, tx?: any): Promise<void> {
    try {
      const client = tx ?? this.prisma;

      const [
        confirmedPaymentsCount,
        attendedCount,
        completedReferralsCount,
        earnSum,
      ] = await Promise.all([
        client.payment.count({
          where: { customerId, status: 'CONFIRMED' },
        }),
        client.eventRegistration.count({
          where: { customerId, attended: true },
        }),
        client.referral.count({
          where: { referrerId: customerId, status: ReferralStatus.COMPLETED },
        }),
        client.pointsLedger
          .aggregate({
            where: { customerId, transactionType: PointTxType.EARN },
            _sum: { amount: true },
          })
          .then((r: any) => r._sum.amount ?? 0),
      ]);

      const grants: Array<Promise<boolean>> = [];

      if (confirmedPaymentsCount >= 1) {
        grants.push(this.grantAchievement(customerId, BADGE.PRIMEIRA_COMPRA, tx));
      }
      if (attendedCount >= 10) {
        grants.push(this.grantAchievement(customerId, BADGE.DEZ_PEDAIS, tx));
      }
      // Renovação Plus = pelo menos 2 pagamentos confirmados
      // (1ª ativação conta como primeiro; renovação seria o segundo em diante)
      if (confirmedPaymentsCount >= 2) {
        grants.push(this.grantAchievement(customerId, BADGE.RENOVACAO_PLUS, tx));
      }
      if (completedReferralsCount >= 5) {
        grants.push(this.grantAchievement(customerId, BADGE.INDICOU_5, tx));
      }
      if (earnSum >= 10000) {
        grants.push(this.grantAchievement(customerId, BADGE.PONTOS_10K, tx));
      }

      await Promise.all(grants);
    } catch (err: any) {
      this.logger.error(
        `checkAndGrant falhou para cliente ${customerId}: ${err?.message ?? err}`,
      );
      // Nunca relança — o fluxo chamador não pode ser quebrado
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // MY ACHIEVEMENTS — portal do cliente
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Retorna todos os badges (ativos) com flag earned=true/false para o cliente.
   */
  async getMyAchievements(customerId: string) {
    const [allBadges, earned] = await Promise.all([
      this.prisma.achievement.findMany({
        where: { active: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.customerAchievement.findMany({
        where: { customerId },
        select: { achievementId: true, earnedAt: true },
      }),
    ]);

    const earnedMap = new Map(earned.map((e) => [e.achievementId, e.earnedAt]));

    return allBadges.map((badge) => ({
      id:          badge.id,
      code:        badge.code,
      name:        badge.name,
      description: badge.description,
      icon:        badge.icon,
      earned:      earnedMap.has(badge.id),
      earnedAt:    earnedMap.get(badge.id) ?? null,
    }));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // LEADERBOARD — top 20 por pontos EARN acumulados no ano corrente
  // ──────────────────────────────────────────────────────────────────────────

  async getLeaderboard(viewerCustomerId?: string) {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);

    // Agrega pontos EARN do ano por cliente — só clientes com opt-in
    const rows = await this.prisma.pointsLedger.groupBy({
      by: ['customerId'],
      where: {
        transactionType: PointTxType.EARN,
        createdAt: { gte: startOfYear },
        customer: { leaderboardOptIn: true },
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 20,
    });

    const customerIds = rows.map((r) => r.customerId);

    // Busca nicknames em lote
    const customers = await this.prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, nickname: true },
    });
    const nicknameMap = new Map(customers.map((c) => [c.id, c.nickname]));

    return rows.map((row, index) => ({
      rank:      index + 1,
      nickname:  nicknameMap.get(row.customerId) || 'Membro RELM',
      points:    row._sum.amount ?? 0,
      isMe:      viewerCustomerId ? row.customerId === viewerCustomerId : false,
    }));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // OPT-IN — cliente define participação e apelido no ranking
  // ──────────────────────────────────────────────────────────────────────────

  async updateLeaderboardOptIn(
    customerId: string,
    optIn: boolean,
    nickname?: string,
  ) {
    const sanitized = nickname
      ? nickname.replace(/<[^>]*>/g, '').trim().slice(0, 30)
      : undefined;

    const updated = await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        leaderboardOptIn: optIn,
        ...(sanitized !== undefined ? { nickname: sanitized } : {}),
      },
      select: { leaderboardOptIn: true, nickname: true },
    });

    return updated;
  }
}
