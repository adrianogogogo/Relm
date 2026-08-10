/// <reference types="jest" />
import { ReportsService } from './reports.service';

// ─── helpers (espelham points.service.spec.ts) ────────────────────────────────

function earn(
  customerId: string,
  amount: number,
  ageDays: number,
  expiryDays = 365,
) {
  const created = new Date(Date.now() - ageDays * 86400000);
  return {
    customerId,
    transactionType: 'EARN',
    amount,
    createdAt: created,
    expiresAt: new Date(created.getTime() + expiryDays * 86400000),
  };
}

function redeem(customerId: string, amount: number) {
  return {
    customerId,
    transactionType: 'REDEEM',
    amount: -amount,
    createdAt: new Date(),
    expiresAt: null,
  };
}

function makeService(overrides: Partial<Record<string, any>> = {}) {
  const prisma: any = {
    warrantyClaim: {
      groupBy: jest.fn().mockResolvedValue([]),
      findMany: jest.fn().mockResolvedValue([]),
    },
    customer: { count: jest.fn().mockResolvedValue(0) },
    store: { count: jest.fn().mockResolvedValue(0) },
    event: { count: jest.fn().mockResolvedValue(0) },
    insuranceQuote: { count: jest.fn().mockResolvedValue(0) },
    clubSettings: {
      findUnique: jest.fn().mockResolvedValue({ key: 'point_value_brl', value: '0.10' }),
    },
    pointsLedger: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    payment: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    subscription: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
    },
    referral: { count: jest.fn().mockResolvedValue(0) },
    ...overrides,
  };
  return new ReportsService(prisma);
}

// ─── getStoreScores ───────────────────────────────────────────────────────────

/** Prisma mockado só com o que o score consulta. */
function makeScoreService(opts: {
  stores?: { id: string; tradeName: string }[];
  sales?: any[];
  newCustomers?: any[];
  customers?: any[];
  plus?: any[];
  services?: any[];
  weights?: { key: string; value: string }[];
}) {
  const groupBy = jest
    .fn()
    .mockResolvedValueOnce(opts.newCustomers ?? [])
    .mockResolvedValueOnce(opts.customers ?? [])
    .mockResolvedValueOnce(opts.plus ?? []);

  return makeService({
    store: { findMany: jest.fn().mockResolvedValue(opts.stores ?? []) },
    clubSettings: { findMany: jest.fn().mockResolvedValue(opts.weights ?? []) },
    sale: { findMany: jest.fn().mockResolvedValue(opts.sales ?? []) },
    customer: { groupBy },
    serviceOrder: { groupBy: jest.fn().mockResolvedValue(opts.services ?? []) },
  });
}

describe('ReportsService.getStoreScores', () => {
  it('sem lojas ativas devolve lista vazia sem estourar', async () => {
    const result = await makeScoreService({}).getStoreScores();
    expect(result.stores).toEqual([]);
    expect(result.weights).toEqual({
      revenue: 40,
      newCustomers: 20,
      plusConversion: 25,
      services: 15,
    });
  });

  it('score é a soma exata dos componentes exibidos', async () => {
    const result = await makeScoreService({
      stores: [{ id: 'a', tradeName: 'Loja A' }],
      sales: [{ storeId: 'a', items: [{ quantity: 2, unitPrice: 100 }] }],
      newCustomers: [{ storeId: 'a', _count: 5 }],
      customers: [{ storeId: 'a', _count: 10 }],
      plus: [{ storeId: 'a', _count: 5 }],
      services: [{ storeId: 'a', _count: 3 }],
    }).getStoreScores();

    const [loja] = result.stores;
    expect(loja.metrics.revenueBrl).toBe(200);
    expect(loja.metrics.plusConversion).toBe(0.5);
    const soma = +Object.values(loja.components)
      .reduce((s, c) => s + c, 0)
      .toFixed(1);
    expect(loja.score).toBe(soma);
    // Única loja: 100% do volume, metade da conversão → 100 − 25/2 = 87,5.
    expect(loja.score).toBe(87.5);
  });

  it('ordena por score e normaliza volume pela melhor loja', async () => {
    const result = await makeScoreService({
      stores: [
        { id: 'a', tradeName: 'Fraca' },
        { id: 'b', tradeName: 'Forte' },
      ],
      sales: [
        { storeId: 'a', items: [{ quantity: 1, unitPrice: 100 }] },
        { storeId: 'b', items: [{ quantity: 1, unitPrice: 400 }] },
      ],
      customers: [
        { storeId: 'a', _count: 4 },
        { storeId: 'b', _count: 4 },
      ],
    }).getStoreScores();

    expect(result.stores.map((s) => s.tradeName)).toEqual(['Forte', 'Fraca']);
    // Melhor receita = 100% do peso de receita; a outra fica em 1/4 disso.
    expect(result.stores[0].components.revenue).toBe(40);
    expect(result.stores[1].components.revenue).toBe(10);
  });

  it('peso do ClubSettings sobrescreve o default e o teto segue 100', async () => {
    const result = await makeScoreService({
      stores: [{ id: 'a', tradeName: 'Loja A' }],
      sales: [{ storeId: 'a', items: [{ quantity: 1, unitPrice: 50 }] }],
      newCustomers: [{ storeId: 'a', _count: 1 }],
      customers: [{ storeId: 'a', _count: 2 }],
      plus: [{ storeId: 'a', _count: 2 }],
      services: [{ storeId: 'a', _count: 1 }],
      weights: [{ key: 'score_weight_revenue', value: '10' }],
    }).getStoreScores();

    expect(result.weights.revenue).toBe(10);
    // Tudo no máximo (conversão 100%) → 100, independente da soma dos pesos.
    expect(result.stores[0].score).toBe(100);
  });

  it('divisão por zero não vira NaN quando ninguém vendeu', async () => {
    const result = await makeScoreService({
      stores: [{ id: 'a', tradeName: 'Loja A' }],
    }).getStoreScores();
    expect(result.stores[0].score).toBe(0);
    expect(Number.isNaN(result.stores[0].components.revenue)).toBe(false);
  });
});

// ─── getClubPointsLiability ───────────────────────────────────────────────────

describe('ReportsService.getClubPointsLiability', () => {
  it('retorna passivo zero quando não há ledger', async () => {
    const svc = makeService();
    const result = await svc.getClubPointsLiability();
    expect(result.totalActivePoints).toBe(0);
    expect(result.liabilityBrl).toBe(0);
  });

  it('computa passivo com um único cliente sem expiração', async () => {
    const rows = [earn('c1', 100, 10)];
    const svc = makeService({
      pointsLedger: { findMany: jest.fn().mockResolvedValue(rows) },
    });
    const result = await svc.getClubPointsLiability();
    // 100 pts × R$ 0,10 = R$ 10,00
    expect(result.totalActivePoints).toBe(100);
    expect(result.liabilityBrl).toBeCloseTo(10, 2);
  });

  it('exclui pontos expirados (FIFO) ao calcular o passivo', async () => {
    // Lote 'a' venceu (400 dias, validade 365); lote 'b' ainda válido (10 dias)
    const rows = [earn('c1', 200, 400), earn('c1', 80, 10)];
    const svc = makeService({
      pointsLedger: { findMany: jest.fn().mockResolvedValue(rows) },
    });
    const result = await svc.getClubPointsLiability();
    // Somente 80 pts ativos × R$ 0,10 = R$ 8,00
    expect(result.totalActivePoints).toBe(80);
    expect(result.liabilityBrl).toBeCloseTo(8, 2);
  });

  it('agrega corretamente múltiplos clientes', async () => {
    const rows = [
      earn('c1', 100, 10), // c1: 100 ativos
      earn('c2', 200, 400), // c2: expirado → 0
      earn('c2', 50, 5),    // c2: 50 ativos
      redeem('c1', 40),      // c1: 100 − 40 = 60
    ];
    const svc = makeService({
      pointsLedger: { findMany: jest.fn().mockResolvedValue(rows) },
    });
    const result = await svc.getClubPointsLiability();
    // c1: 60 + c2: 50 = 110 pts × R$ 0,10 = R$ 11,00
    expect(result.totalActivePoints).toBe(110);
    expect(result.liabilityBrl).toBeCloseTo(11, 2);
  });

  it('usa point_value_brl da ClubSettings', async () => {
    const rows = [earn('c1', 1000, 10)];
    const svc = makeService({
      pointsLedger: { findMany: jest.fn().mockResolvedValue(rows) },
      clubSettings: {
        findUnique: jest.fn().mockResolvedValue({ key: 'point_value_brl', value: '0.05' }),
      },
    });
    const result = await svc.getClubPointsLiability();
    expect(result.liabilityBrl).toBeCloseTo(50, 2);
  });

  it('retorna liabilityBrl = 0 quando ClubSettings não tem a chave', async () => {
    const rows = [earn('c1', 500, 10)];
    const svc = makeService({
      pointsLedger: { findMany: jest.fn().mockResolvedValue(rows) },
      clubSettings: { findUnique: jest.fn().mockResolvedValue(null) },
    });
    const result = await svc.getClubPointsLiability();
    expect(result.pointValueBrl).toBe(0);
    expect(result.liabilityBrl).toBe(0);
  });
});

// ─── getClubRevenue ───────────────────────────────────────────────────────────

describe('ReportsService.getClubRevenue', () => {
  it('retorna zeros quando não há pagamentos', async () => {
    const svc = makeService();
    const result = await svc.getClubRevenue();
    expect(result.totalRevenueLast12mo).toBe(0);
    expect(result.mrrEquivalent).toBe(0);
    expect(result.monthlyRevenue).toHaveLength(12);
  });

  it('agrega pagamentos no mês correto', async () => {
    const now = new Date();
    const payments = [
      { amount: 150, paidAt: now },
      { amount: 150, paidAt: now },
    ];
    const svc = makeService({
      payment: {
        findMany: jest.fn().mockResolvedValue(payments),
        findFirst: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(0),
      },
    });
    const result = await svc.getClubRevenue();
    expect(result.totalRevenueLast12mo).toBeCloseTo(300, 2);
    expect(result.mrrEquivalent).toBeCloseTo(25, 2); // 300/12
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthEntry = result.monthlyRevenue.find((m) => m.month === currentMonth);
    expect(monthEntry?.paymentCount).toBe(2);
    expect(monthEntry?.totalBrl).toBeCloseTo(300, 2);
  });

  it('renewalRate e churnRate são null quando não há expirados', async () => {
    const svc = makeService({
      subscription: {
        count: jest.fn().mockResolvedValue(5),
        findMany: jest.fn().mockResolvedValue([]),
      },
    });
    const result = await svc.getClubRevenue();
    expect(result.renewalRate).toBeNull();
    expect(result.churnRate).toBeNull();
    expect(result.expiredPlusLast12mo).toBe(0);
  });

  it('calcula renovação corretamente', async () => {
    const expiredAt = new Date(Date.now() - 15 * 86400000); // expirou há 15 dias
    const svc = makeService({
      subscription: {
        count: jest.fn().mockResolvedValue(10),
        findMany: jest
          .fn()
          .mockResolvedValue([
            { customerId: 'c1', expiresAt: expiredAt },
            { customerId: 'c2', expiresAt: expiredAt },
          ]),
      },
      payment: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        // c1 renovou, c2 não
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({ id: 'p1' })
          .mockResolvedValueOnce(null),
      },
    });
    const result = await svc.getClubRevenue();
    expect(result.renewedCount).toBe(1);
    expect(result.churnCount).toBe(1);
    expect(result.renewalRate).toBe(50);
    expect(result.churnRate).toBe(50);
  });
});
