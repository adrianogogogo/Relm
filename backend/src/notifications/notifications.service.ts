import { Injectable, Logger } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type NotificationRecipientType = 'USER' | 'STORE_USER';

export interface NotificationPayload {
  type: string;
  title: string;
  message: string;
  link?: string;
}

export interface CreateNotificationInput extends NotificationPayload {
  recipientType: NotificationRecipientType;
  recipientId: string;
}

// Roles da equipe Relm (vivem na tabela User).
const TEAM_ROLES: UserRole[] = [
  UserRole.ADMIN_RELM,
  UserRole.GERENTE_RELM,
  UserRole.SUPORTE_RELM,
];

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  // ── Criação ────────────────────────────────────────────────────────────────

  async create(input: CreateNotificationInput) {
    return this.prisma.notification.create({
      data: {
        recipientType: input.recipientType,
        recipientId: input.recipientId,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link ?? null,
      },
    });
  }

  /**
   * Cria notificações em lote para vários usuários da tabela User.
   */
  async notifyUsers(userIds: string[], payload: NotificationPayload) {
    return this.notifyRecipients('USER', userIds, payload);
  }

  /**
   * Cria notificações em lote para um tipo de recipiente.
   */
  async notifyRecipients(
    recipientType: NotificationRecipientType,
    recipientIds: string[],
    payload: NotificationPayload,
  ) {
    const ids = [...new Set(recipientIds)].filter(Boolean);
    if (ids.length === 0) return { count: 0 };

    return this.prisma.notification.createMany({
      data: ids.map((recipientId) => ({
        recipientType,
        recipientId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        link: payload.link ?? null,
      })),
    });
  }

  // ── Resolução de recipientes ─────────────────────────────────────────────────

  /** IDs dos usuários da equipe Relm (User com role de equipe e ativos). */
  async getTeamUserIds(): Promise<string[]> {
    const users = await this.prisma.user.findMany({
      where: { role: { in: TEAM_ROLES }, active: true },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  /** IDs dos lojistas (StoreUser) de uma loja específica. */
  async getStoreUserIds(storeId: string): Promise<string[]> {
    if (!storeId) return [];
    const storeUsers = await this.prisma.storeUser.findMany({
      where: { storeId, isActive: true },
      select: { id: true },
    });
    return storeUsers.map((s) => s.id);
  }

  // ── Gatilhos best-effort ─────────────────────────────────────────────────────
  //
  // Estes helpers NUNCA lançam: qualquer falha é apenas logada. Assim o fluxo
  // principal (garantia/seguro/evento/cliente) jamais quebra por causa de uma
  // notificação.

  async notifyTeam(payload: NotificationPayload): Promise<void> {
    try {
      const teamIds = await this.getTeamUserIds();
      await this.notifyUsers(teamIds, payload);
    } catch (error) {
      this.logger.error(
        `Falha ao notificar a equipe (${payload.type}): ${error?.message}`,
      );
    }
  }

  async notifyStore(storeId: string, payload: NotificationPayload): Promise<void> {
    try {
      if (!storeId) return;
      const storeIds = await this.getStoreUserIds(storeId);
      await this.notifyRecipients('STORE_USER', storeIds, payload);
    } catch (error) {
      this.logger.error(
        `Falha ao notificar a loja ${storeId} (${payload.type}): ${error?.message}`,
      );
    }
  }

  // ── Consulta / leitura ───────────────────────────────────────────────────────

  async findForRecipient(
    recipientType: NotificationRecipientType,
    recipientId: string,
    options?: { onlyUnread?: boolean; take?: number },
  ) {
    return this.prisma.notification.findMany({
      where: {
        recipientType,
        recipientId,
        ...(options?.onlyUnread ? { read: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: options?.take ?? 20,
    });
  }

  async unreadCount(
    recipientType: NotificationRecipientType,
    recipientId: string,
  ): Promise<number> {
    return this.prisma.notification.count({
      where: { recipientType, recipientId, read: false },
    });
  }

  /** Marca uma notificação como lida, validando posse. */
  async markRead(
    id: string,
    recipientType: NotificationRecipientType,
    recipientId: string,
  ) {
    const result = await this.prisma.notification.updateMany({
      where: { id, recipientType, recipientId, read: false },
      data: { read: true, readAt: new Date() },
    });
    return { updated: result.count };
  }

  async markAllRead(
    recipientType: NotificationRecipientType,
    recipientId: string,
  ) {
    const result = await this.prisma.notification.updateMany({
      where: { recipientType, recipientId, read: false },
      data: { read: true, readAt: new Date() },
    });
    return { updated: result.count };
  }
}
