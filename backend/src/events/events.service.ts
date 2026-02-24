import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async create(createEventDto: CreateEventDto) {
    return this.prisma.event.create({
      data: {
        title: createEventDto.title,
        description: createEventDto.description,
        location: createEventDto.location,
        startAt: new Date(createEventDto.startAt),
        endAt: new Date(createEventDto.endAt),
        maxParticipants: createEventDto.maxParticipants,
        active: createEventDto.active ?? true,
      },
    });
  }

  async findAll(filters?: any) {
    const where: any = {};
    
    if (filters?.active !== undefined) {
      where.active = filters.active;
    }
    
    if (filters?.upcoming) {
      where.startAt = { gte: new Date() };
    }

    return this.prisma.event.findMany({
      where,
      include: {
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
        _count: {
          select: { registrations: true },
        },
      },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  async getRegistrations(id: string) {
    await this.findOne(id); // Verifica se evento existe

    return this.prisma.eventRegistration.findMany({
      where: { eventId: id },
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, updateEventDto: UpdateEventDto) {
    await this.findOne(id); // Verifica se evento existe

    const data: any = {};
    if (updateEventDto.title) data.title = updateEventDto.title;
    if (updateEventDto.description) data.description = updateEventDto.description;
    if (updateEventDto.location) data.location = updateEventDto.location;
    if (updateEventDto.startAt) data.startAt = new Date(updateEventDto.startAt);
    if (updateEventDto.endAt) data.endAt = new Date(updateEventDto.endAt);
    if (updateEventDto.maxParticipants !== undefined) data.maxParticipants = updateEventDto.maxParticipants;
    if (updateEventDto.active !== undefined) data.active = updateEventDto.active;

    return this.prisma.event.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Verifica se evento existe

    return this.prisma.event.delete({
      where: { id },
    });
  }

  async getStatistics() {
    const totalEvents = await this.prisma.event.count();
    const activeEvents = await this.prisma.event.count({
      where: { active: true },
    });
    const upcomingEvents = await this.prisma.event.count({
      where: {
        active: true,
        startAt: { gte: new Date() },
      },
    });
    const totalRegistrations = await this.prisma.eventRegistration.count();

    return {
      totalEvents,
      activeEvents,
      upcomingEvents,
      totalRegistrations,
    };
  }
}
