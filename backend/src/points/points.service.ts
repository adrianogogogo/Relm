import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PointTxType, TierLevel } from '@prisma/client';

@Injectable()
export class PointsService {
  private readonly logger = new Logger(PointsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getBalance(customerId: string): Promise<number> {
    const aggregate = await this.prisma.pointsLedger.aggregate({
      where: { customerId },
      _sum: {
        amount: true,
      },
    });
    return aggregate._sum.amount || 0;
  }

  async addPurchasePoints(customerId: string, purchaseValue: number, description: string, referenceId?: string, tx?: any) {
    const prismaClient = tx || this.prisma;

    const subscription = await prismaClient.subscription.findUnique({
      where: { customerId },
    });

    const tier = subscription ? subscription.tier : TierLevel.CARE;
    const multiplier = tier === TierLevel.PLUS ? 2.0 : 1.0;

    const baseValue = Math.floor(purchaseValue);
    const amount = Math.floor(baseValue * multiplier);

    const pointsEntry = await prismaClient.pointsLedger.create({
      data: {
        customerId,
        transactionType: PointTxType.EARN,
        amount,
        description,
        referenceId,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 12 meses
      },
    });

    this.logger.log(`Credited ${amount} points to customer ${customerId} (Tier: ${tier}, Multiplier: ${multiplier})`);
    return pointsEntry;
  }
}
