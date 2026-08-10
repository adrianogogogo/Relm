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
