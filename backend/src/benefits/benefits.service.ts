import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBenefitDto } from './dto/create-benefit.dto';
import { UpdateBenefitDto } from './dto/update-benefit.dto';
import { BenefitCategory } from '@prisma/client';

@Injectable()
export class BenefitsService {
  constructor(private prisma: PrismaService) {}

  async create(createBenefitDto: CreateBenefitDto) {
    return this.prisma.benefit.create({
      data: createBenefitDto,
    });
  }

  async findAll(filters?: {
    category?: BenefitCategory;
    active?: boolean;
    featured?: boolean;
  }) {
    return this.prisma.benefit.findMany({
      where: filters,
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      include: {
        _count: {
          select: { redemptions: true },
        },
      },
    });
  }

  async findActive() {
    const now = new Date();
    return this.prisma.benefit.findMany({
      where: {
        active: true,
        validFrom: { lte: now },
        validUntil: { gte: now },
      },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      include: {
        _count: {
          select: { redemptions: true },
        },
      },
    });
  }

  async findFeatured() {
    const now = new Date();
    return this.prisma.benefit.findMany({
      where: {
        active: true,
        featured: true,
        validFrom: { lte: now },
        validUntil: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });
  }

  async findOne(id: string) {
    const benefit = await this.prisma.benefit.findUnique({
      where: { id },
      include: {
        _count: {
          select: { redemptions: true },
        },
        redemptions: {
          take: 10,
          orderBy: { redeemedAt: 'desc' },
          include: {
            membership: {
              include: {
                customer: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!benefit) {
      throw new NotFoundException(`Benefit with ID ${id} not found`);
    }

    return benefit;
  }

  async update(id: string, updateBenefitDto: UpdateBenefitDto) {
    await this.findOne(id);

    return this.prisma.benefit.update({
      where: { id },
      data: updateBenefitDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.benefit.delete({
      where: { id },
    });
  }

  async getStatistics() {
    const [total, active, featured, totalRedemptions] = await Promise.all([
      this.prisma.benefit.count(),
      this.prisma.benefit.count({ where: { active: true } }),
      this.prisma.benefit.count({ where: { featured: true } }),
      this.prisma.benefitRedemption.count(),
    ]);

    const byCategory = await this.prisma.benefit.groupBy({
      by: ['category'],
      _count: true,
    });

    return {
      total,
      active,
      featured,
      totalRedemptions,
      byCategory,
    };
  }
}
