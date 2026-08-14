import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCustomerProfileDto } from './dto/update-profile.dto';
import { UpdateCustomerPasswordDto } from './dto/update-password.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class CustomerPortalService {
  constructor(private prisma: PrismaService) {}

  async getProfile(customerId: string) {
    return this.prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        cpf: true,
        birthDate: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        marketingConsent: true,
        createdAt: true,
      },
    });
  }

  async updateProfile(customerId: string, dto: UpdateCustomerProfileDto) {
    return this.prisma.customer.update({
      where: { id: customerId },
      data: dto,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        cpf: true,
        birthDate: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        marketingConsent: true,
      },
    });
  }

  async updatePassword(customerId: string, dto: UpdateCustomerPasswordDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer || !customer.passwordHash) {
      throw new BadRequestException('Usuário não encontrado ou não possui senha definida.');
    }

    const matches = await bcrypt.compare(dto.oldPassword, customer.passwordHash);
    if (!matches) {
      throw new BadRequestException('A senha antiga está incorreta.');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.customer.update({
      where: { id: customerId },
      data: { passwordHash: newHash },
    });

    return { message: 'Senha alterada com sucesso.' };
  }

  async getWarranties(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, email: true, cpf: true },
    });

    if (!customer) return [];

    const emailNorm = customer.email ? customer.email.trim().toLowerCase() : '';

    return this.prisma.warrantyClaim.findMany({
      where: {
        OR: [
          { customerId: customer.id },
          ...(emailNorm
            ? [{ customer: { email: { equals: emailNorm, mode: Prisma.QueryMode.insensitive } } }]
            : []),
          ...(customer.cpf ? [{ customer: { cpf: customer.cpf } }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        protocolNumber: true,
        statusId: true,
        invoiceNumber: true,
        purchaseStoreName: true,
        purchaseStoreCity: true,
        purchaseStoreState: true,
        customerNotes: true,
        rejectionReason: true,
        createdAt: true,
        updatedAt: true,
        product: {
          select: {
            model: true,
            productType: true,
            brand: true,
            serialNumber: true,
          },
        },
        // events: removido na Fase 4 (WarrantyEvent → WarrantyHistory)
        history: {
          orderBy: { createdAt: 'asc' },
          select: {
            actionType: true,
            note: true,
            createdAt: true,
          },
        },
      },
    });
  }

  // Compras do cliente (vendas registradas pela loja) com a vigência de
  // garantia de cada item. warrantyEndsAt já vem gravado (saleDate + prazo);
  // o tempo restante é calculated no frontend a partir dele.
  async getPurchases(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, email: true, cpf: true },
    });

    if (!customer) {
      return [];
    }

    const emailNorm = customer.email ? customer.email.trim().toLowerCase() : '';

    return this.prisma.sale.findMany({
      where: {
        OR: [
          { customerId: customer.id },
          ...(emailNorm
            ? [{ customer: { email: { equals: emailNorm, mode: Prisma.QueryMode.insensitive } } }]
            : []),
          ...(customer.cpf ? [{ customer: { cpf: customer.cpf } }] : []),
        ],
      },
      orderBy: { saleDate: 'desc' },
      select: {
        id: true,
        saleDate: true,
        invoiceNumber: true,
        notes: true,
        store: { select: { id: true, tradeName: true } },
        items: {
          select: {
            id: true,
            commercialName: true,
            quantity: true,
            serialNumber: true,
            unitPrice: true,
            warrantyDays: true,
            warrantyEndsAt: true,
          },
        },
      },
    });
  }

  async getInsuranceQuotes(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, email: true, cpf: true },
    });

    if (!customer) return [];

    const emailNorm = customer.email ? customer.email.trim().toLowerCase() : '';

    return this.prisma.insuranceQuote.findMany({
      where: {
        OR: [
          { customerId: customer.id },
          ...(emailNorm
            ? [{ customer: { email: { equals: emailNorm, mode: Prisma.QueryMode.insensitive } } }]
            : []),
          ...(customer.cpf ? [{ customer: { cpf: customer.cpf } }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        protocolNumber: true,
        status: true,
        bikeValue: true,
        city: true,
        state: true,
        quoteValue: true,
        insuranceCompany: true,
        createdAt: true,
        product: {
          select: { model: true, productType: true, serialNumber: true },
        },
      },
    });
  }

  async getInsurancePolicies(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, email: true, cpf: true },
    });

    if (!customer) return [];

    const emailNorm = customer.email ? customer.email.trim().toLowerCase() : '';

    return this.prisma.insurancePolicy.findMany({
      where: {
        OR: [
          { customerId: customer.id },
          ...(emailNorm
            ? [{ customer: { email: { equals: emailNorm, mode: Prisma.QueryMode.insensitive } } }]
            : []),
          ...(customer.cpf ? [{ customer: { cpf: customer.cpf } }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        policyNumber: true,
        insurer: true,
        coverage: true,
        premium: true,
        status: true,
        startsAt: true,
        expiresAt: true,
        createdAt: true,
        product: {
          select: { model: true, productType: true, serialNumber: true },
        },
      },
    });
  }

  async getEvents(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, email: true },
    });

    const email = customer?.email?.trim().toLowerCase();

    return this.prisma.eventRegistration.findMany({
      where: {
        OR: [
          { customerId },
          ...(email
            ? [
                {
                  customer: {
                    email: {
                      equals: email,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                },
              ]
            : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        attended: true,
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            location: true,
            startAt: true,
            endAt: true,
            active: true,
          },
        },
      },
    });
  }

  async registerEvent(customerId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { _count: { select: { registrations: true } } },
    });

    if (!event) throw new BadRequestException('Evento não encontrado');
    if (!event.active) throw new BadRequestException('Inscrições encerradas para este evento');

    if (event.maxParticipants && event._count.registrations >= event.maxParticipants) {
      throw new BadRequestException('Evento sem vagas disponíveis');
    }

    const customer = await this.prisma.customer.findUniqueOrThrow({
      where: { id: customerId },
    });

    const email = customer.email.trim().toLowerCase();

    const existing = await this.prisma.eventRegistration.findFirst({
      where: {
        eventId,
        OR: [
          { customerId },
          {
            customer: {
              email: {
                equals: email,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          },
        ],
      },
    });

    if (existing) {
      throw new BadRequestException('Você já está inscrito neste evento');
    }

    const reg = await this.prisma.eventRegistration.create({
      data: { eventId, customerId },
    });

    return {
      success: true,
      message: 'Inscrição realizada com sucesso!',
      registrationId: reg.id,
      event: { id: event.id, title: event.title, startAt: event.startAt },
    };
  }

  async getBenefits() {
    const now = new Date();
    return this.prisma.benefit.findMany({
      where: {
        active: true,
        validFrom: { lte: now },
        validUntil: { gte: now },
        OR: [
          { targetRoles: { isEmpty: true } },
          { targetRoles: { has: 'CLIENTE' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        terms: true,
        validFrom: true,
        validUntil: true,
      },
    });
  }
}
