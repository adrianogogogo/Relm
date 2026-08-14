import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PointsService } from '../points/points.service';
import {
  Prisma,
  ServiceType,
  PriorityLevel,
  ServiceStatus,
  LogisticsStatus,
  TierLevel,
  SubStatus,
} from '@prisma/client';
import {
  ENTITLEMENTS,
  ALLOWANCE_SERVICE_TYPES,
  SERVICE_TYPE_LABELS,
  isAllowanceType,
  WorkshopServiceType,
} from '../common/entitlements';

// Transições válidas da logística leva-e-traz (Wave 6). Sequência linear.
const LOGISTICS_TRANSITIONS: Record<LogisticsStatus, LogisticsStatus[]> = {
  COLETA_AGENDADA: [LogisticsStatus.EM_TRANSPORTE_COLETA],
  EM_TRANSPORTE_COLETA: [LogisticsStatus.NA_OFICINA],
  NA_OFICINA: [LogisticsStatus.EM_TRANSPORTE_ENTREGA],
  EM_TRANSPORTE_ENTREGA: [LogisticsStatus.ENTREGUE],
  ENTREGUE: [],
};

/** Início/fim do ano civil atual — janela da cota anual. */
function currentYearRange(): { start: Date; end: Date } {
  const year = new Date().getFullYear();
  return {
    start: new Date(Date.UTC(year, 0, 1, 0, 0, 0)),
    end: new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0)),
  };
}

@Injectable()
export class WorkshopService {
  private readonly logger = new Logger(WorkshopService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pointsService: PointsService,
  ) {}

  /**
   * Deriva o tier a partir da Subscription no banco (NUNCA do payload do cliente).
   * PLUS só se a assinatura estiver ativa; caso contrário CARE.
   */
  private async resolveTier(customerId: string): Promise<TierLevel> {
    const sub = await this.prisma.subscription.findUnique({
      where: { customerId },
    });
    if (sub?.tier === TierLevel.PLUS && sub.status === SubStatus.ACTIVE) {
      return TierLevel.PLUS;
    }
    return TierLevel.CARE;
  }

  async getAvailableSlots(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    const tier = await this.resolveTier(customerId);
    const ent = ENTITLEMENTS[tier];

    const baseSlots = [
      '2026-07-07T09:00:00Z',
      '2026-07-07T11:00:00Z',
      '2026-07-07T14:00:00Z',
      '2026-07-07T16:00:00Z',
    ];

    const vipSlots = ['2026-07-07T08:00:00Z', '2026-07-07T17:00:00Z'];

    const slots = ent.prioritySlots ? [...vipSlots, ...baseSlots].sort() : baseSlots;

    return {
      customerId,
      tier,
      availableSlots: slots,
    };
  }

  /**
   * Saldo anual de serviços por tipo (usado/permitido) para o ano civil.
   * Tier derivado da Subscription. Consumido pela tela do cliente.
   */
  async getAllowanceSummary(customerId: string) {
    if (!customerId) {
      throw new BadRequestException('customerId é obrigatório');
    }
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    const tier = await this.resolveTier(customerId);
    const ent = ENTITLEMENTS[tier];
    const { start, end } = currentYearRange();

    const grouped = await this.prisma.serviceOrder.groupBy({
      by: ['serviceType'],
      where: {
        customerId,
        createdAt: { gte: start, lt: end },
        status: { not: ServiceStatus.CANCELLED },
      },
      _count: { _all: true },
    });

    const usedByType = new Map<string, number>();
    for (const g of grouped) {
      usedByType.set(g.serviceType, g._count._all);
    }

    const items = ALLOWANCE_SERVICE_TYPES.map((type) => {
      const allowed = ent.serviceAllowancePerYear[type];
      const used = usedByType.get(type) ?? 0;
      return {
        serviceType: type,
        label: SERVICE_TYPE_LABELS[type] ?? type,
        allowed,
        used,
        remaining: Math.max(allowed - used, 0),
        includedInTier: allowed > 0,
      };
    });

    return { customerId, tier, year: new Date().getFullYear(), items };
  }

  async bookSlot(dto: {
    customerId: string;
    storeId: string;
    bikeModel: string;
    serviceType: ServiceType;
    storeServiceId?: string;
    scheduledFor: Date;
    deliveryRequest?: boolean;
    pickupAddress?: string;
  }) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    // Tier SEMPRE derivado da Subscription — nunca confie no cliente.
    const tier = await this.resolveTier(dto.customerId);
    const ent = ENTITLEMENTS[tier];
    const priority = ent.prioritySlots
      ? PriorityLevel.HIGH_PRIORITY
      : PriorityLevel.STANDARD;

    const isBuscaEntrega = dto.serviceType === ServiceType.BUSCA_ENTREGA;

    // Se informou storeServiceId, buscar detalhes do serviço da loja
    let priceCharged: number | null = null;
    let estimatedMinutes: number | null = null;

    if (dto.storeServiceId) {
      const storeService = await this.prisma.storeService.findUnique({
        where: { id: dto.storeServiceId },
      });

      if (storeService) {
        estimatedMinutes = storeService.estimatedMinutes;
        const basePrice = Number(storeService.price);

        if (tier === TierLevel.PLUS) {
          if (storeService.plusRule === 'FREE') {
            priceCharged = 0;
          } else if (storeService.plusRule === 'DISCOUNT_PERCENT') {
            const discount = storeService.plusDiscountPercent || 0;
            priceCharged = Math.max(0, basePrice * (1 - discount / 100));
          } else if (storeService.plusRule === 'FIXED_PRICE') {
            priceCharged = Number(storeService.plusPrice ?? basePrice);
          } else {
            priceCharged = basePrice;
          }
        } else {
          priceCharged = basePrice;
        }
      }
    }

    // Diagnóstico continua gateado por completeRevision (sem cota).
    if (!ent.completeRevision && dto.serviceType === ServiceType.DIAGNOSTIC) {
      throw new BadRequestException(
        'Diagnóstico técnico é exclusivo para membros Care Plus.',
      );
    }

    // Cota anual por tipo (Wave 6) — fonte única em entitlements.
    // A checagem é feita DENTRO da transação (re-contagem) para evitar corrida.
    if (isAllowanceType(dto.serviceType)) {
      const type = dto.serviceType as ServiceType & WorkshopServiceType;
      const allowed = ent.serviceAllowancePerYear[type];
      const label = SERVICE_TYPE_LABELS[type] ?? type;

      if (allowed <= 0) {
        throw new BadRequestException(
          `${label} não está incluso no seu plano. Seja Care Plus para desbloquear.`,
        );
      }
    }

    if (isBuscaEntrega && !dto.pickupAddress?.trim()) {
      throw new BadRequestException(
        'Endereço de coleta é obrigatório para o serviço de busca e entrega.',
      );
    }

    const { start, end } = currentYearRange();

    // Transação: re-conta a cota do ano dentro do tx e só então cria (check-then-act
    // protegido contra corrida — regra obrigatória das ondas 1-5).
    const order = await this.prisma.$transaction(async (tx) => {
      if (isAllowanceType(dto.serviceType)) {
        const type = dto.serviceType as ServiceType & WorkshopServiceType;
        const allowed = ent.serviceAllowancePerYear[type];
        const label = SERVICE_TYPE_LABELS[type] ?? type;

        const usedThisYear = await tx.serviceOrder.count({
          where: {
            customerId: dto.customerId,
            serviceType: dto.serviceType,
            createdAt: { gte: start, lt: end },
            status: { not: ServiceStatus.CANCELLED },
          },
        });

        if (usedThisYear >= allowed) {
          throw new BadRequestException(
            `Cota anual de ${allowed} "${label}" já foi atingida neste ano. ` +
              (tier === TierLevel.CARE
                ? 'Seja Care Plus para ampliar seus serviços.'
                : ''),
          );
        }
      }

      const created = await tx.serviceOrder.create({
        data: {
          customerId: dto.customerId,
          storeId: dto.storeId,
          storeServiceId: dto.storeServiceId || null,
          bikeModel: dto.bikeModel,
          serviceType: dto.serviceType,
          priceCharged: priceCharged !== null ? priceCharged : null,
          estimatedMinutes: estimatedMinutes !== null ? estimatedMinutes : null,
          priority,
          deliveryRequest: isBuscaEntrega || (ent.delivery ? !!dto.deliveryRequest : false),
          pickupAddress: isBuscaEntrega ? dto.pickupAddress?.trim() : null,
          logisticsStatus: isBuscaEntrega ? LogisticsStatus.COLETA_AGENDADA : null,
          scheduledFor: new Date(dto.scheduledFor),
          status: ServiceStatus.SCHEDULED,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: null,
          action: 'UPDATE_SENSITIVE',
          entity: 'service_orders',
          entityId: created.id,
          metadata: {
            serviceType: dto.serviceType,
            priority,
            scheduledFor: dto.scheduledFor,
          },
        },
      });

      return created;
    });

    return order;
  }

  async getCustomerOrders(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, email: true, cpf: true },
    });

    if (!customer) return [];

    const emailNorm = customer.email ? customer.email.trim().toLowerCase() : '';

    return this.prisma.serviceOrder.findMany({
      where: {
        OR: [
          { customerId: customer.id },
          ...(emailNorm
            ? [{ customer: { email: { equals: emailNorm, mode: Prisma.QueryMode.insensitive } } }]
            : []),
          ...(customer.cpf ? [{ customer: { cpf: customer.cpf } }] : []),
        ],
      },
      include: {
        store: true,
        storeService: {
          include: { masterService: true },
        },
      },
      orderBy: { scheduledFor: 'desc' },
    });
  }

  /**
   * Pedidos da loja com flag isPriority derivada do tier (via join, sem coluna
   * armazenada). PLUS aparece primeiro (fila prioritária).
   */
  async getStoreOrders(storeId: string) {
    const orders = await this.prisma.serviceOrder.findMany({
      where: { storeId },
      include: {
        customer: true,
        storeService: {
          include: { masterService: true },
        },
      },
      orderBy: { scheduledFor: 'desc' },
    });

    const withPriority = orders.map((o) => ({
      ...o,
      isPriority: o.customer?.currentTier === TierLevel.PLUS,
    }));

    // Prioritários primeiro; dentro do grupo mantém ordem por scheduledFor desc.
    return withPriority.sort((a, b) => {
      if (a.isPriority === b.isPriority) return 0;
      return a.isPriority ? -1 : 1;
    });
  }

  async updateOrderStatus(id: string, status: ServiceStatus) {
    const order = await this.prisma.serviceOrder.findUnique({ where: { id } });

    if (!order) {
      throw new BadRequestException('Service order not found');
    }

    const updated = await this.prisma.serviceOrder.update({
      where: { id },
      data: { status },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: null,
        action: 'UPDATE_STATUS',
        entity: 'service_orders',
        entityId: id,
        metadata: { oldStatus: order.status, newStatus: status },
      },
    });

    // Credita pontos apenas na transição real para COMPLETED.
    if (status === ServiceStatus.COMPLETED && order.status !== ServiceStatus.COMPLETED) {
      await this.pointsService.addWorkshopCompletionPoints(order.customerId, id);
    }

    return updated;
  }

  /**
   * Avança o status de logística de uma ordem BUSCA_ENTREGA seguindo o mapa de
   * transições válidas. Atômico via updateMany + verificação de contagem (guarda
   * contra transição concorrente sobre o mesmo estado).
   */
  async advanceLogistics(id: string, next: LogisticsStatus) {
    const order = await this.prisma.serviceOrder.findUnique({ where: { id } });
    if (!order) {
      throw new BadRequestException('Ordem de serviço não encontrada.');
    }
    if (order.serviceType !== ServiceType.BUSCA_ENTREGA) {
      throw new BadRequestException(
        'Logística só se aplica a ordens de busca e entrega.',
      );
    }

    const current = order.logisticsStatus ?? LogisticsStatus.COLETA_AGENDADA;
    const allowedNext = LOGISTICS_TRANSITIONS[current] ?? [];
    if (!allowedNext.includes(next)) {
      throw new BadRequestException(
        `Transição de logística inválida: ${current} → ${next}.`,
      );
    }

    // updateMany condicionado ao estado atual: só 1 chamada vence a corrida.
    const result = await this.prisma.serviceOrder.updateMany({
      where: { id, logisticsStatus: current },
      data: { logisticsStatus: next },
    });

    if (result.count === 0) {
      throw new BadRequestException(
        'O status de logística mudou. Atualize e tente novamente.',
      );
    }

    await this.prisma.auditLog.create({
      data: {
        userId: null,
        action: 'UPDATE_STATUS',
        entity: 'service_orders',
        entityId: id,
        metadata: { logisticsFrom: current, logisticsTo: next },
      },
    });

    return this.prisma.serviceOrder.findUnique({ where: { id } });
  }
}
