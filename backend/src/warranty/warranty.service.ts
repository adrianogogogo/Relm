import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { CustomersService } from '../customers/customers.service';
import { CreateWarrantyPublicDto } from './dto/create-warranty-public.dto';
import { CreateWarrantyAdminDto } from './dto/create-warranty-admin.dto';
import { ProductsService } from '../products/products.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import * as crypto from 'crypto';
import * as fs from 'fs';

// Fechamento automático baseado em statusId (novo workflow).
// IDs fixos da tabela warranty_statuses: 9 = Resolvido, 10 = Fechado/Arquivado.
const AUTO_CLOSE_DAYS = 20;
function autoCloseForStatus(statusId?: number | null) {
  return statusId === 9 || statusId === 10
    ? { autoCloseAt: new Date(Date.now() + AUTO_CLOSE_DAYS * 24 * 60 * 60 * 1000) }
    : { autoCloseAt: null };
}

// ── Novo workflow (RelmDesk-style): soluções com autorização em 2 níveis ──────
// gestor = GERENTE_RELM, diretor = ADMIN_RELM.
const SOLUTION_TYPES_REQUIRE_DIRECTOR = ['troca', 'reembolso'];
const SOLUTION_TYPE_LABELS: Record<string, string> = {
  reparo: 'Reparo / Manutenção',
  troca: 'Troca de Produto',
  reembolso: 'Reembolso',
  cortesia: 'Cortesia / Bonificação',
  outro: 'Outro',
};
// IDs fixos da tabela warranty_statuses (seed da migração).
const STATUS_EM_EXECUCAO = 6;
const STATUS_LOGISTICA = 7;

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
        statusId: 1,
      },
    });

    // Histórico (novo workflow)
    await this.prisma.warrantyHistory.create({
      data: {
        claimId: claim.id,
        actionType: 'ticket_created',
        newValue: 'Garantia criada via formulário público',
        isInternal: true,
        statusToId: 1,
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
      statusId: claim.statusId,
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
        statusId: 1,
      },
    });

    // 6) Histórico (novo workflow).
    await this.prisma.warrantyHistory.create({
      data: {
        claimId: claim.id,
        actionType: 'ticket_created',
        newValue: 'Garantia cadastrada pelo painel administrativo',
        isInternal: true,
        statusToId: 1,
        userId: adminUserId ?? null,
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
      statusId: claim.statusId,
      created_at: claim.createdAt,
    };
  }

  async findAll(filters: any) {
    const where: any = {
      ...(filters.statusId && { statusId: Number(filters.statusId) }),
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
        // events: removido na Fase 4 (WarrantyEvent → WarrantyHistory)
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
        statusDef: true,
        history: {
          orderBy: { createdAt: 'asc' },
        },
        solutions: {
          orderBy: { createdAt: 'desc' },
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

    // Histórico (novo workflow).
    try {
      const note = targetId
        ? `Responsável definido: ${updated.assignedTo?.name ?? targetId}`
        : 'Responsável removido';
      await this.prisma.warrantyHistory.create({
        data: {
          claimId: id,
          actionType: 'note',
          note,
          isInternal: true,
          userId: adminUserId ?? null,
        },
      });
    } catch (error) {
      this.logger.error(`Erro ao registrar histórico de atribuição ${id}: ${error.message}`);
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
        // Tarefa manual: stage livre (não depende mais do enum status).
        stage: 'workflow',
        ...(data.assignee && { assignee: data.assignee }),
        ...(data.assigneeRole && { assigneeRole: data.assigneeRole }),
        ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
        ...(data.status && { status: data.status }),
        ...(userId && { createdByUserId: userId }),
      },
    });

    // Histórico (novo workflow)
    try {
      await this.prisma.warrantyHistory.create({
        data: {
          claimId,
          actionType: 'task_created',
          note: `Tarefa criada: "${task.title}"`,
          isInternal: true,
          userId: userId ?? null,
        },
      });
    } catch (error) {
      this.logger.error(`Erro ao criar histórico para createTask: ${error.message}`);
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
      await this.prisma.warrantyHistory.create({
        data: {
          claimId: updated.claimId,
          actionType: 'task_created',
          note: comment,
          isInternal: true,
          userId: userId ?? null,
        },
      });
    } catch (error) {
      this.logger.error(`Erro ao criar histórico para updateTask: ${error.message}`);
    }

    return updated;
  }

  async deleteTask(taskId: string, userId?: string) {
    const task = await this.prisma.warrantyTask.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }
    await this.prisma.warrantyTask.delete({ where: { id: taskId } });

    // Histórico (novo workflow)
    try {
      await this.prisma.warrantyHistory.create({
        data: {
          claimId: task.claimId,
          actionType: 'task_created',
          note: `Tarefa excluída: "${task.title}"`,
          isInternal: true,
          userId: userId ?? null,
        },
      });
    } catch (error) {
      this.logger.error(`Erro ao criar histórico para deleteTask: ${error.message}`);
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

    // Histórico (novo workflow)
    try {
      await this.prisma.warrantyHistory.create({
        data: {
          claimId,
          actionType: 'task_created',
          note: `Arquivo anexado: "${att.fileName}"`,
          isInternal: true,
          userId: userId ?? null,
        },
      });
    } catch (error) {
      this.logger.error(`Erro ao criar histórico para createAttachment: ${error.message}`);
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

    // Histórico (nov workflow)
    try {
      await this.prisma.warrantyHistory.create({
        data: {
          claimId: att.claimId,
          actionType: 'task_created',
          note: `Arquivo removido: "${att.fileName}"`,
          isInternal: true,
          userId: userId ?? null,
        },
      });
    } catch (error) {
      this.logger.error(`Erro ao criar histórico para deleteAttachment: ${error.message}`);
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

  // ============================================================
  // NOVO WORKFLOW (RelmDesk-style): status livre + soluções 2 níveis
  // ============================================================

  async listStatuses() {
    return this.prisma.warrantyStatusDef.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  // Atualiza o status (tabela) e "passa a bola" (responsável). Grava histórico.
  async updateClaimStatus(
    claimId: string,
    data: { statusId?: number; ballOwnerId?: string; note?: string; isInternal?: boolean },
    userId?: string,
  ) {
    const claim = await this.prisma.warrantyClaim.findUnique({ where: { id: claimId } });
    if (!claim) throw new NotFoundException('Garantia não encontrada');

    const oldStatusId = claim.statusId;
    const oldBall = claim.assignedToUserId;
    const newStatusId = data.statusId ?? oldStatusId;
    const newBall = data.ballOwnerId || userId || oldBall || null;

    const updated = await this.prisma.warrantyClaim.update({
      where: { id: claimId },
      data: { statusId: newStatusId, assignedToUserId: newBall, ...(autoCloseForStatus(newStatusId)) },
    });

    await this.prisma.warrantyHistory.create({
      data: {
        claimId,
        userId: userId ?? null,
        actionType: 'status_change',
        note: data.note ?? null,
        isInternal: data.isInternal ?? true,
        statusFromId: oldStatusId ?? null,
        statusToId: newStatusId ?? null,
        ballFromId: oldBall ?? null,
        ballToId: newBall,
      },
    });

    if (newBall && newBall !== userId) {
      try {
        await this.notificationsService.notifyUsers([newBall], {
          type: 'WARRANTY_BALL',
          title: 'Bola da garantia!',
          message: `Você recebeu a bola do protocolo ${claim.protocolNumber}.`,
          link: `/admin/warranties?claim=${claimId}`,
        });
      } catch (e) {
        this.logger.error(`Erro ao notificar bola: ${e.message}`);
      }
    }
    return updated;
  }

  // Propõe uma solução (sempre inicia no nível gestor).
  async addSolution(
    claimId: string,
    dto: { description: string; solutionType?: string; hasCost?: boolean; costValue?: number; costNotes?: string },
    userId?: string,
  ) {
    const claim = await this.prisma.warrantyClaim.findUnique({ where: { id: claimId } });
    if (!claim) throw new NotFoundException('Garantia não encontrada');

    const type = dto.solutionType || 'outro';
    const requiresDirector = SOLUTION_TYPES_REQUIRE_DIRECTOR.includes(type);
    const typeLabel = SOLUTION_TYPE_LABELS[type] || type;

    const sol = await this.prisma.warrantySolution.create({
      data: {
        claimId,
        description: dto.description,
        solutionType: type,
        hasCost: dto.hasCost || false,
        costValue: dto.costValue ?? null,
        costNotes: dto.costNotes ?? null,
        proposedBy: userId ?? null,
        requiresDirector,
        authorizationLevel: 'gestor',
      },
    });

    const custo = dto.hasCost && dto.costValue ? ` | Custo: R$ ${Number(dto.costValue).toFixed(2)}` : '';

    // Tarefa para um gestor autorizar (best-effort).
    try {
      await this.prisma.warrantyTask.create({
        data: {
          claimId,
          title: `Autorizar solução — ${typeLabel} | ${claim.protocolNumber}`,
          assigneeRole: 'GERENTE_RELM',
          status: 'pendente',
          autoGenerated: true,
          ...(userId && { createdByUserId: userId }),
        },
      });
    } catch (e) {
      this.logger.error(`Erro ao criar层高 o task de autorização: ${e.message}`);
    }

    await this.prisma.warrantyHistory.create({
      data: {
        claimId,
        userId: userId ?? null,
        actionType: 'solution_proposed',
        newValue: `[${typeLabel}] ${dto.description}${custo}`,
        isInternal: true,
      },
    });

    // Notifica gestores/diretores (best-effort).
    try {
      const targets = await this.prisma.user.findMany({
        where: { role: { in: ['GERENTE_RELM', 'ADMIN_RELM'] }, active: true },
        select: { id: true },
      });
      if (targets.length) {
        await this.notificationsService.notifyUsers(targets.map((u) => u.id), {
          type: 'WARRANTY_SOLUTION',
          title: 'Nova solução para autorizar',
          message: `Protocolo ${claim.protocolNumber}: "${typeLabel}" aguarda autorização.`,
          link: `/admin/warranties?claim=${claimId}`,
        });
      }
    } catch (e) {
      this.logger.error(`Erro ao notificar solução: ${e.message}`);
    }

    return sol;
  }

  // Aprova/reprova solução — autorização em 2 níveis (gestor → diretor).
  async approveSolution(
    claimId: string,
    solutionId: string,
    dto: { approved: boolean; rejectionReason?: string },
    user: { userId: string; role: string },
  ) {
    if (!['ADMIN_RELM', 'GERENTE_RELM'].includes(user.role)) {
      throw new ForbiddenException('Apenas gestor/diretor podem autorizar soluções');
    }

    const sol = await this.prisma.warrantySolution.findFirst({
      where: { id: solutionId, claimId },
    });
    if (!sol) throw new NotFoundException('Solução não encontrada');

    const claim = await this.prisma.warrantyClaim.findUnique({ where: { id: claimId } });
    const typeLabel = SOLUTION_TYPE_LABELS[sol.solutionType] || sol.solutionType;
    const isDiretor = user.role === 'ADMIN_RELM';
    const isGestor = user.role === 'GERENTE_RELM';

    // ── Reprovação (qualquer nível) ──
    if (!dto.approved) {
      await this.prisma.warrantySolution.update({
        where: { id: solutionId },
        data: {
          status: 'reprovado',
          approvedBy: user.userId,
          approvedAt: new Date(),
          rejectionReason: dto.rejectionReason || 'Reprovado',
        },
      });
      await this.prisma.warrantyHistory.create({
        data: {
          claimId,
          userId: user.userId,
          actionType: 'solution_rejected',
          newValue: `[${typeLabel}] Reprovado: ${dto.rejectionReason || '—'}`,
          isInternal: true,
        },
      });
      return { message: 'Solução reprovada' };
    }

    // ── Nível 1: gestor ──
    if (sol.authorizationLevel === 'gestor') {
      if (sol.requiresDirector && isGestor) {
        // sobe para o nível diretor (não finaliza)
        await this.prisma.warrantySolution.update({
          where: { id: solutionId },
          data: { authorizationLevel: 'diretor', approvedBy: user.userId, approvedAt: new Date() },
        });
        try {
          const dirs = await this.prisma.user.findMany({
            where: { role: 'ADMIN_RELM', active: true },
            select: { id: true },
          });
          await this.prisma.warrantyTask.create({
            data: {
              claimId,
              title: `Confirmar autorização — ${typeLabel} | ${claim?.protocolNumber}`,
              assigneeRole: 'ADMIN_RELM',
              status: 'pendente',
              autoGenerated: true,
              createdByUserId: user.userId,
            },
          });
          if (dirs.length) {
            await this.notificationsService.notifyUsers(dirs.map((d) => d.id), {
              type: 'WARRANTY_SOLUTION',
              title: 'Autorização de diretor necessária',
              message: `Protocolo ${claim?.protocolNumber}: "${typeLabel}" aprovada pelo gestor, aguarda confirmação.`,
              link: `/admin/warranties?claim=${claimId}`,
            });
          }
        } catch (e) {
          this.logger.error(`Erro ao escalar para diretor: ${e.message}`);
        }
        await this.prisma.warrantyHistory.create({
          data: {
            claimId,
            userId: user.userId,
            actionType: 'solution_approved',
            newValue: `[${typeLabel}] Aprovado pelo gestor — aguardando diretor`,
            isInternal: true,
          },
        });
        return { message: 'Aprovada pelo gestor — aguardando diretor', next_level: 'diretor' };
      }
      // não requer diretor (ou diretor aprovando direto) → finaliza
      await this.finalizeApproval(claimId, solutionId, sol, user, typeLabel, claim?.protocolNumber);
      return { message: 'Solução aprovada e fluxo de艰涩ução iniciado' };
    }

    // ── Nível 2: diretor confirma ──
    if (sol.authorizationLevel === 'diretor') {
      if (!isDiretor) {
        throw new ForbiddenException('Esta solução requer confirmação do diretor');
      }
      await this.prisma.warrantySolution.update({
        where: { id: solutionId },
        data: { directorApprovedBy: user.userId, directorApprovedAt: new Date(), authorizationLevel: 'concluido' },
      });
      await this.finalizeApproval(claimId, solutionId, sol, user, typeLabel, claim?.protocolNumber);
      return { message: 'Solução confirmada pelo diretor — execução iniciada' };
    }

    throw new BadRequestException('Esta solução já foi processada');
  }

  // Efeito da aprovação final: marca aprovado, avança o status e cria tarefa de execução.
  private async finalizeApproval(
    claimId: string,
    solutionId: string,
    sol: any,
    user: { userId: string },
    typeLabel: string,
    bondadeNumber?: string,
  ) {
    await this.prisma.warrantySolution.update({
      where: { id: solutionId },
      data: {
        status: 'aprovado',
        approvedBy: sol.approvedBy ?? user.userId,
        approvedAt: sol.approvedAt ?? new Date(),
      },
    });

    let newStatusId = STATUS_EM_EXECUCAO;
    let taskTitle = `Executar solução — ${bondadeNumber}`;
    if (sol.solutionType === 'troca') {
      newStatusId = STATUS_LOGISTICA;
      taskTitle = `Executar TROCA — ${bondadeNumber}`;
    } else if (sol.solutionType === 'reembolso') {
      const valor = sol.costValue ? `R$ ${Number(sol.costValue).toFixed(2)}` : 'valor a definir';
      taskTitle = `Processar REEMBOLSO — ${valor} | ${bondadeNumber}`;
    } else if (sol.solutionType === 'reparo') {
      taskTitle = `Executar REPARO — ${bondadeNumber}`;
    } else if (sol.solutionType === 'cortesia') {
      taskTitle = `Processar CORTESIA — ${bondadeNumber}`;
    }

    await this.prisma.warrantyClaim.update({
      where: { id: claimId },
      data: { statusId: newStatusId },
    });

    try {
      await this.prisma.warrantyTask.create({
        data: {
          claimId,
          title: taskTitle,
          assigneeRole: 'SUPORTE_RELM',
          status: 'pendente',
          autoGenerated: true,
          createdByUserId: user.userId,
        },
      });
    } catch (e) {
      this.logger.error(`Erro ao criar tarefa de execução: ${e.message}`);
    }

    await this.prisma.warrantyHistory.create({
      data: {
        claimId,
        userId: user.userId,
        actionType: 'solution_approved',
        newValue: `[${typeLabel}] Solução aprovada — execução iniciada`,
        isInternal: true,
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

    // Histórico (novo workflow)
    try {
      const note =
        cost === null || cost === undefined
          ? 'Custo da garantia removido'
          : `Custo definido: R$ ${Number(cost).toFixed(2)}`;
      await this.prisma.warrantyHistory.create({
        data: {
          claimId: id,
          actionType: 'note',
          note,
          isInternal: true,
          userId: adminUserId ?? null,
        },
      });
    } catch (error) {
      this.logger.error(
        `Erro ao registrar histórico de custo da garantia ${id}: ${error.message}`,
      );
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

    // Validação baseada no novo workflow: statusId 9 (Resolvido) ou 10 (Fechado/Arquivado).
    if (![9, 10].includes(claim.statusId ?? 0)) {
      throw new BadRequestException('Esta garantia ainda não está resolvida/fechada');
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
        statusId: claim.statusId,
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
