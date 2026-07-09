import { Injectable, BadRequestException } from '@nestjs/common';
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
    return this.prisma.warrantyClaim.findMany({
      where: { customerId },
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

  async getInsuranceQuotes(customerId: string) {
    return this.prisma.insuranceQuote.findMany({
      where: { customerId },
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

  async getEvents(customerId: string) {
    return this.prisma.eventRegistration.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            location: true,
            startAt: true,
            endAt: true,
          },
        },
      },
    });
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
