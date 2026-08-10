import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { PointTxType, TierLevel, PointsLedger, PointsBucket } from '@prisma/client';
import { CronHealthService } from '../common/cron-health.service';
import { ClubSettingsService } from '../club-settings/club-settings.service';

// Validade dos pontos: 12 meses a partir do EARN (PRD 9.2.1).
const EARN_EXPIRY_DAYS = 365;
// Bônus fixo creditado ao concluir uma revisão na oficina. Valor de negócio —
// ajuste livre. ponytail: constante fixa; mover para config se variar por tier.
const WORKSHOP_COMPLETION_POINTS = 50;

@Injectable()
export class PointsService {
  private readonly logger = new Logger(PointsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cronHealth: CronHealthService,
    private readonly clubSettings: ClubSettingsService,
  ) {}

  /** Primeiro instante do mês de `now`, em horário local do servidor. */
  private startOfMonth(now: Date): Date {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  /**
   * Estado do ledger via FIFO: resgates consomem os EARN mais antigos primeiro,
   * então só o remanescente de um lote vencido de fato expira. Fonte da verdade
   * são as linhas EARN/REDEEM; linhas EXPIRE são apenas materialização/auditoria
   * e NÃO entram no cálculo (evita subtrair duas vezes).
   */
  private computeState(rows: PointsLedger[], now: Date) {
    const earns = rows
      .filter((r) => r.transactionType === PointTxType.EARN)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const redeemed = rows
      .filter((r) => r.transactionType === PointTxType.REDEEM)
      .reduce((s, r) => s + Math.abs(r.amount), 0);
    const existingExpire = rows
      .filter((r) => r.transactionType === PointTxType.EXPIRE)
      .reduce((s, r) => s + Math.abs(r.amount), 0);
    const earnedTotal = earns.reduce((s, r) => s + r.amount, 0);

    let remainingRedeem = redeemed;
    let desiredExpire = 0;
    const expiredLotIds: string[] = [];
    for (const lot of earns) {
      const consumed = Math.min(remainingRedeem, lot.amount);
      remainingRedeem -= consumed;
      const remainder = lot.amount - consumed;
      if (lot.expiresAt && lot.expiresAt < now) {
        desiredExpire += remainder;
        if (!lot.isExpired) expiredLotIds.push(lot.id);
      }
    }

    const balance = earnedTotal - redeemed - desiredExpire;
    return { balance, desiredExpire, existingExpire, expiredLotIds };
  }

  /**
   * Saldo ACUMULÁVEL — já exclui lotes vencidos mesmo antes do cron rodar.
   * Filtra por bucket: um resgate feito com pontos mensais não pode abater o
   * saldo histórico, senão o cliente pagaria duas vezes pelo mesmo consumo.
   */
  async getBalance(customerId: string, tx?: any): Promise<number> {
    const client = tx || this.prisma;
    const rows = await client.pointsLedger.findMany({
      where: { customerId, bucket: PointsBucket.ACUMULAVEL },
    });
    return this.computeState(rows, new Date()).balance;
  }

  /**
   * Saldo MENSAL — derivado, não materializado: cota do tier menos o consumido
   * no mês corrente. Não há linha de concessão nem cron de reset; virar o mês
   * já zera o consumo porque a janela de contagem anda junto.
   */
  async getMonthlyBalance(customerId: string, tx?: any): Promise<number> {
    const client = tx || this.prisma;
    const subscription = await client.subscription.findUnique({ where: { customerId } });
    const tier = subscription ? subscription.tier : TierLevel.CARE;
    const { monthlyPoints } = await this.clubSettings.resolveEntitlements(tier);
    if (monthlyPoints <= 0) return 0;

    const spent = await client.pointsLedger.aggregate({
      _sum: { amount: true },
      where: {
        customerId,
        bucket: PointsBucket.MENSAL,
        transactionType: PointTxType.REDEEM,
        createdAt: { gte: this.startOfMonth(new Date()) },
      },
    });
    const consumed = Math.abs(spent._sum.amount ?? 0);
    return Math.max(0, monthlyPoints - consumed);
  }

  /** Os dois saldos de uma vez — o que a tela do cliente precisa mostrar. */
  async getBalances(customerId: string, tx?: any) {
    const [accumulated, monthly] = await Promise.all([
      this.getBalance(customerId, tx),
      this.getMonthlyBalance(customerId, tx),
    ]);
    return { accumulated, monthly, total: accumulated + monthly };
  }

  /**
   * Débito de pontos. Gasta o saldo MENSAL primeiro — ele vence na virada do
   * mês, então queimar o acumulável antes faria o cliente perder o mensal sem
   * usar. Devolve quanto saiu de cada bucket.
   */
  async redeemPoints(
    customerId: string,
    amount: number,
    description: string,
    referenceId?: string,
    tx?: any,
  ) {
    const points = Math.floor(amount);
    if (points <= 0) throw new Error('Valor de resgate deve ser positivo');
    const client = tx || this.prisma;

    const monthly = await this.getMonthlyBalance(customerId, client);
    const accumulated = await this.getBalance(customerId, client);
    if (monthly + accumulated < points) {
      throw new BadRequestException('Saldo de pontos insuficiente');
    }

    const fromMonthly = Math.min(monthly, points);
    const fromAccumulated = points - fromMonthly;

    for (const [bucket, value] of [
      [PointsBucket.MENSAL, fromMonthly],
      [PointsBucket.ACUMULAVEL, fromAccumulated],
    ] as const) {
      if (value <= 0) continue;
      await client.pointsLedger.create({
        data: {
          customerId,
          transactionType: PointTxType.REDEEM,
          bucket,
          amount: -value,
          description,
          referenceId,
        },
      });
    }

    this.logger.log(
      `Redeemed ${points} points from ${customerId} (mensal=${fromMonthly}, acumulavel=${fromAccumulated})`,
    );
    return { fromMonthly, fromAccumulated };
  }

  /** Primitivo genérico de crédito. Use para qualquer regra de acúmulo. */
  async earnPoints(
    customerId: string,
    amount: number,
    description: string,
    referenceId?: string,
    tx?: any,
  ) {
    const points = Math.floor(amount);
    if (points <= 0) return null;
    const client = tx || this.prisma;
    const entry = await client.pointsLedger.create({
      data: {
        customerId,
        transactionType: PointTxType.EARN,
        // Crédito é sempre acumulável: o saldo mensal é cota derivada, não se
        // concede por linha.
        bucket: PointsBucket.ACUMULAVEL,
        amount: points,
        description,
        referenceId,
        expiresAt: new Date(Date.now() + EARN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      },
    });
    this.logger.log(`Credited ${points} points to customer ${customerId} (${description})`);
    return entry;
  }

  /** Atribuição manual de pontos pelo Administrador. */
  async grantPointsByAdmin(customerId: string, amount: number, description?: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    const desc = description?.trim() || 'Crédito bônus atribuído pelo Administrador Relm';
    const entry = await this.earnPoints(customerId, amount, desc);

    // Cria notificação interna para o cliente se a tabela de notificações existir
    try {
      await this.prisma.notification.create({
        data: {
          recipientType: 'USER',
          recipientId: customerId,
          type: 'POINTS_GRANTED',
          title: 'Você recebeu pontos bônus! 🌟',
          message: `Foram creditados ${amount} pontos na sua conta. Motivo: ${desc}`,
          link: '/cliente/resgate',
        },
      });
    } catch (e) {
      // Ignora silenciosamente se o Schema de notificação for exclusivo de User/StoreUser
    }

    return entry;
  }

  /** Acúmulo por compra com multiplicador de plano (PRD 9.2.2). */
  async addPurchasePoints(
    customerId: string,
    purchaseValue: number,
    description: string,
    referenceId?: string,
    tx?: any,
  ) {
    const client = tx || this.prisma;
    const subscription = await client.subscription.findUnique({ where: { customerId } });
    const tier = subscription ? subscription.tier : TierLevel.CARE;
    // Resolver e não ENTITLEMENTS direto: o multiplicador é calibrável pela
    // tela de configurações do clube.
    const { pointsMultiplier } = await this.clubSettings.resolveEntitlements(tier);
    const amount = Math.floor(Math.floor(purchaseValue) * pointsMultiplier);
    return this.earnPoints(customerId, amount, description, referenceId, tx);
  }

  /** Bônus por revisão concluída na oficina. */
  async addWorkshopCompletionPoints(customerId: string, serviceOrderId: string, tx?: any) {
    return this.earnPoints(
      customerId,
      WORKSHOP_COMPLETION_POINTS,
      'Revisão concluída na oficina',
      serviceOrderId,
      tx,
    );
  }

  /** Cron diário (02:00) que materializa transações EXPIRE dos pontos vencidos. */
  @Cron('0 2 * * *')
  async expireOldPoints() {
    return this.cronHealth.track('points-expiry', () => this._expireOldPoints());
  }

  private async _expireOldPoints() {
    this.logger.log('Running daily points expiration cron job...');
    const now = new Date();
    const lots = await this.prisma.pointsLedger.findMany({
      where: {
        transactionType: PointTxType.EARN,
        bucket: PointsBucket.ACUMULAVEL,
        isExpired: false,
        expiresAt: { lt: now },
      },
      select: { customerId: true },
      distinct: ['customerId'],
    });
    this.logger.log(`Found ${lots.length} customers with points to expire.`);
    for (const { customerId } of lots) {
      try {
        await this.expireCustomerPoints(customerId, now);
      } catch (err) {
        this.logger.error(`Failed to expire points for ${customerId}: ${err.message}`);
      }
    }
  }

  private async expireCustomerPoints(customerId: string, now: Date) {
    await this.prisma.$transaction(async (tx) => {
      const rows = await tx.pointsLedger.findMany({
        where: { customerId, bucket: PointsBucket.ACUMULAVEL },
      });
      const { desiredExpire, existingExpire, expiredLotIds } = this.computeState(rows, now);
      const delta = desiredExpire - existingExpire;
      if (delta > 0) {
        await tx.pointsLedger.create({
          data: {
            customerId,
            transactionType: PointTxType.EXPIRE,
            bucket: PointsBucket.ACUMULAVEL,
            amount: -delta,
            description: 'Expiração automática de pontos (12 meses)',
          },
        });
      }
      if (expiredLotIds.length) {
        await tx.pointsLedger.updateMany({
          where: { id: { in: expiredLotIds } },
          data: { isExpired: true },
        });
      }
    });
  }
}
