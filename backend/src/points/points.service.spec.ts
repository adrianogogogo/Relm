/// <reference types="jest" />
import { PointsService } from './points.service';
import { CronHealthService } from '../common/cron-health.service';

// Rows helper — só os campos que computeState lê.
function earn(id: string, amount: number, ageDays: number, expiryDays = 365, isExpired = false) {
  const created = new Date(Date.now() - ageDays * 86400000);
  return {
    id,
    transactionType: 'EARN',
    amount,
    createdAt: created,
    expiresAt: new Date(created.getTime() + expiryDays * 86400000),
    isExpired,
  };
}
function redeem(amount: number) {
  return { id: 'r' + amount, transactionType: 'REDEEM', amount: -amount, createdAt: new Date(), expiresAt: null, isExpired: false };
}

function makeService(rows: any[], opts: { monthlyPoints?: number; tier?: string; spentThisMonth?: number } = {}) {
  const prisma: any = {
    pointsLedger: {
      findMany: jest.fn().mockResolvedValue(rows),
      aggregate: jest.fn().mockResolvedValue({ _sum: { amount: -(opts.spentThisMonth ?? 0) } }),
      create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'new', ...data })),
    },
    subscription: {
      findUnique: jest.fn().mockResolvedValue(opts.tier ? { tier: opts.tier } : null),
    },
  };
  const clubSettings: any = {
    resolveEntitlements: jest.fn().mockResolvedValue({
      pointsMultiplier: 2,
      monthlyPoints: opts.monthlyPoints ?? 0,
    }),
  };
  return new PointsService(prisma, new CronHealthService(), clubSettings);
}

describe('PointsService.getBalance (FIFO + expiração)', () => {
  it('soma EARN, subtrai REDEEM', async () => {
    const svc = makeService([earn('a', 100, 10), redeem(30)]);
    expect(await svc.getBalance('c1')).toBe(70);
  });

  it('exclui lotes vencidos mesmo sem transação EXPIRE materializada', async () => {
    // Lote 'a' venceu (idade 400d, validade 365d); lote 'b' ainda vale.
    const svc = makeService([earn('a', 100, 400), earn('b', 50, 10)]);
    expect(await svc.getBalance('c1')).toBe(50);
  });

  it('FIFO: resgate consome o lote mais antigo primeiro, poupando-o da expiração', async () => {
    // 'a' (200) vence hoje; resgate de 200 já o consumiu → nada expira, sobra 'b'.
    const svc = makeService([earn('a', 200, 400), earn('b', 80, 10), redeem(200)]);
    expect(await svc.getBalance('c1')).toBe(80);
  });

  it('saldo nunca fica negativo', async () => {
    const svc = makeService([earn('a', 100, 400), redeem(100)]);
    expect(await svc.getBalance('c1')).toBe(0);
  });
});

describe('PointsService — bucket MENSAL (derivado, uso-ou-perde)', () => {
  it('Care não tem saldo mensal', async () => {
    const svc = makeService([], { monthlyPoints: 0 });
    expect(await svc.getMonthlyBalance('c1')).toBe(0);
  });

  it('Plus sem consumo no mês tem a cota cheia', async () => {
    const svc = makeService([], { tier: 'PLUS', monthlyPoints: 1000 });
    expect(await svc.getMonthlyBalance('c1')).toBe(1000);
  });

  it('desconta o que já foi consumido no mês corrente', async () => {
    const svc = makeService([], { tier: 'PLUS', monthlyPoints: 1000, spentThisMonth: 300 });
    expect(await svc.getMonthlyBalance('c1')).toBe(700);
  });

  it('saldo mensal nunca fica negativo, mesmo se a cota for reduzida abaixo do já gasto', async () => {
    const svc = makeService([], { tier: 'PLUS', monthlyPoints: 200, spentThisMonth: 500 });
    expect(await svc.getMonthlyBalance('c1')).toBe(0);
  });

  it('resgate mensal NÃO abate o saldo acumulável — o bug que o bucket existe para evitar', async () => {
    // 100 acumuláveis intactos; o gasto do mês saiu do bucket MENSAL.
    const svc = makeService([earn('a', 100, 10)], {
      tier: 'PLUS',
      monthlyPoints: 1000,
      spentThisMonth: 300,
    });
    expect(await svc.getBalance('c1')).toBe(100);
    expect(await svc.getMonthlyBalance('c1')).toBe(700);
  });
});

describe('PointsService.redeemPoints (ordem de consumo)', () => {
  it('gasta o mensal primeiro, porque ele vence na virada do mês', async () => {
    const svc = makeService([earn('a', 500, 10)], { tier: 'PLUS', monthlyPoints: 1000 });
    expect(await svc.redeemPoints('c1', 400, 'lavagem')).toEqual({
      fromMonthly: 400,
      fromAccumulated: 0,
    });
  });

  it('transborda para o acumulável quando o mensal não cobre', async () => {
    const svc = makeService([earn('a', 500, 10)], {
      tier: 'PLUS',
      monthlyPoints: 1000,
      spentThisMonth: 900,
    });
    // Restam 100 mensais; resgate de 350 puxa 250 do acumulável.
    expect(await svc.redeemPoints('c1', 350, 'resgate')).toEqual({
      fromMonthly: 100,
      fromAccumulated: 250,
    });
  });

  it('recusa quando a soma dos dois saldos não cobre', async () => {
    const svc = makeService([earn('a', 50, 10)], { tier: 'PLUS', monthlyPoints: 100 });
    await expect(svc.redeemPoints('c1', 200, 'caro demais')).rejects.toThrow(
      'Saldo de pontos insuficiente',
    );
  });
});

// ── Step 3: regra de pontuação por produto/categoria ───────────────────────

// Builder próprio: aqui o `aggregate` responde "quanto este item já creditou",
// não "quanto se gastou do bucket mensal" como no helper do topo.
function makeRuleService(opts: {
  productRule?: any;
  categoryRule?: any;
  productType?: string | null;
  alreadyCredited?: number;
  multiplier?: number;
} = {}) {
  const prisma: any = {
    pointsRule: {
      // findFirst é chamado 1x para a regra do produto e, se não achar, 1x
      // para a da categoria. A ordem das respostas é a precedência sob teste.
      findFirst: jest
        .fn()
        .mockResolvedValueOnce(opts.productRule ?? null)
        .mockResolvedValueOnce(opts.categoryRule ?? null),
    },
    product: {
      findUnique: jest.fn().mockResolvedValue({ productType: opts.productType ?? null }),
    },
    subscription: { findUnique: jest.fn().mockResolvedValue(null) },
    pointsLedger: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { amount: opts.alreadyCredited ?? 0 } }),
      create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'new', ...data })),
    },
  };
  const clubSettings: any = {
    resolveEntitlements: jest.fn().mockResolvedValue({
      pointsMultiplier: opts.multiplier ?? 1,
      monthlyPoints: 0,
    }),
  };
  return { svc: new PointsService(prisma, new CronHealthService(), clubSettings), prisma };
}

describe('PointsService.pointsForSaleItem — precedência da regra', () => {
  const item = { productId: 'p1', unitPrice: 500, quantity: 2 };

  it('regra do produto vence a da categoria', async () => {
    const { svc } = makeRuleService({
      productRule: { mode: 'FIXO', value: 300 },
      categoryRule: { mode: 'FIXO', value: 10 },
      productType: 'Road',
    });
    // FIXO é por unidade: 300 × 2.
    expect(await svc.pointsForSaleItem(item, 'CARE' as any)).toBe(600);
  });

  it('sem regra do produto, cai na regra da categoria', async () => {
    const { svc } = makeRuleService({
      categoryRule: { mode: 'POR_REAL', value: 0.5 },
      productType: 'Road',
      multiplier: 99, // não deve ser usado
    });
    // POR_REAL é sobre o subtotal: 500 × 2 × 0,5.
    expect(await svc.pointsForSaleItem(item, 'CARE' as any)).toBe(500);
  });

  it('sem regra nenhuma, cai no multiplicador do tier — comportamento antigo', async () => {
    const { svc } = makeRuleService({ productType: 'Road', multiplier: 2 });
    expect(await svc.pointsForSaleItem(item, 'CARE' as any)).toBe(2000);
  });

  // Estado normal no registro da venda: a loja digitou o nome comercial e a
  // curadoria ainda não vinculou produto nenhum.
  it('item sem productId nem consulta regra — vai direto no multiplicador', async () => {
    const { svc, prisma } = makeRuleService({ multiplier: 3 });
    expect(await svc.pointsForSaleItem({ unitPrice: 100, quantity: 1 }, 'CARE' as any)).toBe(300);
    expect(prisma.pointsRule.findFirst).not.toHaveBeenCalled();
  });

  it('quantity ausente conta como 1', async () => {
    const { svc } = makeRuleService({ multiplier: 1 });
    expect(await svc.pointsForSaleItem({ unitPrice: 250 }, 'CARE' as any)).toBe(250);
  });
});

describe('PointsService.syncSaleItemPoints — crédito só para cima', () => {
  const item = { productId: 'p1', unitPrice: 500, quantity: 1 };

  it('primeiro crédito lança o valor cheio', async () => {
    const { svc, prisma } = makeRuleService({
      productRule: { mode: 'FIXO', value: 800 },
      alreadyCredited: 0,
    });

    await svc.syncSaleItemPoints('c1', 'item-1', item, 'Compra: Roda');

    expect(prisma.pointsLedger.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ amount: 800, referenceId: 'item-1' }) }),
    );
  });

  it('curadoria credita só a diferença, não o valor cheio de novo', async () => {
    const { svc, prisma } = makeRuleService({
      productRule: { mode: 'FIXO', value: 800 },
      alreadyCredited: 500, // já tinha pontuado pelo multiplicador no registro
    });

    await svc.syncSaleItemPoints('c1', 'item-1', item, 'Curadoria');

    expect(prisma.pointsLedger.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ amount: 300 }) }),
    );
  });

  // O motivo de a regra ser "só para cima": reclassificar um produto para uma
  // regra mais pobre não pode tirar ponto que o cliente já viu no extrato.
  it('regra nova rende MENOS que o já creditado: nada acontece, sem estorno', async () => {
    const { svc, prisma } = makeRuleService({
      productRule: { mode: 'FIXO', value: 100 },
      alreadyCredited: 500,
    });

    expect(await svc.syncSaleItemPoints('c1', 'item-1', item, 'Curadoria')).toBeNull();
    expect(prisma.pointsLedger.create).not.toHaveBeenCalled();
  });

  it('reexecução com o mesmo valor é no-op — o crédito é idempotente', async () => {
    const { svc, prisma } = makeRuleService({
      productRule: { mode: 'FIXO', value: 800 },
      alreadyCredited: 800,
    });

    expect(await svc.syncSaleItemPoints('c1', 'item-1', item, 'Compra: Roda')).toBeNull();
    expect(prisma.pointsLedger.create).not.toHaveBeenCalled();
  });
});

describe('PointsService.createPointsRule — alvo exclusivo', () => {
  function makeCrud() {
    const prisma: any = {
      product: { findUnique: jest.fn().mockResolvedValue({ id: 'p1' }) },
      pointsRule: { create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve(data)) },
    };
    return {
      svc: new PointsService(prisma, new CronHealthService(), {} as any),
      prisma,
    };
  }

  it('recusa regra com produto E categoria — precedência ficaria ambígua', async () => {
    const { svc } = makeCrud();
    await expect(
      svc.createPointsRule({ productId: 'p1', productType: 'Road', mode: 'FIXO' as any, value: 10 }),
    ).rejects.toThrow('exatamente um');
  });

  it('recusa regra sem alvo nenhum — seria inerte', async () => {
    const { svc } = makeCrud();
    await expect(
      svc.createPointsRule({ mode: 'FIXO' as any, value: 10 }),
    ).rejects.toThrow('exatamente um');
  });

  it('recusa productId inexistente', async () => {
    const { svc, prisma } = makeCrud();
    prisma.product.findUnique.mockResolvedValue(null);
    await expect(
      svc.createPointsRule({ productId: 'p-nao-existe', mode: 'FIXO' as any, value: 10 }),
    ).rejects.toThrow('Produto não encontrado');
  });

  it('aceita regra só de categoria', async () => {
    const { svc, prisma } = makeCrud();
    await svc.createPointsRule({ productType: 'Road', mode: 'POR_REAL' as any, value: 0.5 });
    expect(prisma.pointsRule.create).toHaveBeenCalled();
  });
});
