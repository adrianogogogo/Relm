import {
  Injectable, BadRequestException, ForbiddenException, Logger,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PointsService } from '../points/points.service';
import { ClubSettingsService } from '../club-settings/club-settings.service';
import { VoucherStatus, TierLevel, Prisma } from '@prisma/client';
import { tierAtLeast } from '../common/entitlements';

// Alfabeto sem O/0/I/1 — o código é ditado por telefone e lido do celular no
// balcão. ponytail: 32^5 ≈ 33M; a unicidade quem garante é o índice do banco.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pointsService: PointsService,
    private readonly clubSettings: ClubSettingsService,
  ) {}

  private generateVoucherCode() {
    return 'RLM-' + Array.from(randomBytes(5), (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
  }

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

      const code = this.generateVoucherCode();

      // Validade vinha hardcoded em 60 dias enquanto `voucher_validity_days`
      // existia na tela admin e não era lido — mesmo defeito dos outros knobs.
      const { voucherValidityDays } = await this.clubSettings.getSettings();

      const voucher = await tx.voucher.create({
        data: {
          code,
          status: VoucherStatus.UNUSED,
          customerId: dto.customerId,
          catalogItemId: item.id,
          expiresAt: new Date(Date.now() + voucherValidityDays * 24 * 60 * 60 * 1000),
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

      const code = this.generateVoucherCode();

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

  // ── Resgate de serviço com pontos (Step 4) ────────────────────────────────

  /**
   * Serviços resgatáveis por pontos. `pointsCost` nulo é o opt-out — não há
   * flag separada, então listar aqui já é a definição de "resgatável".
   */
  async getRedeemableServices(storeId?: string) {
    const services = await this.prisma.storeService.findMany({
      where: {
        active: true,
        pointsCost: { not: null },
        ...(storeId && { storeId }),
      },
      include: {
        masterService: { select: { name: true, description: true, category: true } },
        store: { select: { id: true, tradeName: true, city: true } },
      },
      orderBy: { pointsCost: 'asc' },
    });

    return services.map((s) => ({
      id: s.id,
      storeId: s.storeId,
      store: s.store,
      name: s.customName || s.masterService?.name || 'Serviço',
      description: s.customDescription || s.masterService?.description || '',
      category: s.masterService?.category ?? null,
      pointsCost: s.pointsCost,
      estimatedMinutes: s.estimatedMinutes,
    }));
  }

  /**
   * Resgata um serviço de loja com pontos e emite o voucher que o cliente
   * apresenta no atendimento.
   *
   * Só REGISTRA o consumo: grava loja, serviço, pontos gastos e o equivalente
   * em R$ na cotação do momento. O acerto financeiro com a loja é offline —
   * não há repasse automático aqui.
   */
  async redeemService(dto: { customerId: string; storeServiceId: string }) {
    return this.prisma.$transaction(async (tx) => {
      const service = await tx.storeService.findUnique({
        where: { id: dto.storeServiceId },
        include: { masterService: { select: { name: true } } },
      });

      if (!service || !service.active || service.pointsCost == null) {
        throw new BadRequestException('Serviço não disponível para resgate com pontos');
      }

      const { total } = await this.pointsService.getBalances(dto.customerId, tx);
      if (total < service.pointsCost) {
        throw new BadRequestException('Insufficient Points');
      }

      const name = service.customName || service.masterService?.name || 'Serviço';

      await this.pointsService.redeemPoints(
        dto.customerId,
        service.pointsCost,
        `Resgate de Serviço: ${name}`,
        service.id,
        tx,
      );

      const { pointValueBrl, voucherValidityDays } = await this.clubSettings.getSettings();
      const code = this.generateVoucherCode();

      const voucher = await tx.voucher.create({
        data: {
          code,
          status: VoucherStatus.UNUSED,
          customerId: dto.customerId,
          storeServiceId: service.id,
          // Congelados: point_value_brl muda e o acerto com a loja é posterior.
          pointsSpent: service.pointsCost,
          brlValue: new Prisma.Decimal(service.pointsCost * pointValueBrl),
          expiresAt: new Date(Date.now() + voucherValidityDays * 24 * 60 * 60 * 1000),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: null,
          action: 'UPDATE_SENSITIVE',
          entity: 'vouchers',
          entityId: voucher.id,
          metadata: {
            code,
            kind: 'SERVICE',
            storeId: service.storeId,
            storeServiceId: service.id,
            pointsCost: service.pointsCost,
          },
        },
      });

      return {
        success: true,
        voucherCode: code,
        expiresAt: voucher.expiresAt,
        serviceName: name,
        storeId: service.storeId,
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
        // Sem isto, voucher de serviço aparecia na lista do cliente sem nome
        // nenhum — os dois alvos precisam vir juntos.
        storeService: {
          include: {
            masterService: { select: { name: true } },
            store: { select: { id: true, tradeName: true } },
          },
        },
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
        storeService: {
          include: {
            masterService: { select: { name: true } },
            store: { select: { id: true, tradeName: true } },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async useVoucher(code: string, requester?: { userId?: string; role?: string }) {
    const voucher = await this.prisma.voucher.findUnique({
      where: { code },
      include: { storeService: { select: { storeId: true } } },
    });

    if (!voucher) {
      throw new BadRequestException('Voucher not found');
    }

    // Escopo da loja: ela baixa voucher de serviço DELA. Voucher de catálogo
    // não tem loja associada, então continua restrito ao time Relm — sem isso
    // uma loja daria baixa em prêmio físico que nunca passou por ela.
    if (requester?.role === 'LOJA') {
      const user = await this.prisma.user.findUnique({ where: { id: requester.userId } });
      if (!user?.storeId) {
        throw new BadRequestException('Usuário de loja sem loja vinculada.');
      }
      if (!voucher.storeService || voucher.storeService.storeId !== user.storeId) {
        throw new ForbiddenException('Este voucher não pertence a um serviço da sua loja.');
      }
    }

    if (voucher.status === VoucherStatus.USED) {
      throw new BadRequestException('Voucher already used');
    }

    if (new Date(voucher.expiresAt) < new Date()) {
      throw new BadRequestException('Voucher expired');
    }

    const updated = await this.prisma.voucher.update({
      where: { code },
      // usedAt existia e nunca era preenchido — sem ele não dá para fechar o
      // acerto com a loja por período.
      data: { status: VoucherStatus.USED, usedAt: new Date() },
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
