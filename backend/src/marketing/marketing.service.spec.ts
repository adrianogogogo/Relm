import { Test, TestingModule } from '@nestjs/testing';
import { MarketingService } from './marketing.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('MarketingService', () => {
  let service: MarketingService;
  let prisma: any;

  const mockPrisma = {
    landingPage: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MarketingService>(MarketingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('deve criar uma landing page com sucesso', async () => {
    prisma.landingPage.findUnique.mockResolvedValue(null);
    prisma.landingPage.create.mockResolvedValue({
      id: 'lp-1',
      title: 'Campanha de Verão',
      slug: 'verao-2026',
      blocksJson: [],
      active: true,
      viewCount: 0,
    });

    const result = await service.create({
      title: 'Campanha de Verão',
      slug: 'verao-2026',
      blocksJson: [],
    });

    expect(result.id).toBe('lp-1');
    expect(prisma.landingPage.create).toHaveBeenCalled();
  });

  it('deve lançar ConflictException ao tentar criar slug duplicado', async () => {
    prisma.landingPage.findUnique.mockResolvedValue({ id: 'existing' });

    await expect(
      service.create({
        title: 'Nova',
        slug: 'existente',
        blocksJson: [],
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('deve retornar landing page pública e incrementar viewCount', async () => {
    prisma.landingPage.findUnique.mockResolvedValue({
      id: 'lp-1',
      slug: 'promo',
      active: true,
      viewCount: 5,
    });
    prisma.landingPage.update.mockResolvedValue({
      id: 'lp-1',
      slug: 'promo',
      active: true,
      viewCount: 6,
    });

    const result = await service.findBySlugPublic('promo');

    expect(result.slug).toBe('promo');
    expect(prisma.landingPage.update).toHaveBeenCalledWith({
      where: { id: 'lp-1' },
      data: { viewCount: { increment: 1 } },
    });
  });

  it('deve lançar NotFoundException se a landing page pública for inativa', async () => {
    prisma.landingPage.findUnique.mockResolvedValue({
      id: 'lp-1',
      slug: 'inativa',
      active: false,
    });

    await expect(service.findBySlugPublic('inativa')).rejects.toThrow(
      NotFoundException,
    );
  });
});
