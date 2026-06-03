import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InsuranceService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    const lastProtocol = await this.prisma.insuranceQuote.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { protocolNumber: true },
    });
    const lastNumber = lastProtocol ? parseInt(lastProtocol.protocolNumber.split('-').pop()) : 0;
    const protocolNumber = `SEG-2024-${String(lastNumber + 1).padStart(5, '0')}`;

    return this.prisma.insuranceQuote.create({
      data: { ...data, protocolNumber },
    });
  }

  async findAll(filters?: { storeId?: string; customerId?: string; status?: string }) {
    const where: any = {};

    if (filters?.status) where.status = filters.status;

    if (filters?.customerId) {
      where.customerId = filters.customerId;
    } else if (filters?.storeId) {
      where.customer = { storeId: filters.storeId };
    }

    return this.prisma.insuranceQuote.findMany({
      where,
      include: {
        customer: { select: { id: true, fullName: true, email: true, phone: true } },
        product: { select: { id: true, model: true, serialNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
