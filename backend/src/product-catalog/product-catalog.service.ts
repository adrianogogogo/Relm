import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductCatalogDto } from './dto/create-product-catalog.dto';
import { UpdateProductCatalogDto } from './dto/update-product-catalog.dto';

@Injectable()
export class ProductCatalogService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateProductCatalogDto) {
    return this.prisma.productCatalog.create({
      data: createDto,
    });
  }

  async findAll(filters?: {
    category?: string;
    active?: boolean;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.active !== undefined) {
      where.active = filters.active;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { brand: { contains: filters.search, mode: 'insensitive' } },
        { model: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.productCatalog.findMany({
      where,
      orderBy: [
        { active: 'desc' },
        { name: 'asc' },
      ],
      include: {
        _count: {
          select: { customerProducts: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.productCatalog.findUnique({
      where: { id },
      include: {
        _count: {
          select: { customerProducts: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Produto ${id} não encontrado`);
    }

    return product;
  }

  async update(id: string, updateDto: UpdateProductCatalogDto) {
    await this.findOne(id); // Verifica se existe

    return this.prisma.productCatalog.update({
      where: { id },
      data: {
        ...updateDto,
        updatedAt: new Date(),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Verifica se existe

    // Verifica se tem produtos registrados
    const count = await this.prisma.customerProduct.count({
      where: { productCatalogId: id },
    });

    if (count > 0) {
      throw new Error(
        `Não é possível deletar este produto. Existem ${count} produtos registrados usando este catálogo.`,
      );
    }

    return this.prisma.productCatalog.delete({
      where: { id },
    });
  }

  async getStatistics() {
    const total = await this.prisma.productCatalog.count();
    const active = await this.prisma.productCatalog.count({
      where: { active: true },
    });
    const bicycles = await this.prisma.productCatalog.count({
      where: { category: 'BICYCLE' },
    });
    const accessories = await this.prisma.productCatalog.count({
      where: { category: 'ACCESSORY' },
    });
    const withStandardWarranty = await this.prisma.productCatalog.count({
      where: { hasStandardWarranty: true },
    });
    const withExtendedWarranty = await this.prisma.productCatalog.count({
      where: { canExtendWarranty: true },
    });

    return {
      total,
      active,
      inactive: total - active,
      byCategory: {
        bicycles,
        accessories,
      },
      warranties: {
        withStandardWarranty,
        withExtendedWarranty,
      },
    };
  }
}
