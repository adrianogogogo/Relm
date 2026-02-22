import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WarrantyStatus } from '@prisma/client';
import { CustomersService } from '../customers/customers.service';
import { ProductsService } from '../products/products.service';
import { EmailService } from '../email/email.service';
import * as crypto from 'crypto';

const FSM_TRANSITIONS = {
  RECEBIDO: ['EM_ANALISE'],
  EM_ANALISE: ['AGUARDANDO_CLIENTE', 'APROVADO', 'REPROVADO'],
  AGUARDANDO_CLIENTE: ['EM_ANALISE'],
  APROVADO: ['FINALIZADO'],
  REPROVADO: ['FINALIZADO'],
  FINALIZADO: [],
  CANCELADO: [],
};

@Injectable()
export class WarrantyService {
  constructor(
    private prisma: PrismaService,
    private customersService: CustomersService,
    private productsService: ProductsService,
    private emailService: EmailService,
  ) {}

  async createFromPublic(data: any) {
    // Upsert customer
    const customerData = {
      email: data.email,
      fullName: data.full_name,
      phone: data.phone,
      cpf: data.cpf?.replace(/\D/g, ''),
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country || 'Brasil',
      zipCode: data.zip_code?.replace(/\D/g, ''),
      marketingConsent: data.marketing_consent || false,
    };

    const customer = await this.customersService.upsertByEmail(customerData);

    // Upsert product
    const productData = {
      serialNumber: data.serial_number,
      brand: data.brand || 'Relm Bikes',
      productType: data.product_type,
      model: data.model,
      purchaseDate: data.purchase_date ? new Date(data.purchase_date) : null,
      purchaseInvoiceNumber: data.invoice_number,
      purchaseStoreName: data.purchase_store_name,
    };

    const product = await this.productsService.upsertBySerial(productData);

    // Generate protocol
    const lastProtocol = await this.prisma.warrantyClaim.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { protocolNumber: true },
    });

    const lastNumber = lastProtocol
      ? parseInt(lastProtocol.protocolNumber.split('-').pop())
      : 0;
    const protocolNumber = `GRT-2024-${String(lastNumber + 1).padStart(5, '0')}`;

    // Create warranty claim
    const claim = await this.prisma.warrantyClaim.create({
      data: {
        protocolNumber,
        customerId: customer.id,
        productId: product.id,
        invoiceNumber: data.invoice_number,
        purchaseStoreName: data.purchase_store_name,
        purchaseStoreCity: data.city,
        purchaseStoreState: data.state,
        customerNotes: data.customer_notes,
        linkStatus: 'PENDING_REVIEW',
        status: WarrantyStatus.RECEBIDO,
      },
    });

    // Create event
    await this.prisma.warrantyEvent.create({
      data: {
        claimId: claim.id,
        eventType: 'CREATED',
        toStatus: 'RECEBIDO',
        comment: 'Garantia criada via formulário público',
      },
    });

    return {
      protocol_number: claim.protocolNumber,
      status: claim.status,
      created_at: claim.createdAt,
    };
  }

  async findAll(filters: any) {
    return this.prisma.warrantyClaim.findMany({
      where: {
        ...(filters.status && { status: filters.status }),
        ...(filters.protocol_number && {
          protocolNumber: { contains: filters.protocol_number },
        }),
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        product: {
          select: {
            id: true,
            serialNumber: true,
            model: true,
            brand: true,
          },
        },
        store: {
          select: {
            id: true,
            tradeName: true,
            city: true,
            state: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.warrantyClaim.findUnique({
      where: { id },
      include: {
        customer: true,
        product: true,
        store: true,
        events: {
          include: {
            createdBy: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async updateStatus(
    id: string,
    toStatus: WarrantyStatus,
    userId: string,
    data?: { comment?: string; rejection_reason?: string; resolution?: string },
  ) {
    const claim = await this.prisma.warrantyClaim.findUnique({
      where: { id },
    });

    if (!claim) {
      throw new BadRequestException('Garantia não encontrada');
    }

    // Validate FSM
    const validTransitions = FSM_TRANSITIONS[claim.status];
    if (!validTransitions.includes(toStatus)) {
      throw new BadRequestException(
        `Transição inválida de ${claim.status} para ${toStatus}`,
      );
    }

    // Validate required fields
    if (toStatus === 'AGUARDANDO_CLIENTE' && !data?.comment) {
      throw new BadRequestException('Comment obrigatório para AGUARDANDO_CLIENTE');
    }

    if (toStatus === 'REPROVADO' && (!data?.comment || !data?.rejection_reason)) {
      throw new BadRequestException('Comment e rejection_reason obrigatórios para REPROVADO');
    }

    if (toStatus === 'FINALIZADO' && !data?.resolution) {
      throw new BadRequestException('Resolution obrigatório para FINALIZADO');
    }

    // Update claim
    const updated = await this.prisma.warrantyClaim.update({
      where: { id },
      data: {
        status: toStatus,
        ...(data?.rejection_reason && { rejectionReason: data.rejection_reason }),
        ...(data?.resolution && { resolution: data.resolution }),
      },
    });

    // Create event
    await this.prisma.warrantyEvent.create({
      data: {
        claimId: id,
        eventType: 'STATUS_CHANGE',
        fromStatus: claim.status,
        toStatus,
        comment: data?.comment,
        createdByUserId: userId,
      },
    });

    return updated;
  }

  // Gerar token único para validação de garantia
  private generateValidationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Aprovar garantia e enviar email
  async approveWarranty(id: string, userId: string, adminNotes?: string) {
    const claim = await this.prisma.warrantyClaim.findUnique({
      where: { id },
      include: {
        customer: true,
        product: true,
      },
    });

    if (!claim) {
      throw new NotFoundException('Garantia não encontrada');
    }

    if (claim.status !== 'EM_ANALISE' && claim.status !== 'RECEBIDO') {
      throw new BadRequestException(
        `Não é possível aprovar garantia com status ${claim.status}`,
      );
    }

    // Gerar token de validação
    const validationToken = this.generateValidationToken();
    const now = new Date();

    // Atualizar claim
    const updated = await this.prisma.warrantyClaim.update({
      where: { id },
      data: {
        status: 'APROVADO',
        validationToken,
        tokenGeneratedAt: now,
        approvedAt: now,
        approvedByUserId: userId,
        adminNotes: adminNotes || claim.adminNotes,
      },
      include: {
        customer: true,
        product: true,
      },
    });

    // Criar evento
    await this.prisma.warrantyEvent.create({
      data: {
        claimId: id,
        eventType: 'APPROVED',
        fromStatus: claim.status,
        toStatus: 'APROVADO',
        comment: adminNotes || 'Garantia aprovada',
        createdByUserId: userId,
      },
    });

    // Enviar email
    try {
      await this.emailService.sendWarrantyApprovalEmail({
        to: updated.customer.email,
        customerName: updated.customer.fullName,
        protocolNumber: updated.protocolNumber,
        validationToken,
        productModel: updated.product.model,
        serialNumber: updated.product.serialNumber,
        approvedAt: now,
      });

      // Registrar envio do email
      await this.prisma.warrantyClaim.update({
        where: { id },
        data: { approvalEmailSentAt: now },
      });
    } catch (error) {
      console.error('Erro ao enviar email de aprovação:', error);
      // Não falha a aprovação se o email não for enviado
    }

    return updated;
  }

  // Rejeitar garantia e enviar email
  async rejectWarranty(
    id: string,
    userId: string,
    rejectionReason: string,
    adminNotes?: string,
  ) {
    const claim = await this.prisma.warrantyClaim.findUnique({
      where: { id },
      include: {
        customer: true,
        product: true,
      },
    });

    if (!claim) {
      throw new NotFoundException('Garantia não encontrada');
    }

    if (claim.status !== 'EM_ANALISE' && claim.status !== 'RECEBIDO') {
      throw new BadRequestException(
        `Não é possível rejeitar garantia com status ${claim.status}`,
      );
    }

    if (!rejectionReason || rejectionReason.trim() === '') {
      throw new BadRequestException('Motivo da rejeição é obrigatório');
    }

    // Atualizar claim
    const updated = await this.prisma.warrantyClaim.update({
      where: { id },
      data: {
        status: 'REPROVADO',
        rejectionReason,
        adminNotes: adminNotes || claim.adminNotes,
      },
      include: {
        customer: true,
        product: true,
      },
    });

    // Criar evento
    await this.prisma.warrantyEvent.create({
      data: {
        claimId: id,
        eventType: 'REJECTED',
        fromStatus: claim.status,
        toStatus: 'REPROVADO',
        comment: rejectionReason,
        createdByUserId: userId,
      },
    });

    // Enviar email
    try {
      await this.emailService.sendWarrantyRejectionEmail({
        to: updated.customer.email,
        customerName: updated.customer.fullName,
        protocolNumber: updated.protocolNumber,
        rejectionReason,
        productModel: updated.product.model,
      });
    } catch (error) {
      console.error('Erro ao enviar email de rejeição:', error);
      // Não falha a rejeição se o email não for enviado
    }

    return updated;
  }

  // Validar token de garantia (endpoint público)
  async validateWarrantyToken(token: string) {
    const claim = await this.prisma.warrantyClaim.findUnique({
      where: { validationToken: token },
      include: {
        customer: {
          select: {
            fullName: true,
            email: true,
            phone: true,
          },
        },
        product: {
          select: {
            model: true,
            serialNumber: true,
            brand: true,
          },
        },
        store: {
          select: {
            tradeName: true,
            city: true,
            state: true,
            phone: true,
          },
        },
      },
    });

    if (!claim) {
      throw new NotFoundException('Token de validação inválido');
    }

    if (claim.status !== 'APROVADO') {
      throw new BadRequestException('Esta garantia não está aprovada');
    }

    // Registrar validação (primeira vez)
    if (!claim.validatedAt) {
      await this.prisma.warrantyClaim.update({
        where: { id: claim.id },
        data: { validatedAt: new Date() },
      });
    }

    return {
      valid: true,
      warranty: {
        protocolNumber: claim.protocolNumber,
        status: claim.status,
        approvedAt: claim.approvedAt,
        validatedAt: claim.validatedAt || new Date(),
        customer: claim.customer,
        product: claim.product,
        store: claim.store,
      },
    };
  }
}
