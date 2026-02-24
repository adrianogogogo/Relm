#!/bin/bash

cd /var/www/relm-careplus-prod/backend

echo "=== BACKUP CURRENT SERVICE ==="
cp src/insurance/insurance.service.ts src/insurance/insurance.service.ts.backup-$(date +%Y%m%d-%H%M%S)

echo ""
echo "=== CREATE NEW INSURANCE SERVICE ==="

cat > src/insurance/insurance.service.ts << 'EOFSERVICE'
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuoteDto, CreatePolicyDto, UpdateQuoteDto, UpdatePolicyDto } from './dto';

@Injectable()
export class InsuranceService {
  constructor(private prisma: PrismaService) {}

  // =====================
  // QUOTES
  // =====================

  async createQuote(dto: CreateQuoteDto) {
    // Find or create customer by email
    let customer = await this.prisma.customer.findUnique({
      where: { email: dto.email },
    });

    if (!customer) {
      // Create new customer
      customer = await this.prisma.customer.create({
        data: {
          email: dto.email,
          name: dto.customerName,
          phone: dto.phone,
          cpf: dto.cpf,
        },
      });
    }

    // Generate protocol number
    const protocolNumber = await this.generateProtocolNumber();

    // Create quote
    const quote = await this.prisma.insuranceQuote.create({
      data: {
        protocolNumber,
        customerId: customer.id,
        bikeValue: dto.bikeValue,
        city: dto.city,
        state: dto.state,
        status: 'PENDING',
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return quote;
  }

  async findAllQuotes(filters?: { status?: string; customerId?: string }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }

    return this.prisma.insuranceQuote.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            cpf: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findQuoteById(id: string) {
    const quote = await this.prisma.insuranceQuote.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            cpf: true,
          },
        },
        policies: {
          select: {
            id: true,
            policyNumber: true,
            status: true,
            insuranceCompany: true,
            monthlyPremium: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    if (!quote) {
      throw new NotFoundException(`Quote with ID ${id} not found`);
    }

    return quote;
  }

  async updateQuote(id: string, dto: UpdateQuoteDto) {
    const quote = await this.findQuoteById(id);

    return this.prisma.insuranceQuote.update({
      where: { id },
      data: dto,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async approveQuote(id: string, quoteValue: number, insuranceCompany: string) {
    return this.updateQuote(id, {
      status: 'APPROVED',
      quoteValue,
      insuranceCompany,
    });
  }

  async rejectQuote(id: string) {
    return this.updateQuote(id, { status: 'REJECTED' });
  }

  // =====================
  // POLICIES
  // =====================

  async createPolicy(dto: CreatePolicyDto) {
    // Validate customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${dto.customerId} not found`);
    }

    // If quoteId provided, validate and update quote status
    if (dto.quoteId) {
      const quote = await this.prisma.insuranceQuote.findUnique({
        where: { id: dto.quoteId },
      });

      if (!quote) {
        throw new NotFoundException(`Quote with ID ${dto.quoteId} not found`);
      }

      // Update quote status to CONVERTED
      await this.prisma.insuranceQuote.update({
        where: { id: dto.quoteId },
        data: { status: 'CONVERTED' },
      });
    }

    // Generate policy number
    const policyNumber = await this.generatePolicyNumber();

    // Create policy
    const policy = await this.prisma.insurancePolicy.create({
      data: {
        policyNumber,
        quoteId: dto.quoteId,
        customerId: dto.customerId,
        productId: dto.productId,
        insuranceCompany: dto.insuranceCompany,
        bikeValue: dto.bikeValue,
        coverageValue: dto.coverageValue,
        monthlyPremium: dto.monthlyPremium,
        annualPremium: dto.annualPremium,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        coverageType: dto.coverageType,
        deductible: dto.deductible,
        notes: dto.notes,
        status: 'ACTIVE',
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            model: true,
          },
        },
        quote: {
          select: {
            id: true,
            protocolNumber: true,
          },
        },
      },
    });

    return policy;
  }

  async findAllPolicies(filters?: { status?: string; customerId?: string }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }

    return this.prisma.insurancePolicy.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            model: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPolicyById(id: string) {
    const policy = await this.prisma.insurancePolicy.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            cpf: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            model: true,
            brand: true,
          },
        },
        quote: {
          select: {
            id: true,
            protocolNumber: true,
            bikeValue: true,
            city: true,
            state: true,
          },
        },
      },
    });

    if (!policy) {
      throw new NotFoundException(`Policy with ID ${id} not found`);
    }

    return policy;
  }

  async updatePolicy(id: string, dto: UpdatePolicyDto) {
    await this.findPolicyById(id);

    const data: any = { ...dto };
    
    if (dto.endDate) {
      data.endDate = new Date(dto.endDate);
    }

    return this.prisma.insurancePolicy.update({
      where: { id },
      data,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async cancelPolicy(id: string, reason?: string) {
    return this.updatePolicy(id, {
      status: 'CANCELLED',
      notes: reason || 'Apólice cancelada',
    });
  }

  async renewPolicy(id: string, newEndDate: string) {
    return this.updatePolicy(id, {
      status: 'ACTIVE',
      endDate: newEndDate,
    });
  }

  // =====================
  // UTILITIES
  // =====================

  private async generateProtocolNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const lastQuote = await this.prisma.insuranceQuote.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    let nextNumber = 1;
    if (lastQuote?.protocolNumber) {
      const match = lastQuote.protocolNumber.match(/SEG-\d{4}-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    return `SEG-${year}-${String(nextNumber).padStart(5, '0')}`;
  }

  private async generatePolicyNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const lastPolicy = await this.prisma.insurancePolicy.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    let nextNumber = 1;
    if (lastPolicy?.policyNumber) {
      const match = lastPolicy.policyNumber.match(/POL-\d{4}-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    return `POL-${year}-${String(nextNumber).padStart(5, '0')}`;
  }

  // Legacy method for backward compatibility
  async create(data: any) {
    return this.createQuote(data);
  }
}
EOFSERVICE

echo "✅ InsuranceService updated!"
cat src/insurance/insurance.service.ts | grep -E "async (create|find|update|approve|cancel)" | head -20

