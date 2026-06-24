import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
