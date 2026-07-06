import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PointTxType, VoucherStatus, Prisma } from '@prisma/client';

@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async redeemReward(dto: { customerId: string; catalogItemId: string }) {
    return this.prisma.$transaction(async (tx) => {
      const ledgerSum = await tx.pointsLedger.aggregate({
        where: { customerId: dto.customerId },
        _sum: {
          amount: true,
        },
      });

      const balance = ledgerSum._sum.amount || 0;

      const item = await tx.catalogItem.findUnique({
        where: { id: dto.catalogItemId },
      });

      if (!item || !item.active) {
        throw new BadRequestException('Reward not found or inactive');
      }

      if (balance < item.pointsCost) {
        throw new BadRequestException('Insufficient Points');
      }

      if (item.stock <= 0) {
        throw new BadRequestException('Out of Stock');
      }

      await tx.pointsLedger.create({
        data: {
          customerId: dto.customerId,
          transactionType: PointTxType.REDEEM,
          amount: -item.pointsCost,
          description: `Resgate de Recompensa: ${item.title}`,
          referenceId: item.id,
        },
      });

      await tx.catalogItem.update({
        where: { id: item.id },
        data: {
          stock: item.stock - 1,
        },
      });

      const code = 'RLM-' + Math.random().toString(36).substring(2, 7).toUpperCase();

      const voucher = await tx.voucher.create({
        data: {
          code,
          status: VoucherStatus.UNUSED,
          customerId: dto.customerId,
          catalogItemId: item.id,
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: null,
          action: 'UPDATE_SENSITIVE',
          entity: 'vouchers',
          entityId: voucher.id,
          metadata: { code, pointsCost: item.pointsCost },
        },
      });

      return {
        success: true,
        voucherCode: code,
        expiresAt: voucher.expiresAt,
      };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  async seedCatalog() {
    const count = await this.prisma.catalogItem.count();
    if (count === 0) {
      await this.prisma.catalogItem.createMany({
        data: [
          { title: 'Selim Premium Relm', description: 'Selim ergonômico em gel para alta performance', pointsCost: 150, stock: 10 },
          { title: 'Garrafa Térmica Relm 750ml', description: 'Conserva a água gelada por até 12 horas', pointsCost: 50, stock: 25 },
          { title: 'Kit de Ferramentas Bike', description: 'Chaves allen, extrator de corrente e espátulas', pointsCost: 80, stock: 5 },
        ],
      });
      this.logger.log('Seeded rewards catalog items.');
    }
  }
}
