import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PointsService } from '../points/points.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { QuerySalesDto } from './dto/query-sales.dto';

// Vigência derivada: data da venda + prazo em dias. Exportado para o teste.
export function computeWarrantyEnd(saleDate: Date, warrantyDays?: number | null): Date | null {
  if (warrantyDays == null) return null;
  return new Date(saleDate.getTime() + warrantyDays * 24 * 60 * 60 * 1000);
}

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    private prisma: PrismaService,
    private points: PointsService,
  ) {}

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

    const sale = await this.prisma.sale.create({
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

    // Crédito de pontos no registro da venda. Item ainda não curado (sem
    // productId) pontua pelo multiplicador do tier; quando a curadoria vincular
    // o produto, linkItemToProduct completa a diferença.
    //
    // Fora da transação e com o erro engolido de propósito: registrar a venda é
    // o caminho crítico do balcão e não pode falhar por causa de pontos. O
    // crédito é recuperável — syncSaleItemPoints só credita a diferença, então
    // re-executar corrige. ponytail: se o log virar ruído, vire fila.
    for (const item of sale.items) {
      try {
        await this.points.syncSaleItemPoints(
          sale.customerId,
          item.id,
          item,
          `Compra: ${item.commercialName}`,
        );
      } catch (err: any) {
        this.logger.error(
          `Falha ao creditar pontos do item ${item.id} (venda ${sale.id}): ${err.message}`,
        );
      }
    }

    return sale;
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
          store: { select: { id: true, tradeName: true } },
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

  // Fila de curadoria: itens cujo productId ainda não foi vinculado ao
  // catálogo pela equipe Relm. productId IS NULL já é o estado "pendente" —
  // não existe flag separada.
  async findPendingCuration(query: any) {
    const page = query?.page && query.page > 0 ? Number(query.page) : 1;
    const limit = query?.limit && query.limit > 0 ? Math.min(Number(query.limit), 100) : 20;

    const where = { productId: null };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.saleItem.findMany({
        where,
        include: {
          sale: {
            select: {
              id: true,
              saleDate: true,
              customer: { select: { id: true, fullName: true } },
              store: { select: { id: true, tradeName: true } },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.saleItem.count({ where }),
    ]);

    return {
      data, total, page, limit,
    };
  }

  // Vincula a descrição livre (commercialName) de um item de venda a um
  // produto do catálogo — é a curadoria feita pela equipe Relm.
  async linkItemToProduct(itemId: string, productId: string) {
    const item = await this.prisma.saleItem.findUnique({
      where: { id: itemId },
      include: { sale: { select: { customerId: true } } },
    });
    if (!item) {
      throw new NotFoundException('Item de venda não encontrado');
    }

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    const updated = await this.prisma.saleItem.update({
      where: { id: itemId },
      data: { productId },
    });

    // Agora que o produto é conhecido, a regra dele (ou a da categoria) pode
    // render mais que o multiplicador aplicado no registro da venda.
    // syncSaleItemPoints credita só a diferença e nunca estorna.
    await this.points.syncSaleItemPoints(
      item.sale.customerId,
      itemId,
      updated,
      `Curadoria de compra: ${item.commercialName}`,
    );

    return updated;
  }
}
