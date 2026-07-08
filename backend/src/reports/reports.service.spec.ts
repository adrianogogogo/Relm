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
