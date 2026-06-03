import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async upsertBySerial(data: any) {
    return this.prisma.product.upsert({
      where: { serialNumber: data.serialNumber },
      update: data,
      create: data,
    });
  }

  async findAll(filters?: any) {
    return this.prisma.product.findMany({
      where: filters,
      include: { store: true },
    });
  }

  async findOne(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: { store: true },
    });
  }
}
