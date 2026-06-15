import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterEventDto } from './dto/register-event.dto';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.event.findMany({
      where: { active: true },
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
  }) {
    return this.prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        location: data.location,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        maxParticipants: data.maxParticipants ?? null,
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

  async register(eventId: string, body: RegisterEventDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { _count: { select: { registrations: true } } },
    });

    if (!event) throw new NotFoundException('Evento não encontrado');
    if (!event.active) throw new BadRequestException('Inscrições encerradas para este evento');

    if (event.maxParticipants && event._count.registrations >= event.maxParticipants) {
      throw new BadRequestException('Evento sem vagas disponíveis');
    }

    // Upsert customer by email.
    // SEGURANÇA: dados públicos não são confiáveis. O update é vazio de
    // propósito, para nunca sobrescrever nome/telefone de um cliente já
    // existente caso o atacante informe o email de outra pessoa.
    const customer = await this.prisma.customer.upsert({
      where: { email: body.email },
      create: {
        email: body.email,
        fullName: body.fullName,
        phone: body.phone ?? '',
      },
      update: {},
    });

    // Check if already registered
    const existing = await this.prisma.eventRegistration.findUnique({
      where: { eventId_customerId: { eventId, customerId: customer.id } },
    });
    if (existing) {
      throw new ConflictException('E-mail já inscrito neste evento');
    }

    await this.prisma.eventRegistration.create({
      data: { eventId, customerId: customer.id },
    });

    return {
      success: true,
      message: 'Inscrição realizada com sucesso!',
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
