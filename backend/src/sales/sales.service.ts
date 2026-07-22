import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { QuerySalesDto } from './dto/query-sales.dto';

// Vigência derivada: data da venda + prazo em dias. Exportado para o teste.
export function computeWarrantyEnd(saleDate: Date, warrantyDays?: number | null): Date | null {
  if (warrantyDays == null) return null;
  return new Date(saleDate.getTime() + warrantyDays * 24 * 60 * 60 * 1000);
}

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSaleDto, userId?: string) {
    const user = userId ? await this.prisma.user.findUnique({ where: { id: userId } }) : null;

    // Resolução de loja: para usuário LOJA, a loja da venda é sempre a do
    // usuário, ignorando dto.storeId. Demais papéis usam dto.storeId (opcional).
    let storeId: string | undefined;
    if (user?.role === 'LOJA') {
      if (!user.storeId) {
        throw new BadRequestException('Usuário de loja sem loja vinculada.');
      }
      storeId = user.storeId;
    } else {
      storeId = dto.storeId;
    }

    const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    const saleDate = new Date(dto.saleDate);

    return this.prisma.sale.create({
      data: {
        customerId: dto.customerId,
        ...(storeId && { storeId }),
        ...(userId && { soldByUserId: userId }),
        saleDate,
        ...(dto.invoiceNumber !== undefined && { invoiceNumber: dto.invoiceNumber }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        items: {
          // warrantyEndsAt é derivado (saleDate + warrantyDays) e gravado aqui.
          // Quem criar um endpoint de edição de venda DEVE recalcular
          // warrantyEndsAt no mesmo update — não é mantido automaticamente.
          create: dto.items.map((item) => ({
            commercialName: item.commercialName,
            ...(item.productId !== undefined && { productId: item.productId }),
            ...(item.quantity !== undefined && { quantity: item.quantity }),
            ...(item.serialNumber !== undefined && { serialNumber: item.serialNumber }),
            ...(item.unitPrice !== undefined && { unitPrice: item.unitPrice }),
            ...(item.warrantyDays !== undefined && { warrantyDays: item.warrantyDays }),
            warrantyEndsAt: computeWarrantyEnd(saleDate, item.warrantyDays),
          })),
        },
      },
      include: { items: true },
    });
  }

  async findAll(query: QuerySalesDto, userId?: string) {
    const user = userId ? await this.prisma.user.findUnique({ where: { id: userId } }) : null;

    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;

    const where: any = {};
    if (query.customerId) where.customerId = query.customerId;
    if (query.storeId) where.storeId = query.storeId;
    if (query.serial) {
      where.items = { some: { serialNumber: { contains: query.serial, mode: 'insensitive' } } };
    }

    // Escopo por papel: loja só vê as próprias vendas. Sem storeId, a loja
    // não pode ver nada (senão storeId: null bateria com vendas sem loja).
    if (user?.role === 'LOJA') {
      if (!user.storeId) {
        throw new BadRequestException('Usuário de loja sem loja vinculada.');
      }
      where.storeId = user.storeId;
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.sale.findMany({
        where,
        include: {
          items: true,
          customer: { select: { id: true, fullName: true } },
        },
        orderBy: { saleDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.sale.count({ where }),
    ]);

    return {
      data, total, page, limit,
    };
  }

  async findOne(id: string, userId?: string) {
    const user = userId ? await this.prisma.user.findUnique({ where: { id: userId } }) : null;

    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        customer: true,
        store: true,
      },
    });

    if (!sale) {
      throw new NotFoundException('Venda não encontrada');
    }

    // Escopo por papel: loja não pode ver venda de outra loja. Não vazamos a
    // existência do registro — mesma NotFoundException do "não existe".
    // Loja sem storeId vinculado nunca pode enxergar nada (senão null === null
    // deixaria passar vendas sem loja).
    if (user?.role === 'LOJA') {
      if (!user.storeId) {
        throw new BadRequestException('Usuário de loja sem loja vinculada.');
      }
      if (sale.storeId !== user.storeId) {
        throw new NotFoundException('Venda não encontrada');
      }
    }

    return sale;
  }

  async attachInvoice(id: string, file: any, userId?: string) {
    // Reaproveita a checagem de escopo/existência de findOne.
    await this.findOne(id, userId);

    return this.prisma.sale.update({
      where: { id },
      data: {
        invoiceStoragePath: file.path,
        invoiceFileName: file.originalname,
        invoiceMimeType: file.mimetype,
      },
    });
  }
}
