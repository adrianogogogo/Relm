import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInsurancePolicyDto } from './dto/create-insurance-policy.dto';
import { UpdateInsurancePolicyDto } from './dto/update-insurance-policy.dto';

@Injectable()
export class InsurancePoliciesService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateInsurancePolicyDto) {
    // Verificar se policy number já existe
    const existing = await this.prisma.insurancePolicy.findUnique({
      where: { policyNumber: createDto.policyNumber },
    });

    if (existing) {
      throw new BadRequestException('Policy number already exists');
    }

    return this.prisma.insurancePolicy.create({
      data: {
        policyNumber: createDto.policyNumber,
        quoteId: createDto.quoteId,
        customerId: createDto.customerId,
        productId: createDto.productId,
        insuranceCompany: createDto.insuranceCompany,
        policyValue: createDto.policyValue,
        coverageAmount: createDto.coverageAmount,
        deductible: createDto.deductible,
        startDate: new Date(createDto.startDate),
        endDate: new Date(createDto.endDate),
        status: createDto.status || 'ACTIVE',
        monthlyPayment: createDto.monthlyPayment,
        paymentDay: createDto.paymentDay,
        policyDocumentUrl: createDto.policyDocumentUrl,
        notes: createDto.notes,
      },
    });
  }

  async findAll(filters?: any) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters?.active) {
      where.status = 'ACTIVE';
      where.endDate = { gte: new Date() };
    }

    return this.prisma.insurancePolicy.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const policy = await this.prisma.insurancePolicy.findUnique({
      where: { id },
    });

    if (!policy) {
      throw new NotFoundException(`Insurance policy with ID ${id} not found`);
    }

    return policy;
  }

  async update(id: string, updateDto: UpdateInsurancePolicyDto) {
    await this.findOne(id); // Verifica se existe

    const data: any = {};
    if (updateDto.policyNumber) data.policyNumber = updateDto.policyNumber;
    if (updateDto.insuranceCompany) data.insuranceCompany = updateDto.insuranceCompany;
    if (updateDto.policyValue !== undefined) data.policyValue = updateDto.policyValue;
    if (updateDto.coverageAmount !== undefined) data.coverageAmount = updateDto.coverageAmount;
    if (updateDto.deductible !== undefined) data.deductible = updateDto.deductible;
    if (updateDto.startDate) data.startDate = new Date(updateDto.startDate);
    if (updateDto.endDate) data.endDate = new Date(updateDto.endDate);
    if (updateDto.status) data.status = updateDto.status;
    if (updateDto.monthlyPayment !== undefined) data.monthlyPayment = updateDto.monthlyPayment;
    if (updateDto.paymentDay !== undefined) data.paymentDay = updateDto.paymentDay;
    if (updateDto.policyDocumentUrl) data.policyDocumentUrl = updateDto.policyDocumentUrl;
    if (updateDto.notes !== undefined) data.notes = updateDto.notes;

    return this.prisma.insurancePolicy.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Verifica se existe

    return this.prisma.insurancePolicy.delete({
      where: { id },
    });
  }

  async getStatistics() {
    const totalPolicies = await this.prisma.insurancePolicy.count();
    const activePolicies = await this.prisma.insurancePolicy.count({
      where: {
        status: 'ACTIVE',
        endDate: { gte: new Date() },
      },
    });
    const expiringSoon = await this.prisma.insurancePolicy.count({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        },
      },
    });

    const policiesByStatus = await this.prisma.insurancePolicy.groupBy({
      by: ['status'],
      _count: true,
    });

    return {
      totalPolicies,
      activePolicies,
      expiringSoon,
      policiesByStatus,
    };
  }
}
