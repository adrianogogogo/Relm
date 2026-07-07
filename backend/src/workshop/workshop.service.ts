import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PointsService } from '../points/points.service';
import { ServiceType, PriorityLevel, ServiceStatus } from '@prisma/client';
import { ENTITLEMENTS } from '../common/entitlements';

@Injectable()
export class WorkshopService {
  private readonly logger = new Logger(WorkshopService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pointsService: PointsService,
  ) {}

  async getAvailableSlots(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    const ent = ENTITLEMENTS[customer.currentTier];

    const baseSlots = [
      '2026-07-07T09:00:00Z',
      '2026-07-07T11:00:00Z',
      '2026-07-07T14:00:00Z',
      '2026-07-07T16:00:00Z',
    ];

    const vipSlots = [
      '2026-07-07T08:00:00Z',
      '2026-07-07T17:00:00Z',
    ];

    const slots = ent.prioritySlots ? [...vipSlots, ...baseSlots].sort() : baseSlots;

    return {
      customerId,
      tier: customer.currentTier,
      availableSlots: slots,
    };
  }

  async bookSlot(dto: {
    customerId: string;
    storeId: string;
    bikeModel: string;
    serviceType: ServiceType;
    scheduledFor: Date;
    deliveryRequest?: boolean;
  }) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    const ent = ENTITLEMENTS[customer.currentTier];
    const priority = ent.prioritySlots ? PriorityLevel.HIGH_PRIORITY : PriorityLevel.STANDARD;

    if (!ent.completeRevision && dto.serviceType === ServiceType.REVISION_COMPLETE) {
      throw new BadRequestException('Complete revision is only available to Care Plus members.');
    }

    if (!ent.delivery && dto.deliveryRequest) {
      throw new BadRequestException('Delivery request is only available to Care Plus members.');
    }

    // Cota anual de revisões básicas gratuitas (null = ilimitado).
    if (ent.freeBasicRevisionsPerYear !== null && dto.serviceType === ServiceType.REVISION_BASIC) {
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      const usedThisYear = await this.prisma.serviceOrder.count({
        where: {
          customerId: dto.customerId,
          serviceType: ServiceType.REVISION_BASIC,
          createdAt: { gte: oneYearAgo },
          status: { not: ServiceStatus.CANCELLED },
        },
      });

      if (usedThisYear >= ent.freeBasicRevisionsPerYear) {
        throw new BadRequestException(
          `Cota de ${ent.freeBasicRevisionsPerYear} revisão(ões) básica(s) por ano atingida.`,
        );
      }
    }

    const order = await this.prisma.serviceOrder.create({
      data: {
        customerId: dto.customerId,
        storeId: dto.storeId,
        bikeModel: dto.bikeModel,
        serviceType: dto.serviceType,
        priority,
        deliveryRequest: ent.delivery ? !!dto.deliveryRequest : false,
        scheduledFor: new Date(dto.scheduledFor),
        status: ServiceStatus.SCHEDULED,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: null,
        action: 'UPDATE_SENSITIVE',
        entity: 'service_orders',
        entityId: order.id,
        metadata: { serviceType: dto.serviceType, priority, scheduledFor: dto.scheduledFor },
      },
    });

    return order;
  }

  async getCustomerOrders(customerId: string) {
    return this.prisma.serviceOrder.findMany({
      where: { customerId },
      include: {
        store: true,
      },
      orderBy: {
        scheduledFor: 'desc',
      },
    });
  }

  async getStoreOrders(storeId: string) {
    return this.prisma.serviceOrder.findMany({
      where: { storeId },
      include: {
        customer: true,
      },
      orderBy: {
        scheduledFor: 'desc',
      },
    });
  }

  async updateOrderStatus(id: string, status: ServiceStatus) {
    const order = await this.prisma.serviceOrder.findUnique({
      where: { id },
    });

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

    // Credita pontos de fidelidade apenas na transição real para COMPLETED.
    if (status === ServiceStatus.COMPLETED && order.status !== ServiceStatus.COMPLETED) {
      await this.pointsService.addWorkshopCompletionPoints(order.customerId, id);
    }

    return updated;
  }
}
