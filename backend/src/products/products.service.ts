import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // Catálogo por modelo: criação manual pelo admin/gerente. Sem número de série
  // (a série é da unidade do cliente, coletada na garantia).
  async create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        name: dto.name,
        brand: dto.brand || 'Relm Bikes',
        ...(dto.sku && { sku: dto.sku }),
        ...(dto.model && { model: dto.model }),
        ...(dto.year !== undefined && { year: dto.year }),
        ...(dto.description && { description: dto.description }),
        ...(dto.storeId && { storeId: dto.storeId }),
        ...(dto.price !== undefined && { price: dto.price }),
      },
    });
  }

  // Importação em lote (planilha). Cria todos de uma vez; retorna a contagem.
  async createMany(rows: CreateProductDto[]) {
    const data = rows.map((r) => ({
      name: r.name,
      brand: r.brand || 'Relm Bikes',
      ...(r.sku && { sku: r.sku }),
      ...(r.model && { model: r.model }),
      ...(r.year !== undefined && { year: r.year }),
      ...(r.description && { description: r.description }),
      ...(r.price !== undefined && { price: r.price }),
    }));
    const result = await this.prisma.product.createMany({ data });
    return { created: result.count };
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }
    return this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.brand !== undefined && { brand: dto.brand }),
        ...(dto.sku !== undefined && { sku: dto.sku || null }),
        ...(dto.model !== undefined && { model: dto.model || null }),
        ...(dto.year !== undefined && { year: dto.year }),
        ...(dto.description !== undefined && { description: dto.description || null }),
        ...(dto.storeId !== undefined && { storeId: dto.storeId || null }),
        ...(dto.price !== undefined && { price: dto.price }),
      },
    });
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }
    const claims = await this.prisma.warrantyClaim.count({ where: { productId: id } });
    if (claims > 0) {
      throw new BadRequestException(
        'Produto vinculado a garantias não pode ser removido',
      );
    }
    await this.prisma.product.delete({ where: { id } });
    return { message: 'Produto removido.' };
  }

  // Lista enxuta para preencher dropdowns no formulário público de garantia.
  // Só itens do catálogo (sem série = cadastrados por modelo).
  async findAllPublic() {
    return this.prisma.product.findMany({
      where: { serialNumber: null },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        brand: true,
        model: true,
        productType: true,
        year: true,
        price: true,
      },
    });
  }

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
