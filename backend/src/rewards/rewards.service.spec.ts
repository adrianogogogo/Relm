/// <reference types="jest" />
import { RewardsService } from './rewards.service';
import { RewardsController } from './rewards.controller';
import { TierLevel, VoucherStatus, Prisma } from '@prisma/client';
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
  balance?: number; // saldo TOTAL do cliente (mensal + acumulável)
  monthly?: number; // quanto do total vem do bucket mensal
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

  // O resgate passou a consultar o saldo TOTAL e a debitar via redeemPoints
  // (que gasta o mensal primeiro), em vez de escrever no ledger direto.
  const total = opts.balance ?? 100;
  const monthly = opts.monthly ?? 0;
  const pointsService: any = {
    getBalance: jest.fn().mockResolvedValue(total - monthly),
    getBalances: jest.fn().mockResolvedValue({
      accumulated: total - monthly,
      monthly,
      total,
    }),
    redeemPoints: jest.fn().mockResolvedValue({ fromMonthly: 0, fromAccumulated: 0 }),
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

  // Decisão do Adriano (10/08/2026): ponto mensal vale para QUALQUER resgate,
  // não só serviço. Antes deste teste o cliente abaixo era recusado — o saldo
  // mensal não entrava na conta e o débito ia inteiro no acumulável.
  it('pontos mensais contam para o prêmio e são debitados antes do acumulável', async () => {
    const item = makeCatalogItem({ pointsCost: 50 });
    // 30 acumuláveis + 40 mensais: só passa se o mensal contar.
    const { service, pointsService, txMock } = makeService({
      item, balance: 70, monthly: 40, subscriptionTier: TierLevel.PLUS,
    });

    const result = await service.redeemReward({ customerId: 'c1', catalogItemId: 'item-1' });

    expect(result.voucherCode).toBeDefined();
    expect(pointsService.redeemPoints).toHaveBeenCalledWith(
      'c1', 50, expect.stringContaining('Resgate de Recompensa'), 'item-1', txMock,
    );
    expect(txMock.pointsLedger.create).not.toHaveBeenCalled();
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
    const { service, txMock, pointsService } = makeService({ item, balance: 100 });
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
    // Via redeemPoints, não escrita direta no ledger: é o que faz o débito
    // sair do bucket mensal antes do acumulável.
    expect(pointsService.redeemPoints).toHaveBeenCalledWith(
      'c1', 50, expect.stringContaining('Resgate Manual'), 'item-1', txMock,
    );
    expect(txMock.pointsLedger.create).not.toHaveBeenCalled();
  });

  it('cria voucher com sucesso como cortesia (sem debitar pontos)', async () => {
    const item = makeCatalogItem({ pointsCost: 50, stock: 10 });
    const { service, txMock, pointsService } = makeService({ item, balance: 10 });
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
    expect(pointsService.redeemPoints).not.toHaveBeenCalled();
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

// ── RewardsController — identidade do cliente vem do token, não do body/URL ──
// Estes dois testes travam o IDOR: se passarem com a implementação antiga
// (customerId lido do body/URL), o teste está errado.

describe('RewardsController — IDOR guard', () => {
  function makeController() {
    const rewardsService: any = {
      redeemReward: jest.fn().mockResolvedValue({ success: true, voucherCode: 'RLM-ABCDE' }),
      getVouchers: jest.fn().mockResolvedValue([]),
    };
    const controller = new RewardsController(rewardsService);
    return { controller, rewardsService };
  }

  it('redeemReward usa o customerId do token, ignorando o do body', async () => {
    const { controller, rewardsService } = makeController();
    const req = { user: { customerId: 'cli-token' } };
    const dto = { customerId: 'cli-VITIMA', catalogItemId: 'item1' };

    await controller.redeemReward(req, dto);

    expect(rewardsService.redeemReward).toHaveBeenCalledWith({
      customerId: 'cli-token',
      catalogItemId: 'item1',
    });
  });

  it('getVouchers ignora o :customerId da URL e usa o do token', async () => {
    const { controller, rewardsService } = makeController();
    const req = { user: { customerId: 'cli-token' } };

    await controller.getVouchers(req, 'cli-VITIMA');

    expect(rewardsService.getVouchers).toHaveBeenCalledWith('cli-token');
  });
});
