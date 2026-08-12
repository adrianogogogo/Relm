import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailCrmService } from './email-crm.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

const PAGINA = {
  titulo: 'Revisão de inverno',
  subtitulo: 'Sua bike pronta para a chuva',
  paleta: { corPrimaria: '#2196F3', corFundo: '#FFFFFF', corTexto: '#111111' },
  blocos: [
    {
      tipo: 'hero',
      titulo: 'Revisão de inverno',
      subtitulo: 'Agende na loja parceira',
      ctaTexto: 'Agendar',
      ctaUrl: '/clube',
    },
  ],
  imagemUrl: '/uploads/marketing/abc.png',
};

describe('EmailCrmService', () => {
  let service: EmailCrmService;
  let prisma: any;

  const mockPrisma = {
    emailTemplate: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn() },
    emailCampaign: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn() },
    customer: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailCrmService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: { get: () => 'https://relm.example' } },
      ],
    }).compile();

    service = module.get<EmailCrmService>(EmailCrmService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('lança ConflictException se o slug do template já existir', async () => {
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

  it('exporta HTML de e-mail a partir dos blocos', async () => {
    prisma.emailCampaign.findUnique.mockResolvedValue({
      id: 'camp-1',
      template: { subject: 'Promo', slug: 'promo', blocksJson: PAGINA },
    });

    const res = await service.exportHtml('camp-1');

    expect(res.subject).toBe('Promo');
    expect(res.filename).toBe('promo.html');
    // Tabela e CSS inline: é o que cliente de e-mail entende.
    expect(res.html).toContain('<table');
    expect(res.html).toContain('Revisão de inverno');
    // Imagem absoluta: relativa não carrega em cliente de e-mail.
    expect(res.html).toContain('https://relm.example/uploads/marketing/abc.png');
  });

  it('recusa exportar campanha sem blocos em vez de gerar HTML vazio', async () => {
    prisma.emailCampaign.findUnique.mockResolvedValue({
      id: 'camp-2',
      template: { subject: 'X', slug: 'x', blocksJson: null },
    });

    await expect(service.exportHtml('camp-2')).rejects.toThrow(NotFoundException);
  });

  describe('exportRecipients — lista para a ferramenta de disparo', () => {
    it('só pede quem consentiu e está ativo', async () => {
      mockPrisma.customer.findMany.mockResolvedValue([]);

      await service.exportRecipients('ALL');

      const where = mockPrisma.customer.findMany.mock.calls[0][0].where;
      expect(where.marketingConsent).toBe(true);
      expect(where.active).toBe(true);
      // ALL não filtra tier — mas nunca dispensa o consentimento.
      expect(where.subscription).toBeUndefined();
    });

    it('filtra por tier quando o alvo é um plano', async () => {
      mockPrisma.customer.findMany.mockResolvedValue([]);

      await service.exportRecipients('PLUS');

      const where = mockPrisma.customer.findMany.mock.calls[0][0].where;
      expect(where.subscription).toEqual({ tier: 'PLUS' });
      expect(where.marketingConsent).toBe(true);
    });

    it('monta CSV com cabeçalho e escapa aspas do nome', async () => {
      mockPrisma.customer.findMany.mockResolvedValue([
        { email: 'maria@exemplo.test', fullName: 'Maria "Bike" Silva', subscription: { tier: 'PLUS' } },
        { email: 'joao@exemplo.test', fullName: 'João Souza', subscription: null },
      ]);

      const { csv, total } = await service.exportRecipients('ALL');

      expect(total).toBe(2);
      expect(csv.split('\n')[0]).toBe('email,nome,plano');
      expect(csv).toContain('"Maria ""Bike"" Silva"');
      // Sem assinatura o cliente é CARE — a coluna nunca sai vazia.
      expect(csv).toContain('"joao@exemplo.test","João Souza","CARE"');
    });
  });
});
