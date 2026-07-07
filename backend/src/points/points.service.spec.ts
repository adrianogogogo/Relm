/// <reference types="jest" />
import { PointsService } from './points.service';

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

function makeService(rows: any[]) {
  const prisma: any = {
    pointsLedger: { findMany: jest.fn().mockResolvedValue(rows) },
  };
  return new PointsService(prisma);
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
