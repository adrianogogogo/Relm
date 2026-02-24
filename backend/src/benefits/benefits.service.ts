import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBenefitDto } from './dto/create-benefit.dto';
import { UpdateBenefitDto } from './dto/update-benefit.dto';

@Injectable()
export class BenefitsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateBenefitDto) {
    return this.prisma.benefit.create({
      data: {
        title: createDto.title,
        description: createDto.description,
        terms: createDto.terms,
        validFrom: new Date(createDto.validFrom),
        validUntil: new Date(createDto.validUntil),
        targetRole: createDto.targetRole,
        active: true,
      },
    });
  }

  async findAll(filters?: any) {
    const where: any = {};

    if (filters?.active !== undefined) {
      where.active = filters.active;
    }

    if (filters?.targetRole) {
      where.targetRole = filters.targetRole;
    }

    return this.prisma.benefit.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const benefit = await this.prisma.benefit.findUnique({
      where: { id },
      include: {
        _count: {
          select: { redemptions: true },
        },
      },
    });

    if (!benefit) {
      throw new NotFoundException(`Benefit with ID ${id} not found`);
    }

    return benefit;
  }

  async update(id: string, updateDto: UpdateBenefitDto) {
    await this.findOne(id); // Verifica se existe

    const data: any = {};
    if (updateDto.title) data.title = updateDto.title;
    if (updateDto.description) data.description = updateDto.description;
    if (updateDto.terms !== undefined) data.terms = updateDto.terms;
    if (updateDto.validFrom) data.validFrom = new Date(updateDto.validFrom);
    if (updateDto.validUntil) data.validUntil = new Date(updateDto.validUntil);
    if (updateDto.targetRole !== undefined) data.targetRole = updateDto.targetRole;
    if (updateDto.active !== undefined) data.active = updateDto.active;

    return this.prisma.benefit.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Verifica se existe

    return this.prisma.benefit.delete({
      where: { id },
    });
  }

  async getStatistics() {
    const totalBenefits = await this.prisma.benefit.count();
    const activeBenefits = await this.prisma.benefit.count({
      where: { active: true },
    });
    const totalRedemptions = await this.prisma.benefitRedemption.count();

    return {
      totalBenefits,
      activeBenefits,
      totalRedemptions,
    };
  }
}
