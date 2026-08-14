import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('EventsService', () => {
  let service: EventsService;
  let prisma: any;
  let notifications: any;

  beforeEach(async () => {
    prisma = {
      event: {
        updateMany: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      customer: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      eventRegistration: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    notifications = {
      notifyTeam: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  describe('inactivateExpiredEvents', () => {
    it('deve inativar eventos com endAt menor que a data atual', async () => {
      prisma.event.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.inactivateExpiredEvents();

      expect(prisma.event.updateMany).toHaveBeenCalledWith({
        where: {
          active: true,
          endAt: { lt: expect.any(Date) },
        },
        data: {
          active: false,
        },
      });
      expect(result).toEqual({ count: 3 });
    });
  });

  describe('findAll', () => {
    it('deve chamar inactivateExpiredEvents e retornar apenas eventos ativos', async () => {
      prisma.event.updateMany.mockResolvedValue({ count: 1 });
      prisma.event.findMany.mockResolvedValue([
        { id: 'ev-1', title: 'Pedal Futuro', active: true },
      ]);

      const events = await service.findAll();

      expect(prisma.event.updateMany).toHaveBeenCalled();
      expect(prisma.event.findMany).toHaveBeenCalledWith({
        where: { active: true },
        include: { _count: { select: { registrations: true } } },
        orderBy: { startAt: 'asc' },
      });
      expect(events).toHaveLength(1);
    });
  });

  describe('register', () => {
    it('deve rejeitar inscrição em evento com data passada (vencido)', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      prisma.event.findUnique.mockResolvedValue({
        id: 'ev-past',
        title: 'Evento Passado',
        active: true,
        endAt: pastDate,
        _count: { registrations: 0 },
      });
      prisma.event.update.mockResolvedValue({ id: 'ev-past', active: false });

      await expect(
        service.register('ev-past', { fullName: 'Teste', email: 'test@example.com' }),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.event.update).toHaveBeenCalledWith({
        where: { id: 'ev-past' },
        data: { active: false },
      });
    });
  });
});
