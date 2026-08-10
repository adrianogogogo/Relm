/// <reference types="jest" />
import { PointsController } from './points.controller';

describe('PointsController.getBalance — contrato dos saldos', () => {
  function makeController(balances: { accumulated: number; monthly: number; total: number }) {
    const service: any = { getBalances: jest.fn().mockResolvedValue(balances) };
    return new PointsController(service);
  }

  it('expõe accumulated, monthly e total', async () => {
    const ctrl = makeController({ accumulated: 1200, monthly: 500, total: 1700 });
    const res = await ctrl.getBalance({ user: { customerId: 'c1' } });

    expect(res).toMatchObject({ accumulated: 1200, monthly: 500, total: 1700 });
  });

  // Escolha deliberada, não descuido: o resgate de catálogo valida e debita
  // apenas o acumulável (rewards.service.ts). Apontar `balance` para o total
  // faria a tela oferecer resgate que o backend recusa com "Insufficient
  // Points". Se este teste falhar, o consumidor da tela precisa mudar junto.
  it('balance é o ACUMULÁVEL, não o total — é o que o catálogo aceita gastar', async () => {
    const ctrl = makeController({ accumulated: 1200, monthly: 500, total: 1700 });
    const res = await ctrl.getBalance({ user: { customerId: 'c1' } });

    expect(res.balance).toBe(1200);
  });

  it('cliente sem saldo mensal (Care) recebe monthly zero, não ausente', async () => {
    const ctrl = makeController({ accumulated: 80, monthly: 0, total: 80 });
    const res = await ctrl.getBalance({ user: { customerId: 'c1' } });

    expect(res.monthly).toBe(0);
    expect(res.balance).toBe(80);
  });
});
