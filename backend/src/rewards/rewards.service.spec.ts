/// <reference types="jest" />
import { RewardsService } from './rewards.service';
import { TierLevel, PointTxType, VoucherStatus, Prisma } from '@prisma/client';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

// ── Helpers ───────────────────────────────────────────────────────────────

function makeCatalogItem(overrides: Partial<{
  active: boolean;
  stock: number;
  pointsCost: number;
  presaleUntil: Date | null;
  presaleTier: TierLevel | null;
}> = {}) {
  return {
    id: 'item-1',
    title: 'Test Item',
    description: 'desc',
    active: overrides.active ?? true,
    stock: overrides.stock ?? 10,
    pointsCost: overrides.pointsCost ?? 50,
    presaleUntil: overrides.presaleUntil ?? null,
    presaleTier: overrides.presaleTier ?? null,
  };
}

function makeService(opts: {
  balance?: number;
  item?: ReturnType<typeof makeCatalogItem>;
  items?: ReturnType<typeof makeCatalogItem>[];
  subscriptionTier?: TierLevel | null; // tier vindo do banco (assinatura ACTIVE); null = sem assinatura
} = {}) {
  const item = opts.item ?? makeCatalogItem();

  const txMock: any = {
    catalogItem: {
      findUnique: jest.fn().mockResolvedValue(item),
      findMany: jest.fn().mockResolvedValue(opts.items ?? [item]),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...item, ...data })),
    },
    subscription: {
      findUnique: jest.fn().mockResolvedValue(
        opts.subscriptionTier != null ? { tier: opts.subscriptionTier, status: 'ACTIVE' } : null,
      ),
    },
    pointsLedger: { create: jest.fn().mockResolvedValue({}) },
    voucher: {
      create: jest.fn().mockResolvedValue({
        id: 'v1', code: 'RLM-ABCDE', expiresAt: new Date(Date.now() + 60 * 86400000),
      }),
    },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
  };

  const prisma: any = {
    catalogItem: {
      findMany: jest.fn().mockResolvedValue(opts.items ?? [item]),
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'new-1', ...data })),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...item, ...data })),
    },
    $transaction: jest.fn().mockImplementation((fn) => fn(txMock, { isolationLevel: 'Serializable' })),
  };

  const pointsService: any = {
    getBalance: jest.fn().mockResolvedValue(opts.balance ?? 100),
  };

  const logger: any = { log: jest.fn() };
  const service = new RewardsService(prisma, pointsService);
  (service as any).logger = logger;
  return { service, prisma, txMock, pointsService };
}

// ── Presale visibility (getCatalog) ────────────────────────────────────────

describe('RewardsService.getCatalog — presale filtering', () => {
  const futureDate = new Date(Date.now() + 7 * 86400000); // +7 dias
  const pastDate = new Date(Date.now() - 86400000); // ontem

  it('sem tier: retorna todos os itens (sem filtro)', async () => {
    const plusItem = makeCatalogItem({ presaleUntil: futureDate, presaleTier: TierLevel.PLUS });
    const { service } = makeService({ items: [plusItem] });
    const result = await service.getCatalog(undefined);
    expect(result).toHaveLength(1);
  });

  it('CARE não vê item em pré-venda PLUS ativa', async () => {
    const plusItem = makeCatalogItem({ presaleUntil: futureDate, presaleTier: TierLevel.PLUS });
    const { service } = makeService({ items: [plusItem] });
    const result = await service.getCatalog(TierLevel.CARE);
    expect(result).toHaveLength(0);
  });

  it('PLUS vê item em pré-venda PLUS ativa', async () => {
    const plusItem = makeCatalogItem({ presaleUntil: futureDate, presaleTier: TierLevel.PLUS });
    const { service } = makeService({ items: [plusItem] });
    const result = await service.getCatalog(TierLevel.PLUS);
    expect(result).toHaveLength(1);
  });

  it('pré-venda expirada: item visível para todos', async () => {
    const expiredItem = makeCatalogItem({ presaleUntil: pastDate, presaleTier: TierLevel.PLUS });
    const { service } = makeService({ items: [expiredItem] });
    const result = await service.getCatalog(TierLevel.CARE);
    expect(result).toHaveLength(1);
  });

  it('CARE vê item em pré-venda CARE', async () => {
    const careItem = makeCatalogItem({ presaleUntil: futureDate, presaleTier: TierLevel.CARE });
    const { service } = makeService({ items: [careItem] });
    const result = await service.getCatalog(TierLevel.CARE);
    expect(result).toHaveLength(1);
  });
});

// ── Presale enforcement (redeemReward) ─────────────────────────────────────

describe('RewardsService.redeemReward — presale enforcement', () => {
  const futureDate = new Date(Date.now() + 7 * 86400000);

  it('CARE (tier do banco) não consegue resgatar item em pré-venda PLUS ativa', async () => {
    const plusItem = makeCatalogItem({ presaleUntil: futureDate, presaleTier: TierLevel.PLUS });
    const { service } = makeService({ item: plusItem, balance: 200, subscriptionTier: TierLevel.CARE });
    await expect(
      service.redeemReward({ customerId: 'c1', catalogItemId: 'item-1' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('sem assinatura ativa: tratado como CARE e bloqueado na pré-venda PLUS', async () => {
    const plusItem = makeCatalogItem({ presaleUntil: futureDate, presaleTier: TierLevel.PLUS });
    const { service } = makeService({ item: plusItem, balance: 200, subscriptionTier: null });
    await expect(
      service.redeemReward({ customerId: 'c1', catalogItemId: 'item-1' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('PLUS (tier do banco) consegue resgatar item em pré-venda PLUS ativa', async () => {
    const plusItem = makeCatalogItem({ presaleUntil: futureDate, presaleTier: TierLevel.PLUS });
    const { service } = makeService({ item: plusItem, balance: 200, subscriptionTier: TierLevel.PLUS });
    const result = await service.redeemReward({ customerId: 'c1', catalogItemId: 'item-1' });
    expect(result.voucherCode).toBeDefined();
  });

  it('qualquer tier pode resgatar após expirar a pré-venda', async () => {
    const pastDate = new Date(Date.now() - 86400000);
    const expiredItem = makeCatalogItem({ presaleUntil: pastDate, presaleTier: TierLevel.PLUS });
    const { service } = makeService({ item: expiredItem, balance: 200, subscriptionTier: TierLevel.CARE });
    const result = await service.redeemReward({ customerId: 'c1', catalogItemId: 'item-1' });
    expect(result.voucherCode).toBeDefined();
  });

  it('lança BadRequestException se saldo insuficiente', async () => {
    const { service } = makeService({ balance: 10, item: makeCatalogItem({ pointsCost: 50 }), subscriptionTier: TierLevel.PLUS });
    await expect(
      service.redeemReward({ customerId: 'c1', catalogItemId: 'item-1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('RewardsService.createVoucherManual', () => {
  it('cria voucher com sucesso debitando pontos do cliente', async () => {
    const item = makeCatalogItem({ pointsCost: 50, stock: 10 });
    const { service, txMock } = makeService({ item, balance: 100 });
    txMock.customer = {
      findUnique: jest.fn().mockResolvedValue({ id: 'c1', fullName: 'John Doe' }),
    };

    const result = await service.createVoucherManual({
      customerId: 'c1',
      catalogItemId: 'item-1',
      debitPoints: true,
      expirationDays: 30,
      requesterUserId: 'admin-1',
    });

    expect(result.voucherCode).toBeDefined();
    expect(txMock.catalogItem.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'item-1' },
      data: { stock: 9 },
    }));
    expect(txMock.pointsLedger.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        amount: -50,
        transactionType: PointTxType.REDEEM,
      }),
    }));
  });

  it('cria voucher com sucesso como cortesia (sem debitar pontos)', async () => {
    const item = makeCatalogItem({ pointsCost: 50, stock: 10 });
    const { service, txMock } = makeService({ item, balance: 10 });
    txMock.customer = {
      findUnique: jest.fn().mockResolvedValue({ id: 'c1', fullName: 'John Doe' }),
    };

    const result = await service.createVoucherManual({
      customerId: 'c1',
      catalogItemId: 'item-1',
      debitPoints: false,
      expirationDays: 90,
      requesterUserId: 'admin-1',
    });

    expect(result.voucherCode).toBeDefined();
    expect(txMock.pointsLedger.create).not.toHaveBeenCalled();
    expect(txMock.catalogItem.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'item-1' },
      data: { stock: 9 },
    }));
  });

  it('lança erro se o item do catálogo estiver fora de estoque', async () => {
    const item = makeCatalogItem({ pointsCost: 50, stock: 0 });
    const { service, txMock } = makeService({ item });
    txMock.customer = {
      findUnique: jest.fn().mockResolvedValue({ id: 'c1', fullName: 'John Doe' }),
    };

    await expect(
      service.createVoucherManual({
        customerId: 'c1',
        catalogItemId: 'item-1',
        debitPoints: false,
        expirationDays: 60,
        requesterUserId: 'admin-1',
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lança erro se debito de pontos for solicitado e o saldo for insuficiente', async () => {
    const item = makeCatalogItem({ pointsCost: 50, stock: 10 });
    const { service, txMock } = makeService({ item, balance: 20 });
    txMock.customer = {
      findUnique: jest.fn().mockResolvedValue({ id: 'c1', fullName: 'John Doe' }),
    };

    await expect(
      service.createVoucherManual({
        customerId: 'c1',
        catalogItemId: 'item-1',
        debitPoints: true,
        expirationDays: 60,
        requesterUserId: 'admin-1',
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
