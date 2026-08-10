import { Injectable, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PointsService } from '../points/points.service';
import { VoucherStatus, TierLevel, Prisma } from '@prisma/client';
import { tierAtLeast } from '../common/entitlements';

@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pointsService: PointsService,
  ) {}

  async redeemReward(dto: { customerId: string; catalogItemId: string }) {
    return this.prisma.$transaction(async (tx) => {
      // Saldo vivo (FIFO, já exclui pontos vencidos) na mesma transação.
      // TOTAL e não só o acumulável: o ponto mensal vale para qualquer
      // resgate, inclusive prêmio de catálogo.
      const { total: balance } = await this.pointsService.getBalances(dto.customerId, tx);

      const item = await tx.catalogItem.findUnique({
        where: { id: dto.catalogItemId },
      });

      if (!item || !item.active) {
        throw new BadRequestException('Reward not found or inactive');
      }

      // Enforcement de pré-venda: se o item está em janela de pré-venda, somente
      // clientes com tier >= presaleTier podem resgatar. O tier é derivado da
      // assinatura no banco — NUNCA do payload (evita bypass de autorização).
      const now = new Date();
      if (item.presaleUntil && item.presaleTier && item.presaleUntil > now) {
        const subscription = await tx.subscription.findUnique({
          where: { customerId: dto.customerId },
          select: { tier: true, status: true },
        });
        const customerTier =
          subscription?.status === 'ACTIVE' ? subscription.tier : TierLevel.CARE;
        if (!tierAtLeast(customerTier, item.presaleTier as TierLevel)) {
          throw new ForbiddenException('Este item está em pré-venda exclusiva para um tier superior.');
        }
      }

      if (balance < item.pointsCost) {
        throw new BadRequestException('Insufficient Points');
      }

      if (item.stock <= 0) {
        throw new BadRequestException('Out of Stock');
      }

      // Via redeemPoints, não escrevendo no ledger direto: ele gasta o bucket
      // MENSAL primeiro, que vence na virada do mês. A escrita direta que
      // existia aqui caía no default ACUMULAVEL e fazia o cliente queimar o
      // saldo histórico enquanto o mensal expirava sem uso.
      await this.pointsService.redeemPoints(
        dto.customerId,
        item.pointsCost,
        `Resgate de Recompensa: ${item.title}`,
        item.id,
        tx,
      );

      await tx.catalogItem.update({
        where: { id: item.id },
        data: {
          stock: item.stock - 1,
        },
      });

      // Hash único de 5 chars alfanuméricos maiúsculos, criptograficamente aleatório.
      const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const code =
        'RLM-' +
        Array.from(randomBytes(5), (b) => alphabet[b % alphabet.length]).join('');

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

  async createVoucherManual(dto: {
    customerId: string;
    catalogItemId: string;
    debitPoints: boolean;
    expirationDays: number;
    requesterUserId: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id: dto.customerId },
      });
      if (!customer) {
        throw new BadRequestException('Customer not found');
      }

      const item = await tx.catalogItem.findUnique({
        where: { id: dto.catalogItemId },
      });
      if (!item || !item.active) {
        throw new BadRequestException('Reward not found or inactive');
      }

      if (item.stock <= 0) {
        throw new BadRequestException('Out of Stock');
      }

      if (dto.debitPoints) {
        const { total } = await this.pointsService.getBalances(dto.customerId, tx);
        if (total < item.pointsCost) {
          throw new BadRequestException('Insufficient Points');
        }

        // Mesma razão do resgate do cliente: mensal primeiro, acumulável depois.
        await this.pointsService.redeemPoints(
          dto.customerId,
          item.pointsCost,
          `Resgate Manual (Débito) de Recompensa: ${item.title}`,
          item.id,
          tx,
        );
      }

      await tx.catalogItem.update({
        where: { id: item.id },
        data: {
          stock: item.stock - 1,
        },
      });

      const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const code =
        'RLM-' +
        Array.from(randomBytes(5), (b) => alphabet[b % alphabet.length]).join('');

      const expiresAt = new Date(Date.now() + dto.expirationDays * 24 * 60 * 60 * 1000);
      const voucher = await tx.voucher.create({
        data: {
          code,
          status: VoucherStatus.UNUSED,
          customerId: dto.customerId,
          catalogItemId: item.id,
          expiresAt,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: dto.requesterUserId,
          action: 'CREATE_VOUCHER_MANUAL',
          entity: 'vouchers',
          entityId: voucher.id,
          metadata: { code, pointsCost: dto.debitPoints ? item.pointsCost : 0, debitPoints: dto.debitPoints },
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

  async getCatalog(customerTier?: TierLevel) {
    const items = await this.prisma.catalogItem.findMany();
    if (!customerTier) return items;

    const now = new Date();
    return items.filter((item) => {
      // Se está em janela de pré-venda e cliente não tem tier suficiente → ocultar
      if (item.presaleUntil && item.presaleTier && item.presaleUntil > now) {
        return tierAtLeast(customerTier, item.presaleTier as TierLevel);
      }
      return true;
    });
  }

  async getVouchers(customerId: string) {
    return this.prisma.voucher.findMany({
      where: { customerId },
      include: {
        catalogItem: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createCatalogItem(data: {
    title: string;
    description: string;
    pointsCost: number;
    stock: number;
    presaleUntil?: Date | null;
    presaleTier?: TierLevel | null;
  }) {
    return this.prisma.catalogItem.create({
      data: {
        ...data,
        active: true,
      },
    });
  }

  async updateCatalogItem(id: string, data: {
    title?: string;
    description?: string;
    pointsCost?: number;
    stock?: number;
    active?: boolean;
    presaleUntil?: Date | null;
    presaleTier?: TierLevel | null;
  }) {
    return this.prisma.catalogItem.update({
      where: { id },
      data,
    });
  }

  async deleteCatalogItem(id: string) {
    return this.prisma.catalogItem.update({
      where: { id },
      data: { active: false },
    });
  }

  async getAllVouchers() {
    return this.prisma.voucher.findMany({
      include: {
        customer: true,
        catalogItem: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async useVoucher(code: string) {
    const voucher = await this.prisma.voucher.findUnique({
      where: { code },
    });

    if (!voucher) {
      throw new BadRequestException('Voucher not found');
    }

    if (voucher.status === VoucherStatus.USED) {
      throw new BadRequestException('Voucher already used');
    }

    if (new Date(voucher.expiresAt) < new Date()) {
      throw new BadRequestException('Voucher expired');
    }

    const updated = await this.prisma.voucher.update({
      where: { code },
      data: { status: VoucherStatus.USED },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: null,
        action: 'UPDATE_STATUS',
        entity: 'vouchers',
        entityId: voucher.id,
        metadata: { code, status: VoucherStatus.USED },
      },
    });

    return updated;
  }
}
