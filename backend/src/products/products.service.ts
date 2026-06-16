import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async upsertBySerial(data: any) {
    // BUG-05 — mapeamos campos conhecidos do model Product explicitamente em
    // vez de passar o objeto inteiro. Isso evita gravar campos extras/inesperados
    // e mantém serialNumber imutável: ele entra apenas no create (chave de
    // identidade), nunca no update.
    const { serialNumber } = data;

    // Campos mutáveis (sem serialNumber). undefined é ignorado pelo Prisma,
    // então no update não sobrescrevemos com nulo o que não veio.
    const mutableData = {
      brand: data.brand,
      productType: data.productType,
      model: data.model,
      purchaseDate: data.purchaseDate,
      purchaseInvoiceNumber: data.purchaseInvoiceNumber,
      purchaseStoreName: data.purchaseStoreName,
      storeId: data.storeId,
    };

    return this.prisma.product.upsert({
      where: { serialNumber },
      update: mutableData,
      create: { serialNumber, ...mutableData },
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
