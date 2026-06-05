import { Injectable, NotFoundException } from '@nestjs/common';
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
        customer: { select: { id: true, fullName: true, email: true, phone: true, cpf: true } },
        product: { select: { id: true, model: true, serialNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const quote = await this.prisma.insuranceQuote.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, fullName: true, email: true, phone: true, cpf: true } },
        product: { select: { id: true, model: true, serialNumber: true } },
      },
    });

    if (!quote) throw new NotFoundException('Cotação não encontrada');
    return quote;
  }

  async approve(id: string, data: { quoteValue: number; insuranceCompany: string }) {
    const quote = await this.prisma.insuranceQuote.findUnique({ where: { id } });
    if (!quote) throw new NotFoundException('Cotação não encontrada');

    return this.prisma.insuranceQuote.update({
      where: { id },
      data: {
        status: 'APPROVED',
        quoteValue: data.quoteValue,
        insuranceCompany: data.insuranceCompany,
      },
      include: {
        customer: { select: { id: true, fullName: true, email: true, phone: true, cpf: true } },
      },
    });
  }

  async reject(id: string) {
    const quote = await this.prisma.insuranceQuote.findUnique({ where: { id } });
    if (!quote) throw new NotFoundException('Cotação não encontrada');

    return this.prisma.insuranceQuote.update({
      where: { id },
      data: { status: 'REJECTED' },
      include: {
        customer: { select: { id: true, fullName: true, email: true, phone: true, cpf: true } },
      },
    });
  }

  async convert(id: string) {
    const quote = await this.prisma.insuranceQuote.findUnique({ where: { id } });
    if (!quote) throw new NotFoundException('Cotação não encontrada');

    return this.prisma.insuranceQuote.update({
      where: { id },
      data: { status: 'CONVERTED' },
      include: {
        customer: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  async renew(id: string) {
    const quote = await this.prisma.insuranceQuote.findUnique({ where: { id } });
    if (!quote) throw new NotFoundException('Cotação não encontrada');

    return this.prisma.insuranceQuote.update({
      where: { id },
      data: { status: 'PENDING' },
      include: {
        customer: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  async createAdminQuote(data: {
    customerId: string;
    productId?: string;
    bikeValue?: number;
    city?: string;
    state?: string;
  }) {
    const lastProtocol = await this.prisma.insuranceQuote.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { protocolNumber: true },
    });
    const lastNumber = lastProtocol ? parseInt(lastProtocol.protocolNumber.split('-').pop()) : 0;
    const protocolNumber = `SEG-2024-${String(lastNumber + 1).padStart(5, '0')}`;

    return this.prisma.insuranceQuote.create({
      data: { ...data, protocolNumber, status: 'PENDING' },
      include: {
        customer: { select: { id: true, fullName: true, email: true } },
      },
    });
  }
}
