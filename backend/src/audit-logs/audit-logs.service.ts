import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Grava um registro de auditoria (best-effort).
   *
   * NUNCA lança: registrar auditoria não pode quebrar a operação principal.
   * Em caso de falha, apenas emite um Logger.warn.
   */
  async log(params: {
    userId?: string;
    // Ator polimórfico. As chamadas manuais só passam `userId` (sempre equipe
    // Relm) e caem no default USER — quem preenche os outros tipos é o
    // AuditInterceptor, que vê lojista e cliente também.
    actorType?: string;
    actorId?: string;
    action: string;
    entity: string;
    entityId?: string;
    metadata?: any;
    ipAddress?: string;
  }): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: params.userId,
          actorType: params.actorType ?? (params.userId ? 'USER' : undefined),
          actorId: params.actorId ?? params.userId,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId,
          metadata: params.metadata,
          ipAddress: params.ipAddress,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Falha ao registrar log de auditoria (${params.action} / ${params.entity}): ${error?.message ?? error}`,
      );
    }
  }

  async findAll(query: { action?: string; entity?: string; page?: string }) {
    const page = Math.max(1, parseInt(query.page || '1'));
    const take = 50;
    const skip = (page - 1) * take;

    const where: any = {};
    if (query.action) where.action = { contains: query.action, mode: 'insensitive' };
    if (query.entity) where.entity = { contains: query.entity, mode: 'insensitive' };

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        select: {
          id: true,
          actorType: true,
          actorId: true,
          action: true,
          entity: true,
          entityId: true,
          metadata: true,
          ipAddress: true,
          createdAt: true,
          user: { select: { name: true, email: true, role: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { logs, total, page, pages: Math.ceil(total / take) };
  }
}
