import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { PointTxType, TierLevel, PointsLedger } from '@prisma/client';
import { ENTITLEMENTS } from '../common/entitlements';

// Validade dos pontos: 12 meses a partir do EARN (PRD 9.2.1).
const EARN_EXPIRY_DAYS = 365;
// Bônus fixo creditado ao concluir uma revisão na oficina. Valor de negócio —
// ajuste livre. ponytail: constante fixa; mover para config se variar por tier.
const WORKSHOP_COMPLETION_POINTS = 50;

@Injectable()
export class PointsService {
  private readonly logger = new Logger(PointsService.name);

  constructor(private readonly prisma: PrismaService) {}

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

  /** Saldo resgatável — já exclui lotes vencidos mesmo antes do cron rodar. */
  async getBalance(customerId: string, tx?: any): Promise<number> {
    const client = tx || this.prisma;
    const rows = await client.pointsLedger.findMany({ where: { customerId } });
    return this.computeState(rows, new Date()).balance;
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
        amount: points,
        description,
        referenceId,
        expiresAt: new Date(Date.now() + EARN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      },
    });
    this.logger.log(`Credited ${points} points to customer ${customerId} (${description})`);
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
    const multiplier = ENTITLEMENTS[tier].pointsMultiplier;
    const amount = Math.floor(Math.floor(purchaseValue) * multiplier);
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
    this.logger.log('Running daily points expiration cron job...');
    const now = new Date();
    const lots = await this.prisma.pointsLedger.findMany({
      where: { transactionType: PointTxType.EARN, isExpired: false, expiresAt: { lt: now } },
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
      const rows = await tx.pointsLedger.findMany({ where: { customerId } });
      const { desiredExpire, existingExpire, expiredLotIds } = this.computeState(rows, now);
      const delta = desiredExpire - existingExpire;
      if (delta > 0) {
        await tx.pointsLedger.create({
          data: {
            customerId,
            transactionType: PointTxType.EXPIRE,
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
