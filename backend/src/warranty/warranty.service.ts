import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WarrantyStatus, UserRole } from '@prisma/client';
import { CustomersService } from '../customers/customers.service';
import { CreateWarrantyPublicDto } from './dto/create-warranty-public.dto';
import { CreateWarrantyAdminDto } from './dto/create-warranty-admin.dto';
import { ProductsService } from '../products/products.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import * as crypto from 'crypto';
import * as fs from 'fs';

const FSM_TRANSITIONS = {
  RECEBIDO: ['EM_ANALISE'],
  EM_ANALISE: ['AGUARDANDO_CLIENTE', 'APROVADO', 'REPROVADO'],
  AGUARDANDO_CLIENTE: ['EM_ANALISE'],
  APROVADO: ['FINALIZADO'],
  REPROVADO: ['FINALIZADO'],
  FINALIZADO: [],
  CANCELADO: [],
};

// Fechamento automático (Onda 4): ao entrar num status resolvido, agenda a data
// de fechamento. ponytail: só ARMAZENA/EXIBE a data — um cron que de fato muda o
// status é o upgrade path (não há scheduler hoje).
const RESOLVED_STATUSES = ['APROVADO', 'REPROVADO', 'FINALIZADO'];
const AUTO_CLOSE_DAYS = 20;
function autoClosePatch(toStatus: string) {
  return RESOLVED_STATUSES.includes(toStatus)
    ? { autoCloseAt: new Date(Date.now() + AUTO_CLOSE_DAYS * 24 * 60 * 60 * 1000) }
    : {};
}

@Injectable()
export class WarrantyService {
  private readonly logger = new Logger(WarrantyService.name);

  constructor(
    private prisma: PrismaService,
    private customersService: CustomersService,
    private productsService: ProductsService,
    private emailService: EmailService,
    private notificationsService: NotificationsService,
    private auditLogsService: AuditLogsService,
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
      link: `/admin/warranties?claim=${claim.id}`,
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

  /**
   * Cadastro de garantia pelo painel administrativo (ADMIN_RELM/GERENTE_RELM).
   *
   * Diferenças em relação ao createFromPublic:
   *  - O cliente JÁ EXISTE e é vinculado por customerId (sem upsert por email).
   *  - Como é um cadastro confiável feito pela equipe, o linkStatus já entra
   *    como CONFIRMED (o enum LinkStatus não possui VERIFIED; CONFIRMED é o
   *    valor que representa vínculo validado).
   *  - Mantém o mesmo status inicial RECEBIDO e a mesma FSM/eventos/notificações.
   */
  async createByAdmin(dto: CreateWarrantyAdminDto, adminUserId?: string) {
    // 1) Valida que o cliente existe.
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    // 2) Se informada, valida a loja vinculada.
    if (dto.storeId) {
      const store = await this.prisma.store.findUnique({
        where: { id: dto.storeId },
      });
      if (!store) {
        throw new NotFoundException('Loja não encontrada');
      }
    }

    // 3) Upsert do produto por serial.
    const product = await this.productsService.upsertBySerial({
      serialNumber: dto.serialNumber,
      brand: dto.brand || 'Relm Bikes',
      productType: dto.productType,
      model: dto.model,
      purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
      purchaseInvoiceNumber: dto.invoiceNumber,
      purchaseStoreName: dto.purchaseStoreName,
      storeId: dto.storeId,
    });

    // 4) Protocolo único.
    const protocolNumber = this.generateProtocolNumber();

    // 5) Cria o claim vinculado ao cliente existente (linkStatus CONFIRMED).
    const claim = await this.prisma.warrantyClaim.create({
      data: {
        protocolNumber,
        customerId: customer.id,
        productId: product.id,
        ...(dto.storeId && { storeId: dto.storeId }),
        invoiceNumber: dto.invoiceNumber,
        purchaseStoreName: dto.purchaseStoreName,
        purchaseStoreCity: dto.purchaseStoreCity,
        purchaseStoreState: dto.purchaseStoreState,
        customerNotes: dto.customerNotes,
        adminNotes: dto.adminNotes,
        linkStatus: 'CONFIRMED',
        status: WarrantyStatus.RECEBIDO,
      },
    });

    // 6) Evento de criação.
    await this.prisma.warrantyEvent.create({
      data: {
        claimId: claim.id,
        eventType: 'CREATED',
        toStatus: 'RECEBIDO',
        comment: 'Garantia cadastrada pelo painel administrativo',
        ...(adminUserId && { createdByUserId: adminUserId }),
      },
    });

    // 7) Notificação best-effort (equipe + loja, se houver). Nunca quebra.
    const notifyPayload = {
      type: 'WARRANTY_NEW',
      title: 'Nova garantia registrada',
      message: `Protocolo ${claim.protocolNumber} — ${customer.fullName} (${product.model}).`,
      link: `/admin/warranties?claim=${claim.id}`,
    };
    await this.notificationsService.notifyTeam(notifyPayload);
    if (claim.storeId) {
      await this.notificationsService.notifyStore(claim.storeId, notifyPayload);
    }

    return {
      id: claim.id,
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
        tasks: {
          orderBy: { createdAt: 'asc' },
        },
        attachments: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, fileName: true, mimeType: true, size: true, createdAt: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  // ── Responsável + atribuição (Onda 4) ───────────────────────────────────────

  // Usuários da equipe Relm que podem ser responsáveis por uma garantia.
  async listAssignableUsers() {
    return this.prisma.user.findMany({
      where: {
        active: true,
        role: { in: ['ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM'] },
      },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    });
  }

  // Define ou remove (userId null/vazio) o responsável atual da garantia.
  async assignClaim(id: string, userId: string | null | undefined, adminUserId?: string) {
    const claim = await this.prisma.warrantyClaim.findUnique({ where: { id } });
    if (!claim) {
      throw new NotFoundException('Garantia não encontrada');
    }

    const targetId = userId || null;
    if (targetId) {
      const user = await this.prisma.user.findUnique({ where: { id: targetId } });
      if (!user || !user.active) {
        throw new BadRequestException('Usuário responsável inválido');
      }
    }

    const updated = await this.prisma.warrantyClaim.update({
      where: { id },
      data: { assignedToUserId: targetId },
      include: { assignedTo: { select: { id: true, name: true, email: true } } },
    });

    // Histórico best-effort (não bloqueia).
    try {
      await this.prisma.warrantyEvent.create({
        data: {
          claimId: id,
          eventType: 'ASSIGNED',
          comment: targetId
            ? `Responsável definido: ${updated.assignedTo?.name ?? targetId}`
            : 'Responsável removido',
          ...(adminUserId && { createdByUserId: adminUserId }),
        },
      });
    } catch (error) {
      this.logger.error(`Erro ao registrar evento de atribuição ${id}: ${error.message}`);
    }

    return updated;
  }

  // ── Tarefas da garantia (Onda 2) ────────────────────────────────────────────

  async createTask(
    claimId: string,
    data: { title: string; assignee?: string; assigneeRole?: string; dueDate?: string; status?: string },
    userId?: string,
  ) {
    const claim = await this.prisma.warrantyClaim.findUnique({ where: { id: claimId } });
    if (!claim) {
      throw new NotFoundException('Garantia não encontrada');
    }
    const task = await this.prisma.warrantyTask.create({
      data: {
        claimId,
        title: data.title,
        // Tarefa manual herda a etapa (status) atual da garantia.
        stage: claim.status as string,
        ...(data.assignee && { assignee: data.assignee }),
        ...(data.assigneeRole && { assigneeRole: data.assigneeRole }),
        ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
        ...(data.status && { status: data.status }),
        ...(userId && { createdByUserId: userId }),
      },
    });

    try {
      await this.prisma.warrantyEvent.create({
        data: {
          claimId,
          eventType: 'TASK_CREATED',
          comment: `Tarefa criada: "${task.title}"`,
          ...(userId && { createdByUserId: userId }),
        },
      });
    } catch (error) {
      this.logger.error(`Erro ao criar evento de histórico para createTask: ${error.message}`);
    }

    return task;
  }

  async updateTask(
    taskId: string,
    data: { title?: string; status?: string; assignee?: string; dueDate?: string },
    userId?: string,
  ) {
    const task = await this.prisma.warrantyTask.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }
    const updated = await this.prisma.warrantyTask.update({
      where: { id: taskId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.assignee !== undefined && { assignee: data.assignee }),
        ...(data.dueDate !== undefined && {
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        }),
      },
    });

    try {
      let comment = `Tarefa atualizada: "${updated.title}"`;
      if (data.status !== undefined && data.status !== task.status) {
        if (updated.status === 'concluida') {
          comment = `Tarefa concluída: "${updated.title}"`;
        } else if (updated.status === 'pendente') {
          comment = `Tarefa reaberta: "${updated.title}"`;
        }
      }
      await this.prisma.warrantyEvent.create({
        data: {
          claimId: updated.claimId,
          eventType: 'TASK_UPDATED',
          comment,
          ...(userId && { createdByUserId: userId }),
        },
      });
    } catch (error) {
      this.logger.error(`Erro ao criar evento de histórico para updateTask: ${error.message}`);
    }

    return updated;
  }

  async deleteTask(taskId: string, userId?: string) {
    const task = await this.prisma.warrantyTask.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }
    await this.prisma.warrantyTask.delete({ where: { id: taskId } });

    try {
      await this.prisma.warrantyEvent.create({
        data: {
          claimId: task.claimId,
          eventType: 'TASK_DELETED',
          comment: `Tarefa excluída: "${task.title}"`,
          ...(userId && { createdByUserId: userId }),
        },
      });
    } catch (error) {
      this.logger.error(`Erro ao criar evento de histórico para deleteTask: ${error.message}`);
    }

    return { message: 'Tarefa removida.' };
  }

  // ── Anexos da garantia (Onda 3) ─────────────────────────────────────────────
  // A lista de anexos vem junto no findOne; aqui só upload/download/remoção.

  async createAttachment(
    claimId: string,
    file: { originalname: string; mimetype: string; size: number; path: string },
    userId?: string,
  ) {
    const claim = await this.prisma.warrantyClaim.findUnique({ where: { id: claimId } });
    if (!claim) {
      // Remove o arquivo já gravado pelo Multer se a garantia não existe.
      this.safeUnlink(file.path);
      throw new NotFoundException('Garantia não encontrada');
    }
    const att = await this.prisma.warrantyAttachment.create({
      data: {
        claimId,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storagePath: file.path,
        ...(userId && { uploadedByUserId: userId }),
      },
      select: { id: true, fileName: true, mimeType: true, size: true, createdAt: true },
    });

    try {
      await this.prisma.warrantyEvent.create({
        data: {
          claimId,
          eventType: 'ATTACHMENT_UPLOADED',
          comment: `Arquivo anexado: "${att.fileName}"`,
          ...(userId && { createdByUserId: userId }),
        },
      });
    } catch (error) {
      this.logger.error(`Erro ao criar evento de histórico para createAttachment: ${error.message}`);
    }

    return att;
  }

  // Retorna o registro completo (inclui storagePath) para streaming do download.
  async getAttachmentForDownload(attId: string) {
    const att = await this.prisma.warrantyAttachment.findUnique({ where: { id: attId } });
    if (!att) {
      throw new NotFoundException('Anexo não encontrado');
    }
    return att;
  }

  async deleteAttachment(attId: string, userId?: string) {
    const att = await this.prisma.warrantyAttachment.findUnique({ where: { id: attId } });
    if (!att) {
      throw new NotFoundException('Anexo não encontrado');
    }
    await this.prisma.warrantyAttachment.delete({ where: { id: attId } });
    this.safeUnlink(att.storagePath); // best-effort, não bloqueia a remoção do registro

    try {
      await this.prisma.warrantyEvent.create({
        data: {
          claimId: att.claimId,
          eventType: 'ATTACHMENT_DELETED',
          comment: `Arquivo removido: "${att.fileName}"`,
          ...(userId && { createdByUserId: userId }),
        },
      });
    } catch (error) {
      this.logger.error(`Erro ao criar evento de histórico para deleteAttachment: ${error.message}`);
    }

    return { message: 'Anexo removido.' };
  }

  private safeUnlink(path: string) {
    try {
      if (path && fs.existsSync(path)) {
        fs.unlinkSync(path);
      }
    } catch (error) {
      this.logger.error(`Falha ao remover arquivo ${path}: ${error.message}`);
    }
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
        ...autoClosePatch(toStatus),
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

    // Auditoria best-effort (nunca lança).
    await this.auditLogsService.log({
      userId,
      action: 'WARRANTY_STATUS_CHANGED',
      entity: 'warranty_claims',
      entityId: id,
      metadata: {
        protocolNumber: claim.protocolNumber,
        fromStatus: claim.status,
        toStatus,
        comment: data?.comment ?? null,
      },
    });

    // Geração automática de tarefas por template (Onda 7).
    // best-effort: não bloqueia a transição se falhar.
    try {
      await this.generateAutoTasks(id, claim.status, toStatus, userId);
    } catch (err) {
      this.logger.error(`Erro ao gerar tarefas automáticas: ${err.message}`);
    }

    return updated;
  }

  // ── Geração automática de tarefas por template (Onda 7) ─────────────────────
  //
  // Consulta os WarrantyTaskTemplate ativos para o status de destino e cria
  // as WarrantyTasks correspondentes. Resolve o responsável pelo UserRole.
  // Se a transição for AGUARDANDO_CLIENTE → EM_ANALISE (retorno), NÃO gera
  // tarefas duplicadas — apenas gera na entrada inicial.
  private async generateAutoTasks(
    claimId: string,
    fromStatus: string,
    toStatus: WarrantyStatus,
    userId: string,
  ): Promise<void> {
    // Evitar duplicatas: retorno AGUARDANDO_CLIENTE → EM_ANALISE não gera tarefas
    if (fromStatus === 'AGUARDANDO_CLIENTE' && toStatus === 'EM_ANALISE') {
      return;
    }

    const templates = await this.prisma.warrantyTaskTemplate.findMany({
      where: { toStatus, active: true },
      orderBy: { sortOrder: 'asc' },
    });

    if (templates.length === 0) return;

    // Busca a garantia com o assignee atual para resolução de responsável
    const claim = await this.prisma.warrantyClaim.findUnique({
      where: { id: claimId },
      include: { assignedTo: true },
    });

    // Mapa de role → nome do usuário para exibição no assignee
    const roleNameMap: Partial<Record<UserRole, string>> = {};

    // Se a garantia tem um responsável ativo, usar o nome dele para o role correspondente
    if (claim?.assignedTo) {
      roleNameMap[claim.assignedTo.role] = claim.assignedTo.name;
    }

    // Para roles não cobertos pelo assignee da garantia, buscar qualquer usuário ativo
    const missingRoles = templates
      .map((t) => t.targetRole)
      .filter((role, i, arr) => !roleNameMap[role] && arr.indexOf(role) === i);

    if (missingRoles.length > 0) {
      const users = await this.prisma.user.findMany({
        where: { role: { in: missingRoles }, active: true },
        select: { role: true, name: true },
      });
      for (const u of users) {
        if (!roleNameMap[u.role]) {
          roleNameMap[u.role] = u.name;
        }
      }
    }

    // Criar tarefas em lote. O perfil responsável vai em assigneeRole (coluna
    // filtrável); assignee guarda só o nome da pessoa, quando resolvido.
    const taskData = templates.map((tpl) => ({
      claimId,
      title: tpl.title,
      assignee: roleNameMap[tpl.targetRole] || null,
      assigneeRole: tpl.targetRole as string,
      stage: toStatus as string,
      status: 'pendente',
      autoGenerated: true,
      createdByUserId: userId,
    }));

    await this.prisma.warrantyTask.createMany({ data: taskData });

    // Log agrupado no histórico (um único evento)
    const statusLabels: Partial<Record<string, string>> = {
      EM_ANALISE: 'Em Análise',
      AGUARDANDO_CLIENTE: 'Aguardando Cliente',
      APROVADO: 'Aprovado',
      REPROVADO: 'Reprovado',
      FINALIZADO: 'Finalizado',
    };
    const statusLabel = statusLabels[toStatus] || toStatus;
    await this.prisma.warrantyEvent.create({
      data: {
        claimId,
        eventType: 'WORKFLOW_TASKS',
        comment: `[Workflow] ${templates.length} tarefa(s) automática(s) gerada(s) para a etapa "${statusLabel}"`,
        createdByUserId: userId,
      },
    });
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
        ...autoClosePatch('APROVADO'),
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

    // Auditoria best-effort (nunca lança).
    await this.auditLogsService.log({
      userId,
      action: 'WARRANTY_APPROVED',
      entity: 'warranty_claims',
      entityId: id,
      metadata: {
        protocolNumber: claim.protocolNumber,
        fromStatus: claim.status,
        toStatus: 'APROVADO',
        adminNotes: adminNotes ?? null,
      },
    });

    // Geração automática de tarefas por template (best-effort).
    try {
      await this.generateAutoTasks(id, claim.status, WarrantyStatus.APROVADO, userId);
    } catch (err) {
      this.logger.error(`Erro ao gerar tarefas automáticas (aprovação): ${err.message}`);
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
        ...autoClosePatch('REPROVADO'),
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

    // Auditoria best-effort (nunca lança).
    await this.auditLogsService.log({
      userId,
      action: 'WARRANTY_REJECTED',
      entity: 'warranty_claims',
      entityId: id,
      metadata: {
        protocolNumber: claim.protocolNumber,
        fromStatus: claim.status,
        toStatus: 'REPROVADO',
        rejectionReason,
      },
    });

    // Geração automática de tarefas por template (best-effort).
    try {
      await this.generateAutoTasks(id, claim.status, WarrantyStatus.REPROVADO, userId);
    } catch (err) {
      this.logger.error(`Erro ao gerar tarefas automáticas (reprovação): ${err.message}`);
    }

    return updated;
  }

  /**
   * Define (ou limpa) o custo da garantia para a empresa.
   * Restrito a ADMIN_RELM/GERENTE_RELM (RBAC no controller).
   *
   * @param cost número >= 0 para definir, ou null para limpar.
   * Registra um warrantyEvent best-effort 'COST_UPDATED'.
   */
  async setCost(id: string, cost: number | null, adminUserId?: string) {
    const claim = await this.prisma.warrantyClaim.findUnique({
      where: { id },
    });

    if (!claim) {
      throw new NotFoundException('Garantia não encontrada');
    }

    const updated = await this.prisma.warrantyClaim.update({
      where: { id },
      data: { cost },
    });

    // Evento de histórico (não bloqueia a operação se falhar).
    try {
      const comment =
        cost === null || cost === undefined
          ? 'Custo da garantia removido'
          : `Custo definido: R$ ${Number(cost).toFixed(2)}`;
      await this.prisma.warrantyEvent.create({
        data: {
          claimId: id,
          eventType: 'COST_UPDATED',
          comment,
          ...(adminUserId && { createdByUserId: adminUserId }),
        },
      });
    } catch (error) {
      this.logger.error(
        `Erro ao registrar evento de custo da garantia ${id}: ${error.message}`,
      );
    }

    return updated;
  }

  /**
   * Reverte (override administrativo) o status de uma garantia.
   *
   * IMPORTANTE: este é um caminho SEPARADO da FSM forward-only. Não usa
   * FSM_TRANSITIONS — permite mover para qualquer status válido do enum.
   * Restrito a ADMIN_RELM/GERENTE_RELM (RBAC no controller) e exige
   * justificativa, registrada no histórico. NÃO envia e-mail ao cliente.
   *
   * Se estiver SAINDO de APROVADO, limpa o token/carimbos de validação para
   * não restar um comprovante "aprovado" válido após a reversão.
   */
  async revertStatus(
    id: string,
    toStatus: WarrantyStatus,
    reason: string,
    adminUserId?: string,
  ) {
    const claim = await this.prisma.warrantyClaim.findUnique({
      where: { id },
    });

    if (!claim) {
      throw new NotFoundException('Garantia não encontrada');
    }

    if (toStatus === claim.status) {
      throw new BadRequestException(
        'O novo status deve ser diferente do status atual',
      );
    }

    // Override: NÃO valida FSM_TRANSITIONS. Apenas garante que o valor é
    // um status válido do enum (já garantido pelo DTO @IsIn, reforçado aqui).
    if (!Object.values(WarrantyStatus).includes(toStatus)) {
      throw new BadRequestException(`Status inválido: ${toStatus}`);
    }

    // Ao sair de APROVADO, invalida o comprovante de validação.
    const leavingApproved = claim.status === WarrantyStatus.APROVADO;
    const clearApprovalData = leavingApproved
      ? {
          validationToken: null,
          validatedAt: null,
          approvedAt: null,
          approvalEmailSentAt: null,
          tokenGeneratedAt: null,
        }
      : {};

    const updated = await this.prisma.warrantyClaim.update({
      where: { id },
      data: {
        status: toStatus,
        ...clearApprovalData,
        // Reagenda (se vai para resolvido) ou limpa (se sai de resolvido).
        autoCloseAt: RESOLVED_STATUSES.includes(toStatus)
          ? autoClosePatch(toStatus).autoCloseAt
          : null,
      },
    });

    // Registro no histórico (justificativa obrigatória).
    await this.prisma.warrantyEvent.create({
      data: {
        claimId: id,
        eventType: 'STATUS_REVERTED',
        fromStatus: claim.status,
        toStatus,
        comment: reason,
        ...(adminUserId && { createdByUserId: adminUserId }),
      },
    });

    // Auditoria best-effort (nunca lança).
    await this.auditLogsService.log({
      userId: adminUserId,
      action: 'WARRANTY_STATUS_REVERTED',
      entity: 'warranty_claims',
      entityId: id,
      metadata: {
        protocolNumber: claim.protocolNumber,
        fromStatus: claim.status,
        toStatus,
        reason,
      },
    });

    // NÃO envia e-mail ao cliente na reversão (caminho administrativo).
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
