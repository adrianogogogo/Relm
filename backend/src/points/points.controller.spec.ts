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

  // `balance` é o TOTAL porque o ponto mensal vale para qualquer resgate
  // (decisão do Adriano, 10/08/2026). Tem que casar com o que o
  // rewards.service valida — se um mudar sem o outro, a tela oferece resgate
  // que o backend recusa, ou esconde saldo que o cliente poderia gastar.
  it('balance é o TOTAL — mensal + acumulável, tudo gastável em qualquer resgate', async () => {
    const ctrl = makeController({ accumulated: 1200, monthly: 500, total: 1700 });
    const res = await ctrl.getBalance({ user: { customerId: 'c1' } });

    expect(res.balance).toBe(1700);
  });

  it('cliente sem saldo mensal (Care) recebe monthly zero, não ausente', async () => {
    const ctrl = makeController({ accumulated: 80, monthly: 0, total: 80 });
    const res = await ctrl.getBalance({ user: { customerId: 'c1' } });

    expect(res.monthly).toBe(0);
    expect(res.balance).toBe(80);
  });
});
