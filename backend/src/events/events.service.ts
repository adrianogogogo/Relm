import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async create(createEventDto: CreateEventDto) {
    return this.prisma.event.create({
      data: createEventDto,
    });
  }

  async findAll() {
    return this.prisma.event.findMany({
      orderBy: { startAt: 'desc' },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    });
  }

  async findActive() {
    const now = new Date();
    return this.prisma.event.findMany({
      where: {
        active: true,
        startAt: { gte: now },
      },
      orderBy: { startAt: 'asc' },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: { registrations: true },
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
      },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto) {
    await this.findOne(id);
    
    return this.prisma.event.update({
      where: { id },
      data: updateEventDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    
    return this.prisma.event.delete({
      where: { id },
    });
  }

  async register(eventId: string, customerId: string) {
    const event = await this.findOne(eventId);

    // Check if event is full
    if (event.maxParticipants) {
      const registrationsCount = event._count.registrations;
      if (registrationsCount >= event.maxParticipants) {
        throw new Error('Event is full');
      }
    }

    // Check if already registered
    const existing = await this.prisma.eventRegistration.findUnique({
      where: {
        eventId_customerId: {
          eventId,
          customerId,
        },
      },
    });

    if (existing) {
      throw new Error('Customer already registered for this event');
    }

    return this.prisma.eventRegistration.create({
      data: {
        eventId,
        customerId,
      },
    });
  }

  async unregister(eventId: string, customerId: string) {
    return this.prisma.eventRegistration.delete({
      where: {
        eventId_customerId: {
          eventId,
          customerId,
        },
      },
    });
  }
}
