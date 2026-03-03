import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerProductDto } from './dto/create-customer-product.dto';
import { UpdateCustomerProductDto } from './dto/update-customer-product.dto';
import { ApproveProductDto } from './dto/approve-product.dto';
import { RejectProductDto } from './dto/reject-product.dto';
import { TransferProductDto } from './dto/transfer-product.dto';

@Injectable()
export class CustomerProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateCustomerProductDto) {
    // Validar que tem serial OU nota fiscal
    if (!createDto.serialNumber && !createDto.invoiceUrl) {
      throw new BadRequestException(
        'É necessário informar o número de série OU fazer upload da nota fiscal',
      );
    }

    // Se tem product_catalog_id, buscar info do catálogo
    let clubPointsBase = 0;
    if (createDto.productCatalogId) {
      const catalog = await this.prisma.productCatalog.findUnique({
        where: { id: createDto.productCatalogId },
      });
      if (catalog) {
        clubPointsBase = catalog.clubPointsBase || 0;
      }
    }

    return this.prisma.customerProduct.create({
      data: {
        ...createDto,
        verificationStatus: 'PENDING',
        clubPoints: clubPointsBase,
      },
      include: {
        productCatalog: true,
      },
    });
  }

  async findAll(filters?: {
    customerId?: string;
    verificationStatus?: string;
    status?: string;
    category?: string;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters?.verificationStatus) {
      where.verificationStatus = filters.verificationStatus;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.category && filters.category !== 'ALL') {
      where.productCatalog = {
        category: filters.category,
      };
    }

    if (filters?.search) {
      where.OR = [
        { serialNumber: { contains: filters.search, mode: 'insensitive' } },
        { customName: { contains: filters.search, mode: 'insensitive' } },
        { invoiceNumber: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.customerProduct.findMany({
      where,
      orderBy: [
        { registrationDate: 'desc' },
      ],
      include: {
        productCatalog: true,
        _count: {
          select: {
            extendedWarranties: true,
            warrantyClaims: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.customerProduct.findUnique({
      where: { id },
      include: {
        productCatalog: true,
        extendedWarranties: {
          where: { status: 'ACTIVE' },
        },
        warrantyClaims: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        productHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Produto ${id} não encontrado`);
    }

    return product;
  }

  async update(id: string, updateDto: UpdateCustomerProductDto) {
    await this.findOne(id);

    return this.prisma.customerProduct.update({
      where: { id },
      data: {
        ...updateDto,
        updatedAt: new Date(),
      },
      include: {
        productCatalog: true,
      },
    });
  }

  async approve(id: string, approveDto: ApproveProductDto, userId: string) {
    const product = await this.findOne(id);

    if (product.verificationStatus !== 'PENDING') {
      throw new BadRequestException('Produto já foi aprovado/rejeitado anteriormente');
    }

    // Atualizar produto
    const updated = await this.prisma.customerProduct.update({
      where: { id },
      data: {
        verificationStatus: 'APPROVED',
        verifiedAt: new Date(),
        verifiedByUserId: userId,
        clubMemberSince: new Date(), // Ativa clube
        adminNotes: approveDto.adminNotes,
        updatedAt: new Date(),
      },
      include: {
        productCatalog: true,
      },
    });

    // Registrar no histórico
    await this.prisma.productHistory.create({
      data: {
        customerProductId: id,
        eventType: 'APPROVED',
        fromValue: 'PENDING',
        toValue: 'APPROVED',
        description: 'Produto aprovado pelo admin',
        performedByUserId: userId,
        notes: approveDto.adminNotes,
      },
    });

    return updated;
  }

  async reject(id: string, rejectDto: RejectProductDto, userId: string) {
    const product = await this.findOne(id);

    if (product.verificationStatus !== 'PENDING') {
      throw new BadRequestException('Produto já foi aprovado/rejeitado anteriormente');
    }

    const updated = await this.prisma.customerProduct.update({
      where: { id },
      data: {
        verificationStatus: 'REJECTED',
        verifiedAt: new Date(),
        verifiedByUserId: userId,
        rejectionReason: rejectDto.rejectionReason,
        adminNotes: rejectDto.adminNotes,
        status: 'INACTIVE',
        updatedAt: new Date(),
      },
    });

    // Registrar no histórico
    await this.prisma.productHistory.create({
      data: {
        customerProductId: id,
        eventType: 'REJECTED',
        fromValue: 'PENDING',
        toValue: 'REJECTED',
        description: `Produto rejeitado: ${rejectDto.rejectionReason}`,
        performedByUserId: userId,
        notes: rejectDto.adminNotes,
      },
    });

    return updated;
  }

  async activateStandardWarranty(id: string, customerId: string) {
    const product = await this.findOne(id);

    // Verificações
    if (product.customerId !== customerId) {
      throw new BadRequestException('Este produto não pertence a você');
    }

    if (product.verificationStatus !== 'APPROVED') {
      throw new BadRequestException('Produto ainda não foi aprovado');
    }

    if (product.standardWarrantyActivated) {
      throw new BadRequestException('Garantia padrão já foi ativada');
    }

    if (!product.productCatalog?.hasStandardWarranty) {
      throw new BadRequestException('Este produto não possui garantia padrão disponível');
    }

    // Calcular data de expiração
    const months = product.productCatalog.standardWarrantyMonths || 12;
    const expiresAt = new Date(product.purchaseDate || new Date());
    expiresAt.setMonth(expiresAt.getMonth() + months);

    // Ativar
    const updated = await this.prisma.customerProduct.update({
      where: { id },
      data: {
        standardWarrantyActivated: true,
        standardWarrantyActivatedAt: new Date(),
        standardWarrantyExpiresAt: expiresAt,
        updatedAt: new Date(),
      },
    });

    // Registrar no histórico
    await this.prisma.productHistory.create({
      data: {
        customerProductId: id,
        eventType: 'WARRANTY_ACTIVATED',
        description: `Garantia padrão ativada (${months} meses)`,
        performedByCustomerId: customerId,
      },
    });

    return updated;
  }

  async transfer(id: string, transferDto: TransferProductDto, currentCustomerId: string) {
    const product = await this.findOne(id);

    if (product.customerId !== currentCustomerId) {
      throw new BadRequestException('Este produto não pertence a você');
    }

    // Buscar novo dono pelo email
    const newOwner = await this.prisma.customer.findUnique({
      where: { email: transferDto.newOwnerEmail },
    });

    if (!newOwner) {
      throw new NotFoundException('Cliente com este email não encontrado');
    }

    if (newOwner.id === currentCustomerId) {
      throw new BadRequestException('Você não pode transferir para si mesmo');
    }

    // Transferir
    const updated = await this.prisma.customerProduct.update({
      where: { id },
      data: {
        customerId: newOwner.id,
        transferredToCustomerId: newOwner.id,
        transferredAt: new Date(),
        transferNotes: transferDto.transferNotes,
        updatedAt: new Date(),
      },
    });

    // Registrar no histórico
    await this.prisma.productHistory.create({
      data: {
        customerProductId: id,
        eventType: 'TRANSFERRED',
        description: 'Produto transferido para novo dono',
        fromCustomerId: currentCustomerId,
        toCustomerId: newOwner.id,
        performedByCustomerId: currentCustomerId,
        notes: transferDto.transferNotes,
      },
    });

    return updated;
  }

  async getHistory(id: string) {
    await this.findOne(id);

    return this.prisma.productHistory.findMany({
      where: { customerProductId: id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStatistics() {
    const total = await this.prisma.customerProduct.count();
    const pending = await this.prisma.customerProduct.count({
      where: { verificationStatus: 'PENDING' },
    });
    const approved = await this.prisma.customerProduct.count({
      where: { verificationStatus: 'APPROVED' },
    });
    const rejected = await this.prisma.customerProduct.count({
      where: { verificationStatus: 'REJECTED' },
    });
    const withStandardWarranty = await this.prisma.customerProduct.count({
      where: { standardWarrantyActivated: true },
    });
    const withExtendedWarranty = await this.prisma.customerProduct.count({
      where: {
        extendedWarranties: {
          some: { status: 'ACTIVE' },
        },
      },
    });

    return {
      total,
      byVerificationStatus: {
        pending,
        approved,
        rejected,
      },
      warranties: {
        withStandardWarranty,
        withExtendedWarranty,
      },
    };
  }
}
