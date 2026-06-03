import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BenefitsService {
  constructor(private prisma: PrismaService) {}

  async findAllPublic() {
    return this.prisma.benefit.findMany({
      where: { active: true, validUntil: { gte: new Date() } },
      orderBy: { validFrom: 'asc' },
    });
  }

  async findAllAdmin() {
    return this.prisma.benefit.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const benefit = await this.prisma.benefit.findUnique({ where: { id } });
    if (!benefit) throw new NotFoundException('Benefício não encontrado');
    return benefit;
  }

  async create(data: {
    title: string;
    description: string;
    terms?: string;
    validFrom: string;
    validUntil: string;
    targetRole?: string;
  }) {
    return this.prisma.benefit.create({
      data: {
        title: data.title,
        description: data.description,
        terms: data.terms,
        validFrom: new Date(data.validFrom),
        validUntil: new Date(data.validUntil),
        targetRole: data.targetRole ?? null,
      },
    });
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      terms?: string;
      validFrom?: string;
      validUntil?: string;
      targetRole?: string;
      active?: boolean;
    },
  ) {
    await this.findOne(id);
    return this.prisma.benefit.update({
      where: { id },
      data: {
        ...data,
        ...(data.validFrom && { validFrom: new Date(data.validFrom) }),
        ...(data.validUntil && { validUntil: new Date(data.validUntil) }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.benefit.update({ where: { id }, data: { active: false } });
  }
}
