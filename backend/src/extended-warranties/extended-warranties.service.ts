import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GrantWarrantyDto } from './dto/grant-warranty.dto';
import { CancelWarrantyDto } from './dto/cancel-warranty.dto';

@Injectable()
export class ExtendedWarrantiesService {
  constructor(private prisma: PrismaService) {}

  async grant(grantDto: GrantWarrantyDto, userId: string) {
    // Verificar se o produto existe e está aprovado
    const product = await this.prisma.customerProduct.findUnique({
      where: { id: grantDto.customerProductId },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    if (product.verificationStatus !== 'APPROVED') {
      throw new BadRequestException('Produto precisa estar aprovado para receber garantia');
    }

    // Calcular data de término
    const startDate = new Date(grantDto.startDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + grantDto.durationMonths);

    // Criar garantia
    const warranty = await this.prisma.extendedWarranty.create({
      data: {
        customerProductId: grantDto.customerProductId,
        customerId: grantDto.customerId,
        type: grantDto.type,
        startDate,
        endDate,
        durationMonths: grantDto.durationMonths,
        pricePaid: grantDto.pricePaid || 0,
        paymentStatus: grantDto.paymentStatus || 'FREE',
        paymentMethod: grantDto.paymentMethod,
        clubPointsUsed: grantDto.clubPointsUsed || 0,
        claimsAllowed: grantDto.claimsAllowed || 1,
        notes: grantDto.notes,
        grantedByUserId: userId,
        status: 'ACTIVE',
      },
      include: {
        customerProduct: {
          include: {
            productCatalog: true,
          },
        },
      },
    });

    // Registrar no histórico
    await this.prisma.productHistory.create({
      data: {
        customerProductId: grantDto.customerProductId,
        eventType: 'WARRANTY_GRANTED',
        description: `Garantia estendida concedida (${grantDto.type}, ${grantDto.durationMonths} meses)`,
        performedByUserId: userId,
        notes: grantDto.notes,
      },
    });

    return warranty;
  }

  async findAll(filters?: {
    customerId?: string;
    customerProductId?: string;
    status?: string;
    type?: string;
  }) {
    const where: any = {};

    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters?.customerProductId) {
      where.customerProductId = filters.customerProductId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    return this.prisma.extendedWarranty.findMany({
      where,
      orderBy: [
        { createdAt: 'desc' },
      ],
      include: {
        customerProduct: {
          include: {
            productCatalog: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const warranty = await this.prisma.extendedWarranty.findUnique({
      where: { id },
      include: {
        customerProduct: {
          include: {
            productCatalog: true,
            warrantyClaims: {
              where: {
                status: { in: ['RECEBIDO', 'EM_ANALISE', 'AGUARDANDO_PECAS', 'EM_REPARO'] },
              },
            },
          },
        },
      },
    });

    if (!warranty) {
      throw new NotFoundException(`Garantia ${id} não encontrada`);
    }

    return warranty;
  }

  async cancel(id: string, cancelDto: CancelWarrantyDto, userId: string) {
    const warranty = await this.findOne(id);

    if (warranty.status !== 'ACTIVE') {
      throw new BadRequestException('Apenas garantias ativas podem ser canceladas');
    }

    const updated = await this.prisma.extendedWarranty.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledByUserId: userId,
        cancellationReason: cancelDto.cancellationReason,
        notes: cancelDto.notes || warranty.notes,
        updatedAt: new Date(),
      },
    });

    // Registrar no histórico
    await this.prisma.productHistory.create({
      data: {
        customerProductId: warranty.customerProductId,
        eventType: 'WARRANTY_CANCELLED',
        description: `Garantia estendida cancelada: ${cancelDto.cancellationReason}`,
        performedByUserId: userId,
        notes: cancelDto.notes,
      },
    });

    return updated;
  }

  async checkExpired() {
    const now = new Date();

    // Buscar garantias ativas que expiraram
    const expired = await this.prisma.extendedWarranty.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lt: now,
        },
      },
    });

    // Atualizar status
    for (const warranty of expired) {
      await this.prisma.extendedWarranty.update({
        where: { id: warranty.id },
        data: { status: 'EXPIRED' },
      });
    }

    return { expired: expired.length };
  }

  async getStatistics() {
    const total = await this.prisma.extendedWarranty.count();
    const active = await this.prisma.extendedWarranty.count({
      where: { status: 'ACTIVE' },
    });
    const expired = await this.prisma.extendedWarranty.count({
      where: { status: 'EXPIRED' },
    });
    const cancelled = await this.prisma.extendedWarranty.count({
      where: { status: 'CANCELLED' },
    });

    const byType = await this.prisma.extendedWarranty.groupBy({
      by: ['type'],
      _count: true,
    });

    const totalRevenue = await this.prisma.extendedWarranty.aggregate({
      where: {
        paymentStatus: 'PAID',
      },
      _sum: {
        pricePaid: true,
      },
    });

    return {
      total,
      byStatus: {
        active,
        expired,
        cancelled,
      },
      byType: byType.map((t) => ({ type: t.type, count: t._count })),
      revenue: {
        total: totalRevenue._sum.pricePaid || 0,
      },
    };
  }
}
