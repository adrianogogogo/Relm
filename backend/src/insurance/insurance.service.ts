import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CustomersService } from '../customers/customers.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateInsurancePublicDto } from './dto/create-insurance-public.dto';
import * as crypto from 'crypto';

@Injectable()
export class InsuranceService {
  constructor(
    private prisma: PrismaService,
    private customersService: CustomersService,
    private notificationsService: NotificationsService,
  ) {}

  // Gera número de protocolo único e resistente a concorrência.
  //
  // DECISÃO (SEC-01/BUG-01/ORG-02): a estratégia anterior "último + 1" estava
  // duplicada em create() e createAdminQuote() e sofria de race condition
  // (protocolos duplicados em requests concorrentes, violando o @unique) e de
  // NaN no parseInt. Trocada por sufixo aleatório via crypto.randomBytes, com
  // ano dinâmico (não mais 2024 hardcoded). Lógica única extraída para este
  // método privado e reusada nos dois pontos de criação.
  private generateProtocolNumber(): string {
    const year = new Date().getFullYear();
    const suffix = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `SEG-${year}-${suffix}`;
  }

  async create(data: CreateInsurancePublicDto) {
    // Resolve/cria o cliente pelo email a partir dos dados públicos.
    // Não confiamos no body para customerId/status/quoteValue/protocolNumber.
    const customer = await this.customersService.upsertByEmail({
      email: data.email,
      fullName: data.fullName,
      phone: data.phone,
      city: data.city,
      state: data.state,
    });

    const protocolNumber = this.generateProtocolNumber();

    // Campos definidos explicitamente pelo servidor (sem spread do body).
    const quote = await this.prisma.insuranceQuote.create({
      data: {
        protocolNumber,
        customerId: customer.id,
        bikeValue: data.bikeValue,
        city: data.city,
        state: data.state,
        status: 'PENDING',
      },
    });

    // Notificação best-effort para a equipe Relm (nunca quebra a cotação).
    await this.notificationsService.notifyTeam({
      type: 'INSURANCE_NEW',
      title: 'Nova cotação de seguro',
      message: `Protocolo ${quote.protocolNumber} — ${customer.fullName}.`,
      link: `/admin/insurances`,
    });

    return quote;
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
    const protocolNumber = this.generateProtocolNumber();

    return this.prisma.insuranceQuote.create({
      data: { ...data, protocolNumber, status: 'PENDING' },
      include: {
        customer: { select: { id: true, fullName: true, email: true } },
      },
    });
  }
}
