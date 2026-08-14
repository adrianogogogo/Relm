import {
  Injectable,
  Logger,
  OnModuleInit,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RegisterEventDto } from './dto/register-event.dto';

@Injectable()
export class EventsService implements OnModuleInit {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async onModuleInit() {
    await this.inactivateExpiredEvents();
  }

  /**
   * Cron job executado a cada hora para inativar automaticamente eventos cuja data de término já passou.
   */
  @Cron('0 * * * *')
  async handleExpiredEventsCron() {
    return this.inactivateExpiredEvents();
  }

  /**
   * Inativa todos os eventos ativos cujo término (endAt) é anterior ao momento atual.
   */
  async inactivateExpiredEvents() {
    const now = new Date();
    try {
      const result = await this.prisma.event.updateMany({
        where: {
          active: true,
          endAt: { lt: now },
        },
        data: {
          active: false,
        },
      });

      if (result.count > 0) {
        this.logger.log(`Inativados automaticamente ${result.count} eventos vencidos (endAt < ${now.toISOString()}).`);
      }
      return result;
    } catch (err: any) {
      this.logger.error(`Erro ao inativar eventos vencidos: ${err?.message}`, err?.stack);
      return { count: 0 };
    }
  }

  async findAll() {
    await this.inactivateExpiredEvents();
    return this.prisma.event.findMany({
      where: { active: true },
      include: { _count: { select: { registrations: true } } },
      orderBy: { startAt: 'asc' },
    });
  }

  /**
   * Feed segmentado por perfil: eventos ativos visíveis para o `audience`
   * (targetRoles vazio = todos OU contém o audience). Ordenado por data.
   */
  async findFeed(audience: string) {
    await this.inactivateExpiredEvents();
    return this.prisma.event.findMany({
      where: {
        active: true,
        OR: [{ targetRoles: { isEmpty: true } }, { targetRoles: { has: audience } }],
      },
      include: { _count: { select: { registrations: true } } },
      orderBy: { startAt: 'asc' },
    });
  }

  async findAllAdmin() {
    return this.prisma.event.findMany({
      include: { _count: { select: { registrations: true } } },
      orderBy: { startAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: { _count: { select: { registrations: true } } },
    });
    if (!event) throw new NotFoundException('Evento não encontrado');
    return event;
  }

  async create(data: {
    title: string;
    description: string;
    location: string;
    startAt: string;
    endAt: string;
    maxParticipants?: number;
    targetRoles?: string[];
  }) {
    return this.prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        location: data.location,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        maxParticipants: data.maxParticipants ?? null,
        targetRoles: data.targetRoles ?? [],
      },
    });
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      location?: string;
      startAt?: string;
      endAt?: string;
      maxParticipants?: number;
      active?: boolean;
      targetRoles?: string[];
    },
  ) {
    await this.findOne(id);
    return this.prisma.event.update({
      where: { id },
      data: {
        ...data,
        ...(data.startAt && { startAt: new Date(data.startAt) }),
        ...(data.endAt && { endAt: new Date(data.endAt) }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.event.update({ where: { id }, data: { active: false } });
  }

  async register(eventId: string, body: RegisterEventDto, authCustomerId?: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { _count: { select: { registrations: true } } },
    });

    if (!event) throw new NotFoundException('Evento não encontrado');
    if (!event.active || (event.endAt && new Date(event.endAt) < new Date())) {
      if (event.active) {
        await this.prisma.event.update({ where: { id: eventId }, data: { active: false } });
      }
      throw new BadRequestException('Inscrições encerradas para este evento (evento já realizado)');
    }

    if (event.maxParticipants && event._count.registrations >= event.maxParticipants) {
      throw new BadRequestException('Evento sem vagas disponíveis');
    }

    const emailNorm = (body?.email || '').trim().toLowerCase();

    let customer = null;
    if (authCustomerId) {
      customer = await this.prisma.customer.findUnique({
        where: { id: authCustomerId },
      });
    }

    if (!customer && emailNorm) {
      customer = await this.prisma.customer.findFirst({
        where: {
          email: {
            equals: emailNorm,
            mode: 'insensitive',
          },
        },
      });
    }

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          email: emailNorm,
          fullName: (body.fullName || '').trim(),
          phone: (body.phone || '').trim(),
        },
      });
    }

    // Check if already registered (por ID do cliente ou por email case-insensitive)
    const existing = await this.prisma.eventRegistration.findFirst({
      where: {
        eventId,
        OR: [
          { customerId: customer.id },
          ...(emailNorm
            ? [
                {
                  customer: {
                    email: {
                      equals: emailNorm,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                },
              ]
            : []),
        ],
      },
    });

    if (existing) {
      throw new ConflictException('Você ou este e-mail já está inscrito neste evento');
    }

    const reg = await this.prisma.eventRegistration.create({
      data: { eventId, customerId: customer.id },
    });

    // Notificação best-effort para a equipe Relm (nunca quebra a inscrição).
    await this.notificationsService.notifyTeam({
      type: 'EVENT_REGISTRATION',
      title: 'Nova inscrição em evento',
      message: `${customer.fullName || body.fullName} se inscreveu em "${event.title}".`,
      link: `/admin/events`,
    });

    return {
      success: true,
      message: 'Inscrição realizada com sucesso!',
      registrationId: reg.id,
      event: { id: event.id, title: event.title, startAt: event.startAt },
    };
  }

  async getRegistrations(eventId: string) {
    await this.findOne(eventId);
    return this.prisma.eventRegistration.findMany({
      where: { eventId },
      include: { customer: { select: { id: true, fullName: true, email: true, phone: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }
}
