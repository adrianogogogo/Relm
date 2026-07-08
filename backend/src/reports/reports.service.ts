import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PointTxType, PaymentStatus, TierLevel, SubStatus } from '@prisma/client';

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Replica exata do algoritmo FIFO+expiração de PointsService.computeState,
 *  mas operando sobre as linhas já carregadas de UM cliente. */
function computeActivePoints(
  rows: { transactionType: string; amount: number; createdAt: Date; expiresAt: Date | null }[],
  now: Date,
): number {
  const earns = rows
    .filter((r) => r.transactionType === PointTxType.EARN)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const redeemed = rows
    .filter((r) => r.transactionType === PointTxType.REDEEM)
    .reduce((s, r) => s + Math.abs(r.amount), 0);

  const earnedTotal = earns.reduce((s, r) => s + r.amount, 0);

  let remainingRedeem = redeemed;
  let desiredExpire = 0;
  for (const lot of earns) {
    const consumed = Math.min(remainingRedeem, lot.amount);
    remainingRedeem -= consumed;
    const remainder = lot.amount - consumed;
    if (lot.expiresAt && lot.expiresAt < now) {
      desiredExpire += remainder;
    }
  }

  return Math.max(0, earnedTotal - redeemed - desiredExpire);
}

/** Formata Date → 'YYYY-MM' */
function toYearMonth(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getWarrantySummary() {
    const summary = await this.prisma.warrantyClaim.groupBy({
      by: ['statusId'],
      _count: true,
    });
    return summary;
  }

  async getDashboardStats() {
    const [
      warrantyCounts,
      totalCustomers,
      totalActiveStores,
      totalActiveEvents,
      totalInsuranceQuotes,
      recentWarranties,
    ] = await Promise.all([
      this.prisma.warrantyClaim.groupBy({ by: ['statusId'], _count: true }),
      this.prisma.customer.count({ where: { active: true } }),
      this.prisma.store.count({ where: { active: true } }),
      this.prisma.event.count({ where: { active: true } }),
      this.prisma.insuranceQuote.count(),
      this.prisma.warrantyClaim.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          protocolNumber: true,
          statusId: true,
          createdAt: true,
          customer: { select: { fullName: true } },
        },
      }),
    ]);

    const warrantyByStatus: Record<string, number> = {};
    warrantyCounts.forEach((item) => {
      warrantyByStatus[item.statusId] = item._count;
    });

    const totalWarranties = Object.values(warrantyByStatus).reduce(
      (acc, val) => acc + val,
      0,
    );

    return {
      warranties: {
        total: totalWarranties,
        byStatus: warrantyByStatus,
        pending:
          (warrantyByStatus['RECEBIDO'] || 0) +
          (warrantyByStatus['EM_ANALISE'] || 0) +
          (warrantyByStatus['AGUARDANDO_CLIENTE'] || 0),
      },
      totalCustomers,
      totalActiveStores,
      totalActiveEvents,
      totalInsuranceQuotes,
      recentWarranties,
    };
  }

  // ─── ONDA 7: Relatórios financeiros do clube ─────────────────────────────

  /**
   * Passivo de pontos: soma o saldo ativo (FIFO + expiração) de todos os
   * clientes × point_value_brl da ClubSettings.
   *
   * Custo: O FIFO exige a lista completa de transações por cliente — não há
   * forma puramente SQL que replique a semântica sem materializar o saldo.
   * Estratégia: carregamos todos os clientes com seus ledgers de uma só vez
   * (uma query, sem N+1). Para bases grandes isso pode ser pesado; nesse caso
   * recomendamos um cache/job noturno que materialize os saldos em tabela.
   */
  async getClubPointsLiability() {
    const now = new Date();

    // Busca o valor do ponto em BRL nas configurações do clube
    const setting = await this.prisma.clubSettings.findUnique({
      where: { key: 'point_value_brl' },
    });
    const pointValueBrl = setting ? parseFloat(setting.value) : 0;

    // Carrega todos os ledgers de uma vez (uma query)
    const allRows = await this.prisma.pointsLedger.findMany({
      select: {
        customerId: true,
        transactionType: true,
        amount: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    // Agrupa por cliente
    const byCustomer = new Map<
      string,
      { transactionType: string; amount: number; createdAt: Date; expiresAt: Date | null }[]
    >();
    for (const row of allRows) {
      if (!byCustomer.has(row.customerId)) byCustomer.set(row.customerId, []);
      byCustomer.get(row.customerId)!.push(row);
    }

    // Computa saldo ativo por cliente e soma
    let totalActivePoints = 0;
    for (const rows of byCustomer.values()) {
      totalActivePoints += computeActivePoints(rows, now);
    }

    return {
      totalActivePoints,
      pointValueBrl,
      liabilityBrl: +(totalActivePoints * pointValueBrl).toFixed(2),
      customersWithPoints: byCustomer.size,
      computedAt: now.toISOString(),
    };
  }

  /**
   * Receita mensal: últimos 12 meses de pagamentos CONFIRMED,
   * taxa de renovação e churn de assinantes PLUS.
   */
  async getClubRevenue() {
    const now = new Date();
    const twelveMonthsAgo = new Date(now);
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    // Pagamentos confirmados nos últimos 12 meses
    const confirmedPayments = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.CONFIRMED,
        paidAt: { gte: twelveMonthsAgo },
      },
      select: { amount: true, paidAt: true },
    });

    // Agrupamento mensal
    const monthMap = new Map<string, { count: number; totalBrl: number }>();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthMap.set(toYearMonth(d), { count: 0, totalBrl: 0 });
    }
    for (const p of confirmedPayments) {
      const key = toYearMonth(p.paidAt!);
      if (monthMap.has(key)) {
        const m = monthMap.get(key)!;
        m.count += 1;
        m.totalBrl = +(m.totalBrl + Number(p.amount)).toFixed(2);
      }
    }

    const monthlyRevenue = Array.from(monthMap.entries()).map(([month, v]) => ({
      month,
      paymentCount: v.count,
      totalBrl: v.totalBrl,
    }));

    const totalRevenueLast12mo = monthlyRevenue.reduce((s, m) => s + m.totalBrl, 0);
    const mrrEquivalent = +(totalRevenueLast12mo / 12).toFixed(2);

    // Assinantes ativos
    const [activePlus, activeCare] = await Promise.all([
      this.prisma.subscription.count({
        where: { tier: TierLevel.PLUS, status: SubStatus.ACTIVE },
      }),
      this.prisma.subscription.count({
        where: { tier: TierLevel.CARE, status: SubStatus.ACTIVE },
      }),
    ]);

    // Taxa de renovação: assinaturas PLUS que expiraram nos últimos 12 meses
    // e tiveram um pagamento CONFIRMED em até 30 dias após a expiração.
    const expiredPlus = await this.prisma.subscription.findMany({
      where: {
        tier: TierLevel.PLUS,
        status: { in: [SubStatus.EXPIRED, SubStatus.DOWNGRADED] },
        expiresAt: { gte: twelveMonthsAgo, lte: now },
      },
      select: { customerId: true, expiresAt: true },
    });

    let renewedCount = 0;
    if (expiredPlus.length > 0) {
      const renewalChecks = await Promise.all(
        expiredPlus.map(async ({ customerId, expiresAt }) => {
          const deadline = new Date(expiresAt!.getTime() + 30 * 24 * 60 * 60 * 1000);
          const payment = await this.prisma.payment.findFirst({
            where: {
              customerId,
              status: PaymentStatus.CONFIRMED,
              paidAt: { gte: expiresAt!, lte: deadline },
            },
          });
          return payment !== null;
        }),
      );
      renewedCount = renewalChecks.filter(Boolean).length;
    }

    const renewalRate =
      expiredPlus.length > 0
        ? +((renewedCount / expiredPlus.length) * 100).toFixed(1)
        : null;

    const churnCount = expiredPlus.length - renewedCount;
    const churnRate =
      expiredPlus.length > 0
        ? +((churnCount / expiredPlus.length) * 100).toFixed(1)
        : null;

    return {
      monthlyRevenue,
      totalRevenueLast12mo: +totalRevenueLast12mo.toFixed(2),
      mrrEquivalent,
      activePlus,
      activeCare,
      renewalRate,
      churnRate,
      expiredPlusLast12mo: expiredPlus.length,
      renewedCount,
      churnCount,
    };
  }

  /**
   * Funil de origem dos membros e métricas de conversão.
   *
   * Origens deriváveis dos dados atuais:
   * - BIKE_PLUS: cliente tem subscription PLUS + sem referral recebido
   *   (proxy: compra de bike = 1 ano Plus automático pela Wave 1).
   * - REFERRAL: cliente tem referredById preenchido (indicado por outro).
   * - CARE_ORGANIC: subscription CARE sem referral.
   * Nota: a distinção "bike vs acessório" não é armazenada no schema atual
   * (salesTrigger não existe como campo). BIKE_PLUS é uma aproximação.
   */
  async getClubFunnel() {
    const [
      totalSubscriptions,
      plusSubs,
      referralCustomers,
      completedReferrals,
      totalReferrals,
    ] = await Promise.all([
      this.prisma.subscription.count(),
      this.prisma.subscription.count({ where: { tier: TierLevel.PLUS } }),
      // Clientes que foram indicados por alguém (têm referredById)
      this.prisma.customer.count({ where: { referredById: { not: null } } }),
      this.prisma.referral.count({ where: { status: 'COMPLETED' } }),
      this.prisma.referral.count(),
    ]);

    // PLUS via compra (sem indicação)
    const plusViaReferral = await this.prisma.customer.count({
      where: {
        referredById: { not: null },
        subscription: { tier: TierLevel.PLUS },
      },
    });
    const plusViaBike = plusSubs - plusViaReferral;

    // CARE sem indicação = orgânico CARE
    const careViaReferral = referralCustomers - plusViaReferral;
    const careOrganic = totalSubscriptions - plusSubs - careViaReferral;

    // Upgrades: clientes PLUS que têm um pagamento CONFIRMED
    // (proxy: pagaram a anuidade = renovaram/fizeram upgrade)
    const upgradesCount = await this.prisma.payment.count({
      where: { status: PaymentStatus.CONFIRMED },
    });

    return {
      memberOrigins: {
        plusViaBikePurchase: Math.max(0, plusViaBike),
        plusViaReferral,
        careViaReferral,
        careOrganic: Math.max(0, careOrganic),
      },
      totalSubscriptions,
      upgradesAndRenewals: upgradesCount,
      completedReferrals,
      totalReferrals,
      pendingReferrals: totalReferrals - completedReferrals,
      note: 'plusViaBikePurchase é aproximação: PLUS sem indicação direta. Distinção bike/acessório não está no schema atual.',
    };
  }
}
