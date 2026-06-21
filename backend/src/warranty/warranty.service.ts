import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WarrantyStatus } from '@prisma/client';
import { CustomersService } from '../customers/customers.service';
import { CreateWarrantyPublicDto } from './dto/create-warranty-public.dto';
import { ProductsService } from '../products/products.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
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
  private readonly logger = new Logger(WarrantyService.name);

  constructor(
    private prisma: PrismaService,
    private customersService: CustomersService,
    private productsService: ProductsService,
    private emailService: EmailService,
    private notificationsService: NotificationsService,
  ) {}

  async createFromPublic(data: CreateWarrantyPublicDto) {
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

    // Gera protocolo único.
    const protocolNumber = this.generateProtocolNumber();

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

    // Notificação best-effort: equipe Relm + loja vinculada (se houver storeId).
    // Nunca quebra o registro da garantia (helpers nunca lançam).
    const notifyPayload = {
      type: 'WARRANTY_NEW',
      title: 'Nova garantia registrada',
      message: `Protocolo ${claim.protocolNumber} — ${customer.fullName} (${product.model}).`,
      link: `/admin/warranties/${claim.id}`,
    };
    await this.notificationsService.notifyTeam(notifyPayload);
    if (claim.storeId) {
      await this.notificationsService.notifyStore(claim.storeId, notifyPayload);
    }

    return {
      protocol_number: claim.protocolNumber,
      status: claim.status,
      created_at: claim.createdAt,
    };
  }

  async findAll(filters: any) {
    const where: any = {
      ...(filters.status && { status: filters.status }),
      ...(filters.protocol_number && {
        protocolNumber: { contains: filters.protocol_number },
      }),
    };

    // Busca textual livre: protocolo, nome/email do cliente ou serial do produto.
    if (filters.search && String(filters.search).trim() !== '') {
      const search = String(filters.search).trim();
      where.OR = [
        { protocolNumber: { contains: search, mode: 'insensitive' } },
        { customer: { fullName: { contains: search, mode: 'insensitive' } } },
        { customer: { email: { contains: search, mode: 'insensitive' } } },
        { product: { serialNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.warrantyClaim.findMany({
      where,
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
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            cpf: true,
          },
        },
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

  // Gera número de protocolo único e resistente a concorrência.
  //
  // DECISÃO (SEC-01/BUG-01): trocamos a estratégia "último + 1" por um sufixo
  // aleatório via crypto.randomBytes. A abordagem sequencial sofria de race
  // condition (dois requests concorrentes liam o mesmo "último" e geravam
  // protocolos duplicados, violando o @unique) e de NaN (quando o parseInt do
  // sufixo falhava). Não há requisito de numeração sequencial legível, então o
  // random é mais simples e seguro. O ano é dinâmico (não mais hardcoded 2024)
  // e o campo protocolNumber é @unique no schema, garantindo a unicidade.
  private generateProtocolNumber(): string {
    const year = new Date().getFullYear();
    const suffix = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `GRT-${year}-${suffix}`;
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
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            cpf: true,
          },
        },
        product: true,
      },
    });

    if (!claim) {
      throw new NotFoundException('Garantia não encontrada');
    }

    // BUG-02 — FSM como fonte única de verdade. A checagem manual anterior
    // permitia aprovar direto de RECEBIDO, contornando a FSM (que só permite
    // RECEBIDO -> EM_ANALISE). Validamos a transição pela FSM_TRANSITIONS.
    const validTransitions = FSM_TRANSITIONS[claim.status] || [];
    if (!validTransitions.includes(WarrantyStatus.APROVADO)) {
      throw new BadRequestException(
        `Transição inválida de ${claim.status} para APROVADO`,
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
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            cpf: true,
          },
        },
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

    // Enviar email (não bloqueia a aprovação se falhar)
    try {
      if (this.emailService) {
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

        this.logger.log(
          `Email de aprovação enviado para garantia ${updated.protocolNumber}`,
        );
      } else {
        this.logger.warn('EmailService não disponível - email não enviado');
      }
    } catch (error) {
      this.logger.error(
        `Erro ao enviar email de aprovação da garantia ${updated.protocolNumber}: ${error.message}`,
      );
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
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            cpf: true,
          },
        },
        product: true,
      },
    });

    if (!claim) {
      throw new NotFoundException('Garantia não encontrada');
    }

    // BUG-02 — FSM como fonte única de verdade. A checagem manual anterior
    // permitia reprovar direto de RECEBIDO, contornando a FSM (que só permite
    // RECEBIDO -> EM_ANALISE). Validamos a transição pela FSM_TRANSITIONS.
    const validTransitions = FSM_TRANSITIONS[claim.status] || [];
    if (!validTransitions.includes(WarrantyStatus.REPROVADO)) {
      throw new BadRequestException(
        `Transição inválida de ${claim.status} para REPROVADO`,
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
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            cpf: true,
          },
        },
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

    // Enviar email (não bloqueia a rejeição se falhar)
    try {
      if (this.emailService) {
        await this.emailService.sendWarrantyRejectionEmail({
          to: updated.customer.email,
          customerName: updated.customer.fullName,
          protocolNumber: updated.protocolNumber,
          rejectionReason,
          productModel: updated.product.model,
        });
        this.logger.log(
          `Email de rejeição enviado para garantia ${updated.protocolNumber}`,
        );
      } else {
        this.logger.warn('EmailService não disponível - email não enviado');
      }
    } catch (error) {
      this.logger.error(
        `Erro ao enviar email de rejeição da garantia ${updated.protocolNumber}: ${error.message}`,
      );
      // Não falha a rejeição se o email não for enviado
    }

    return updated;
  }

  // Mascara um email: joao.silva@dominio.com -> j***@dominio.com
  private maskEmail(email?: string | null): string | null {
    if (!email) return null;
    const [local, domain] = email.split('@');
    if (!domain) return null;
    const visible = local.slice(0, 1);
    return `${visible}***@${domain}`;
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

    // BUG-04 — Validação única (idempotente).
    //
    // DECISÃO: NÃO apagamos o validationToken após o uso. A tela pública
    // (ValidateWarrantyPage.jsx) reconsulta o token a cada carregamento/recarga
    // e o cliente é instruído por e-mail a guardar o link como comprovante de
    // garantia. Apagar o token quebraria reimpressões e novas visitas legítimas.
    //
    // O que evitamos é a RE-VALIDAÇÃO: o carimbo `validatedAt` é gravado uma
    // única vez (na primeira validação bem-sucedida) e nunca é sobrescrito nas
    // consultas seguintes. Assim a "primeira validação" é imutável e o token
    // continua servindo apenas como consulta read-only do comprovante.
    const alreadyValidated = !!claim.validatedAt;
    if (!alreadyValidated) {
      await this.prisma.warrantyClaim.update({
        where: { id: claim.id },
        data: { validatedAt: new Date() },
      });
    }

    // Endpoint público sem autenticação: expor o mínimo do cliente.
    // Apenas o primeiro nome e o email mascarado; telefone não é exposto.
    const firstName = claim.customer.fullName?.split(' ')[0] ?? null;

    return {
      valid: true,
      alreadyValidated,
      warranty: {
        protocolNumber: claim.protocolNumber,
        status: claim.status,
        approvedAt: claim.approvedAt,
        validatedAt: claim.validatedAt || new Date(),
        customer: {
          firstName,
          email: this.maskEmail(claim.customer.email),
        },
        product: claim.product,
        store: claim.store,
      },
    };
  }
}
