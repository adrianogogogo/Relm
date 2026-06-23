import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // Catálogo: criação manual pelo admin/gerente (alimenta os dropdowns da garantia).
  async create(dto: CreateProductDto) {
    const exists = await this.prisma.product.findUnique({
      where: { serialNumber: dto.serialNumber },
    });
    if (exists) {
      throw new ConflictException('Já existe um produto com este número de série');
    }
    return this.prisma.product.create({
      data: {
        serialNumber: dto.serialNumber,
        model: dto.model,
        productType: dto.productType,
        brand: dto.brand || 'Relm Bikes',
        ...(dto.storeId && { storeId: dto.storeId }),
      },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }
    // serialNumber é imutável — não atualizado aqui.
    return this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.model !== undefined && { model: dto.model }),
        ...(dto.productType !== undefined && { productType: dto.productType }),
        ...(dto.brand !== undefined && { brand: dto.brand }),
        ...(dto.storeId !== undefined && { storeId: dto.storeId || null }),
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
  async findAllPublic() {
    return this.prisma.product.findMany({
      orderBy: { model: 'asc' },
      select: {
        id: true,
        serialNumber: true,
        brand: true,
        model: true,
        productType: true,
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
