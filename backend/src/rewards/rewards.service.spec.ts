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

  // O service passou a ler point_value_brl (equivalente em R$ do resgate de
  // serviço) e voucher_validity_days, que antes vivia hardcoded em 60.
  const clubSettings: any = {
    getSettings: jest.fn().mockResolvedValue({
      pointValueBrl: 0.05,
      voucherValidityDays: 60,
    }),
  };

  const logger: any = { log: jest.fn() };
  const service = new RewardsService(prisma, pointsService, clubSettings);
  (service as any).logger = logger;
  return { service, prisma, txMock, pointsService, clubSettings };
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

// ── Step 4: resgate de serviço com pontos ─────────────────────────────────

function makeServiceRedeemer(opts: {
  storeService?: any;
  balance?: number;
} = {}) {
  const storeService = opts.storeService === undefined
    ? {
        id: 'ss-1', storeId: 'loja-A', active: true, pointsCost: 800,
        customName: null, masterService: { name: 'Lavagem Completa' },
      }
    : opts.storeService;

  const txMock: any = {
    storeService: { findUnique: jest.fn().mockResolvedValue(storeService) },
    voucher: {
      create: jest.fn().mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'v1', ...data })),
    },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
  };
  const prisma: any = {
    $transaction: jest.fn().mockImplementation((fn) => fn(txMock, {})),
  };
  const total = opts.balance ?? 1000;
  const pointsService: any = {
    getBalances: jest.fn().mockResolvedValue({ accumulated: total, monthly: 0, total }),
    redeemPoints: jest.fn().mockResolvedValue({ fromMonthly: 0, fromAccumulated: 0 }),
  };
  const clubSettings: any = {
    getSettings: jest.fn().mockResolvedValue({ pointValueBrl: 0.05, voucherValidityDays: 30 }),
  };
  const service = new RewardsService(prisma, pointsService, clubSettings);
  (service as any).logger = { log: jest.fn() };
  return { service, txMock, pointsService };
}

describe('RewardsService.redeemService', () => {
  it('debita pontos e emite voucher amarrado ao serviço da loja', async () => {
    const { service, txMock, pointsService } = makeServiceRedeemer();

    const result = await service.redeemService({ customerId: 'c1', storeServiceId: 'ss-1' });

    expect(result.voucherCode).toMatch(/^RLM-/);
    expect(pointsService.redeemPoints).toHaveBeenCalledWith(
      'c1', 800, expect.stringContaining('Lavagem Completa'), 'ss-1', txMock,
    );
    const { data } = txMock.voucher.create.mock.calls[0][0];
    expect(data.storeServiceId).toBe('ss-1');
    expect(data.catalogItemId).toBeUndefined();
  });

  // O acerto com a loja é offline e posterior: se o R$ fosse recalculado na
  // hora do repasse, uma mudança de point_value_brl reescreveria o passado.
  it('congela pontos e equivalente em R$ no voucher', async () => {
    const { service, txMock } = makeServiceRedeemer();

    await service.redeemService({ customerId: 'c1', storeServiceId: 'ss-1' });

    const { data } = txMock.voucher.create.mock.calls[0][0];
    expect(data.pointsSpent).toBe(800);
    expect(Number(data.brlValue)).toBeCloseTo(40); // 800 × 0,05
  });

  it('usa voucher_validity_days do ClubSettings, não os 60 dias hardcoded', async () => {
    const { service, txMock } = makeServiceRedeemer();

    await service.redeemService({ customerId: 'c1', storeServiceId: 'ss-1' });

    const { data } = txMock.voucher.create.mock.calls[0][0];
    const dias = Math.round((data.expiresAt.getTime() - Date.now()) / 86400000);
    expect(dias).toBe(30);
  });

  it('recusa serviço sem pointsCost — ausência do custo é o opt-out', async () => {
    const { service } = makeServiceRedeemer({
      storeService: { id: 'ss-1', storeId: 'loja-A', active: true, pointsCost: null, masterService: { name: 'X' } },
    });
    await expect(
      service.redeemService({ customerId: 'c1', storeServiceId: 'ss-1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('recusa serviço inativo', async () => {
    const { service } = makeServiceRedeemer({
      storeService: { id: 'ss-1', storeId: 'loja-A', active: false, pointsCost: 100, masterService: { name: 'X' } },
    });
    await expect(
      service.redeemService({ customerId: 'c1', storeServiceId: 'ss-1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('recusa quando o saldo total não cobre', async () => {
    const { service, pointsService } = makeServiceRedeemer({ balance: 100 });
    await expect(
      service.redeemService({ customerId: 'c1', storeServiceId: 'ss-1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(pointsService.redeemPoints).not.toHaveBeenCalled();
  });
});

describe('RewardsService.useVoucher — escopo da loja', () => {
  function makeUser(voucher: any, user: any = { storeId: 'loja-A' }) {
    const prisma: any = {
      voucher: {
        findUnique: jest.fn().mockResolvedValue(voucher),
        update: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ ...voucher, ...data })),
      },
      user: { findUnique: jest.fn().mockResolvedValue(user) },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const service = new RewardsService(prisma, {} as any, {} as any);
    (service as any).logger = { log: jest.fn() };
    return { service, prisma };
  }

  const futuro = new Date(Date.now() + 86400000);

  it('loja baixa voucher de serviço da própria loja', async () => {
    const { service, prisma } = makeUser({
      id: 'v1', code: 'RLM-AAAAA', status: 'UNUSED', expiresAt: futuro,
      storeService: { storeId: 'loja-A' },
    });

    await service.useVoucher('RLM-AAAAA', { userId: 'u1', role: 'LOJA' });

    expect(prisma.voucher.update).toHaveBeenCalled();
  });

  // Sem isso, qualquer loja daria baixa em voucher de qualquer outra —
  // e o acerto financeiro sairia para a loja errada.
  it('loja NÃO baixa voucher de serviço de outra loja', async () => {
    const { service } = makeUser({
      id: 'v1', code: 'RLM-AAAAA', status: 'UNUSED', expiresAt: futuro,
      storeService: { storeId: 'loja-B' },
    });

    await expect(
      service.useVoucher('RLM-AAAAA', { userId: 'u1', role: 'LOJA' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  // Prêmio físico não passa pela loja: não tem storeService, logo não tem dono.
  it('loja NÃO baixa voucher de catálogo', async () => {
    const { service } = makeUser({
      id: 'v1', code: 'RLM-AAAAA', status: 'UNUSED', expiresAt: futuro,
      storeService: null, catalogItemId: 'item-1',
    });

    await expect(
      service.useVoucher('RLM-AAAAA', { userId: 'u1', role: 'LOJA' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('admin baixa qualquer voucher, inclusive de catálogo', async () => {
    const { service, prisma } = makeUser({
      id: 'v1', code: 'RLM-AAAAA', status: 'UNUSED', expiresAt: futuro,
      storeService: null, catalogItemId: 'item-1',
    });

    await service.useVoucher('RLM-AAAAA', { userId: 'u1', role: 'ADMIN_RELM' });

    expect(prisma.voucher.update).toHaveBeenCalled();
  });

  it('grava usedAt na baixa — sem ele não há como fechar o acerto por período', async () => {
    const { service, prisma } = makeUser({
      id: 'v1', code: 'RLM-AAAAA', status: 'UNUSED', expiresAt: futuro,
      storeService: { storeId: 'loja-A' },
    });

    await service.useVoucher('RLM-AAAAA', { userId: 'u1', role: 'LOJA' });

    const { data } = prisma.voucher.update.mock.calls[0][0];
    expect(data.usedAt).toBeInstanceOf(Date);
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
