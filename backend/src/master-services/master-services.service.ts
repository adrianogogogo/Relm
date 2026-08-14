import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateMasterServiceDto {
  name: string;
  description?: string;
  category?: string;
  defaultEstimatedMinutes?: number;
  defaultPrice?: number;
  defaultPointsCost?: number;
  defaultPlusRule?: any;
  defaultPlusPrice?: number;
  defaultPlusDiscountPercent?: number;
  active?: boolean;
}

export interface UpdateMasterServiceDto {
  name?: string;
  description?: string;
  category?: string;
  defaultEstimatedMinutes?: number;
  defaultPrice?: number;
  defaultPointsCost?: number;
  defaultPlusRule?: any;
  defaultPlusPrice?: number;
  defaultPlusDiscountPercent?: number;
  active?: boolean;
}

@Injectable()
export class MasterServicesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateMasterServiceDto) {
    return this.prisma.masterService.create({
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        defaultEstimatedMinutes: dto.defaultEstimatedMinutes ?? 60,
        defaultPrice: dto.defaultPrice != null ? dto.defaultPrice : null,
        defaultPointsCost: dto.defaultPointsCost != null ? dto.defaultPointsCost : null,
        defaultPlusRule: dto.defaultPlusRule || 'FREE',
        defaultPlusPrice: dto.defaultPlusPrice != null ? dto.defaultPlusPrice : null,
        defaultPlusDiscountPercent: dto.defaultPlusDiscountPercent != null ? dto.defaultPlusDiscountPercent : null,
        active: dto.active ?? true,
      },
    });
  }

  async findAll(onlyActive: boolean = false) {
    return this.prisma.masterService.findMany({
      where: onlyActive ? { active: true } : {},
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.masterService.findUnique({
      where: { id },
      include: {
        storeServices: {
          include: {
            store: {
              select: {
                id: true,
                tradeName: true,
                city: true,
                state: true,
              },
            },
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Serviço mestre não encontrado');
    }

    return service;
  }

  async update(id: string, dto: UpdateMasterServiceDto) {
    await this.findOne(id);

    return this.prisma.masterService.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.defaultEstimatedMinutes !== undefined && { defaultEstimatedMinutes: dto.defaultEstimatedMinutes }),
        ...(dto.defaultPrice !== undefined && { defaultPrice: dto.defaultPrice != null ? dto.defaultPrice : null }),
        ...(dto.defaultPointsCost !== undefined && { defaultPointsCost: dto.defaultPointsCost != null ? dto.defaultPointsCost : null }),
        ...(dto.defaultPlusRule !== undefined && { defaultPlusRule: dto.defaultPlusRule }),
        ...(dto.defaultPlusPrice !== undefined && { defaultPlusPrice: dto.defaultPlusPrice != null ? dto.defaultPlusPrice : null }),
        ...(dto.defaultPlusDiscountPercent !== undefined && { defaultPlusDiscountPercent: dto.defaultPlusDiscountPercent != null ? dto.defaultPlusDiscountPercent : null }),
        ...(dto.active !== undefined && { active: dto.active }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    // Soft delete desativando
    return this.prisma.masterService.update({
      where: { id },
      data: { active: false },
    });
  }
}
