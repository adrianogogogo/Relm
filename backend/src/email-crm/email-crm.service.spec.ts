import { Test, TestingModule } from '@nestjs/testing';
import { EmailCrmService } from './email-crm.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('EmailCrmService', () => {
  let service: EmailCrmService;
  let prisma: any;
  let emailService: any;

  const mockPrisma = {
    emailTemplate: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    emailCampaign: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    customer: {
      findMany: jest.fn(),
    },
    subscription: {
      findMany: jest.fn(),
    },
    store: {
      findMany: jest.fn(),
    },
  };

  const mockEmailService = {
    sendPasswordResetEmail: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailCrmService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<EmailCrmService>(EmailCrmService);
    prisma = module.get<PrismaService>(PrismaService);
    emailService = module.get<EmailService>(EmailService);
  });

  it('deve criar um template de e-mail com sucesso', async () => {
    prisma.emailTemplate.findUnique.mockResolvedValue(null);
    prisma.emailTemplate.create.mockResolvedValue({
      id: 'tmpl-1',
      name: 'Boas vindas',
      slug: 'boas-vindas',
      subject: 'Bem-vindo ao Relm Care+',
      bodyHtml: '<p>Olá</p>',
    });

    const result = await service.createTemplate({
      name: 'Boas vindas',
      slug: 'boas-vindas',
      subject: 'Bem-vindo ao Relm Care+',
      bodyHtml: '<p>Olá</p>',
    });

    expect(result.id).toBe('tmpl-1');
  });

  it('deve lançar ConflictException se o slug do template já existir', async () => {
    prisma.emailTemplate.findUnique.mockResolvedValue({ id: 'existing' });

    await expect(
      service.createTemplate({
        name: 'Boas vindas',
        slug: 'boas-vindas',
        subject: 'Bem-vindo',
        bodyHtml: '<p>Olá</p>',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('deve criar e disparar uma campanha para ALL_CUSTOMERS', async () => {
    prisma.emailCampaign.findUnique.mockResolvedValue({
      id: 'camp-1',
      title: 'Promoção de Verão',
      templateId: 'tmpl-1',
      targetSegment: 'ALL_CUSTOMERS',
      template: { subject: 'Promo', bodyHtml: '<p>Verão</p>' },
    });
    prisma.customer.findMany.mockResolvedValue([
      { email: 'c1@test.com', fullName: 'Cliente 1' },
    ]);
    prisma.emailCampaign.update.mockImplementation((args) => args.data);
    mockEmailService.sendPasswordResetEmail.mockResolvedValue({ success: true });

    await service.triggerCampaign('camp-1');

    expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalled();
  });
});
