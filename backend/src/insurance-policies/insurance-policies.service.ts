import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInsurancePolicyDto } from './dto/create-insurance-policy.dto';
import { UpdateInsurancePolicyDto } from './dto/update-insurance-policy.dto';
import { InsurancePolicyStatus } from '@prisma/client';

@Injectable()
export class InsurancePoliciesService {
  constructor(private prisma: PrismaService) {}

  async create(createInsurancePolicyDto: CreateInsurancePolicyDto) {
    return this.prisma.insurancePolicy.create({
      data: createInsurancePolicyDto,
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async findAll(filters?: {
    status?: InsurancePolicyStatus;
    customerId?: string;
  }) {
    return this.prisma.insurancePolicy.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        quote: true,
      },
    });
  }

  async findActive() {
    const now = new Date();
    return this.prisma.insurancePolicy.findMany({
      where: {
        status: InsurancePolicyStatus.ACTIVE,
        endDate: { gte: now },
      },
      orderBy: { endDate: 'asc' },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async findExpiringSoon(days: number = 30) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.prisma.insurancePolicy.findMany({
      where: {
        status: InsurancePolicyStatus.ACTIVE,
        endDate: {
          gte: now,
          lte: futureDate,
        },
      },
      orderBy: { endDate: 'asc' },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const policy = await this.prisma.insurancePolicy.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            cpf: true,
            address: true,
            city: true,
            state: true,
          },
        },
        quote: true,
      },
    });

    if (!policy) {
      throw new NotFoundException(`Insurance policy with ID ${id} not found`);
    }

    return policy;
  }

  async update(id: string, updateInsurancePolicyDto: UpdateInsurancePolicyDto) {
    await this.findOne(id);

    return this.prisma.insurancePolicy.update({
      where: { id },
      data: updateInsurancePolicyDto,
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.insurancePolicy.delete({
      where: { id },
    });
  }

  async updateStatus(id: string, status: InsurancePolicyStatus) {
    return this.update(id, { status });
  }

  async getStatistics() {
    const [total, active, suspended, cancelled, expired] = await Promise.all([
      this.prisma.insurancePolicy.count(),
      this.prisma.insurancePolicy.count({
        where: { status: InsurancePolicyStatus.ACTIVE },
      }),
      this.prisma.insurancePolicy.count({
        where: { status: InsurancePolicyStatus.SUSPENDED },
      }),
      this.prisma.insurancePolicy.count({
        where: { status: InsurancePolicyStatus.CANCELLED },
      }),
      this.prisma.insurancePolicy.count({
        where: { status: InsurancePolicyStatus.EXPIRED },
      }),
    ]);

    const expiringSoon = await this.findExpiringSoon(30);

    return {
      total,
      active,
      suspended,
      cancelled,
      expired,
      expiringSoon: expiringSoon.length,
    };
  }
}
