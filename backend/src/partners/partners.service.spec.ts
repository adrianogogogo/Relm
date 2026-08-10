/// <reference types="jest" />
import { PartnersService } from './partners.service';
import { TierLevel, PartnerCategory } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

function makePartner(overrides: Partial<{
  id: string;
  minTier: TierLevel;
  active: boolean;
  category: PartnerCategory;
}> = {}) {
  return {
    id: overrides.id ?? 'p1',
    name: 'Café Teste',
    category: overrides.category ?? PartnerCategory.CAFE,
    description: 'Um café parceiro',
    benefit: '10% de desconto',
    minTier: overrides.minTier ?? TierLevel.CARE,
    logoUrl: null,
    link: null,
    city: 'SP',
    active: overrides.active ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makeService(opts: {
  partners?: ReturnType<typeof makePartner>[];
  customerTier?: TierLevel;
} = {}) {
  const partners = opts.partners ?? [makePartner()];

  const prisma: any = {
    customer: {
      findUnique: jest.fn().mockResolvedValue({ currentTier: opts.customerTier ?? TierLevel.CARE }),
    },
    // O service passou a listar lojas parceiras junto dos parceiros da
    // comunidade; sem este mock o findMany estoura antes de chegar na asserção.
    store: { findMany: jest.fn().mockResolvedValue([]) },
    partner: {
      findMany: jest.fn().mockResolvedValue(partners),
      findUnique: jest.fn().mockImplementation(({ where }) =>
        Promise.resolve(partners.find((p) => p.id === where.id) ?? null),
      ),
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'new-p', ...data })),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...partners[0], ...data })),
    },
  };

  return { service: new PartnersService(prisma), prisma };
}

// ── findForCustomer — tier filtering ──────────────────────────────────────

describe('PartnersService.findForCustomer', () => {
  it('CARE: parceiro CARE marcado eligible=true', async () => {
    const { service } = makeService({
      partners: [makePartner({ minTier: TierLevel.CARE })],
      customerTier: TierLevel.CARE,
    });
    const result = await service.findForCustomer('cust-1');
    expect(result[0].eligible).toBe(true);
  });

  it('CARE: parceiro PLUS marcado eligible=false', async () => {
    const { service } = makeService({
      partners: [makePartner({ minTier: TierLevel.PLUS })],
      customerTier: TierLevel.CARE,
    });
    const result = await service.findForCustomer('cust-1');
    expect(result[0].eligible).toBe(false);
  });

  it('PLUS: parceiro PLUS marcado eligible=true', async () => {
    const { service } = makeService({
      partners: [makePartner({ minTier: TierLevel.PLUS })],
      customerTier: TierLevel.PLUS,
    });
    const result = await service.findForCustomer('cust-1');
    expect(result[0].eligible).toBe(true);
  });

  it('PLUS: parceiro CARE também marcado eligible=true', async () => {
    const { service } = makeService({
      partners: [makePartner({ minTier: TierLevel.CARE })],
      customerTier: TierLevel.PLUS,
    });
    const result = await service.findForCustomer('cust-1');
    expect(result[0].eligible).toBe(true);
  });

  it('retorna eligible=false (CARE) se customer não encontrado', async () => {
    const { service, prisma } = makeService({
      partners: [makePartner({ minTier: TierLevel.PLUS })],
    });
    prisma.customer.findUnique.mockResolvedValue(null);
    const result = await service.findForCustomer('unknown');
    expect(result[0].eligible).toBe(false);
  });

  it('só retorna parceiros ativos', async () => {
    // findMany já é chamado com where: { active: true }
    const { service, prisma } = makeService({ partners: [makePartner({ active: true })] });
    await service.findForCustomer('cust-1');
    expect(prisma.partner.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { active: true } }),
    );
  });
});

// ── CRUD ──────────────────────────────────────────────────────────────────

describe('PartnersService — CRUD', () => {
  it('findOne lança NotFoundException para id inexistente', async () => {
    const { service } = makeService({ partners: [] });
    await expect(service.findOne('nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create retorna parceiro criado', async () => {
    const { service } = makeService();
    const result = await service.create({
      name: 'Hotel X',
      category: PartnerCategory.HOTEL,
      benefit: 'Checkout tardio',
      minTier: TierLevel.PLUS,
    });
    expect(result.name).toBe('Hotel X');
  });

  it('remove inativa o parceiro (active=false)', async () => {
    const { service, prisma } = makeService();
    await service.remove('p1');
    expect(prisma.partner.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { active: false } }),
    );
  });
});
