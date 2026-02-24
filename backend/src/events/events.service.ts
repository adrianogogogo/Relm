import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MembershipService } from '../membership/membership.service';
import { CreateEventDto, UpdateEventDto } from './dto';

@Injectable()
export class EventsService {
  constructor(
    private prisma: PrismaService,
    private membershipService: MembershipService,
  ) {}

  async create(createEventDto: CreateEventDto, userId: string) {
    const { startAt, endAt, ...rest } = createEventDto;

    const start = new Date(startAt);
    const end = new Date(endAt);

    if (start >= end) {
      throw new BadRequestException('Data de início deve ser anterior à data de término');
    }

    if (start < new Date()) {
      throw new BadRequestException('Data de início deve ser no futuro');
    }

    return this.prisma.event.create({
      data: {
        ...rest,
        startAt: start,
        endAt: end,
        createdByUserId: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        store: {
          select: {
            id: true,
            address: true,
            city: true,
            state: true,
          },
        },
        _count: {
          select: { registrations: true },
        },
      },
    });
  }

  async findAll(filters?: {
    isPublic?: boolean;
    requiresMembership?: boolean;
    category?: string;
    storeId?: string;
    upcoming?: boolean;
  }) {
    const where: any = { active: true };

    if (filters) {
      if (filters.isPublic !== undefined) where.isPublic = filters.isPublic;
      if (filters.requiresMembership !== undefined) where.requiresMembership = filters.requiresMembership;
      if (filters.category) where.category = filters.category;
      if (filters.storeId) where.storeId = filters.storeId;
      if (filters.upcoming) where.startAt = { gte: new Date() };
    }

    return this.prisma.event.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        store: {
          select: {
            id: true,
            address: true,
            city: true,
            state: true,
          },
        },
        _count: {
          select: { registrations: true },
        },
      },
      orderBy: { startAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        store: {
          select: {
            id: true,
            address: true,
            city: true,
            state: true,
          },
        },
        registrations: {
          include: {
            customer: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        _count: {
          select: { registrations: true },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Evento não encontrado');
    }

    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto, userId: string, userRole: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException('Evento não encontrado');
    }

    if (event.createdByUserId !== userId && userRole !== 'ADMIN_RELM') {
      throw new ForbiddenException('Você não tem permissão para atualizar este evento');
    }

    const { startAt, endAt, ...rest } = updateEventDto;

    const data: any = { ...rest };

    if (startAt && endAt) {
      const start = new Date(startAt);
      const end = new Date(endAt);

      if (start >= end) {
        throw new BadRequestException('Data de início deve ser anterior à data de término');
      }

      data.startAt = start;
      data.endAt = end;
    } else if (startAt) {
      data.startAt = new Date(startAt);
    } else if (endAt) {
      data.endAt = new Date(endAt);
    }

    return this.prisma.event.update({
      where: { id },
      data,
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        store: {
          select: {
            id: true,
            address: true,
            city: true,
            state: true,
          },
        },
        _count: {
          select: { registrations: true },
        },
      },
    });
  }

  async remove(id: string, userId: string, userRole: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException('Evento não encontrado');
    }

    if (event.createdByUserId !== userId && userRole !== 'ADMIN_RELM') {
      throw new ForbiddenException('Você não tem permissão para remover este evento');
    }

    return this.prisma.event.update({
      where: { id },
      data: { active: false },
    });
  }

  async findPublicEvents(filters?: { category?: string; upcoming?: boolean }) {
    const where: any = { active: true, isPublic: true };

    if (filters) {
      if (filters.category) where.category = filters.category;
      if (filters.upcoming) where.startAt = { gte: new Date() };
    }

    return this.prisma.event.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        startAt: true,
        endAt: true,
        maxParticipants: true,
        category: true,
        imageUrl: true,
        requiresMembership: true,
        _count: {
          select: { registrations: true },
        },
      },
      orderBy: { startAt: 'asc' },
    });
  }

  async findPublicEvent(id: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, active: true, isPublic: true },
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        startAt: true,
        endAt: true,
        maxParticipants: true,
        category: true,
        imageUrl: true,
        requiresMembership: true,
        _count: {
          select: { registrations: true },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Evento não encontrado');
    }

    return event;
  }

  async register(eventId: string, customerId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    });

    if (!event || !event.active) {
      throw new NotFoundException('Evento não encontrado');
    }

    if (event.startAt < new Date()) {
      throw new BadRequestException('Não é possível se inscrever em evento que já começou');
    }

    if (event.maxParticipants && event._count.registrations >= event.maxParticipants) {
      throw new BadRequestException('Evento já atingiu o número máximo de participantes');
    }

    if (event.requiresMembership) {
      // TODO: Check if customer has active membership
    }

    const existing = await this.prisma.eventRegistration.findUnique({
      where: {
        eventId_customerId: {
          eventId,
          customerId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Cliente já inscrito neste evento');
    }

    const registration = await this.prisma.eventRegistration.create({
      data: {
        eventId,
        customerId,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startAt: true,
            location: true,
          },
        },
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // 🎯 ADICIONAR PONTOS AUTOMATICAMENTE!
    try {
      await this.membershipService.processEventPoints(customerId, eventId);
    } catch (error) {
      console.error('Erro ao adicionar pontos do evento:', error);
      // Não bloqueia a inscrição se falhar
    }

    return registration;
  }

  async unregister(eventId: string, customerId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Evento não encontrado');
    }

    if (event.startAt < new Date()) {
      throw new BadRequestException('Não é possível cancelar inscrição de evento que já começou');
    }

    const registration = await this.prisma.eventRegistration.findUnique({
      where: {
        eventId_customerId: {
          eventId,
          customerId,
        },
      },
    });

    if (!registration) {
      throw new NotFoundException('Inscrição não encontrada');
    }

    await this.prisma.eventRegistration.delete({
      where: {
        eventId_customerId: {
          eventId,
          customerId,
        },
      },
    });

    return { message: 'Inscrição cancelada com sucesso' };
  }

  async getMyRegistrations(customerId: string) {
    return this.prisma.eventRegistration.findMany({
      where: { customerId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            location: true,
            startAt: true,
            endAt: true,
            category: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        event: {
          startAt: 'asc',
        },
      },
    });
  }
}
