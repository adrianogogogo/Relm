/// <reference types="jest" />
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { PaymentsService } from './payments.service';

// Constrói um PaymentsService com dependências mockadas. `payment` é o registro
// retornado por findUnique; overrides permitem variar status.
function makeService(payment: any, opts: { configuredFee?: number; customerStoreId?: string | null } = {}) {
  const configuredFee = opts.configuredFee ?? 299;
  const store: any = { current: { ...payment } };

  const tx: any = {
    payment: {
      create: jest.fn().mockImplementation(({ data }: any) => {
        store.current = { id: 'p1', ...data, status: data.status || 'PENDING' };
        return Promise.resolve(store.current);
      }),
      update: jest.fn().mockImplementation(({ data }: any) => {
        store.current = { ...store.current, ...data };
        return Promise.resolve(store.current);
      }),
      updateMany: jest.fn().mockImplementation(({ data }: any) => {
        const wasPending = store.current.status === 'PENDING';
        if (wasPending && data) store.current = { ...store.current, ...data };
        return Promise.resolve({ count: wasPending ? 1 : 0 });
      }),
      findUnique: jest.fn().mockImplementation(() => Promise.resolve(store.current)),
    },
    subscription: {
      create: jest.fn().mockResolvedValue({ id: 'sub1' }),
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue({ id: 'sub1' }),
    },
    customer: {
      update: jest.fn().mockResolvedValue({}),
    },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
  };

  const prisma: any = {
    payment: {
      findUnique: jest.fn().mockImplementation(() => Promise.resolve(store.current)),
      update: jest.fn().mockImplementation(({ data }: any) => {
        store.current = { ...store.current, ...data };
        return Promise.resolve(store.current);
      }),
      create: jest.fn().mockImplementation(({ data }: any) => {
        store.current = { id: 'p1', ...data };
        return Promise.resolve(store.current);
      }),
    },
    customer: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'cust1',
        storeId: opts.customerStoreId !== undefined ? opts.customerStoreId : 'store1',
        fullName: 'Fulano',
        subscription: null,
      }),
    },
    subscription: {
      create: jest.fn().mockResolvedValue({ id: 'sub1' }),
    },
    clubSettings: {
      findUnique: jest.fn().mockResolvedValue({ key: 'plus_annual_fee', value: String(configuredFee) }),
    },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
    $transaction: jest.fn().mockImplementation((cb: any) => cb(tx)),
  };

  const subscriptionsService: any = {
    renewFromPayment: jest
      .fn()
      .mockResolvedValue({ subscription: { id: 'sub1' }, isRenewal: true }),
  };

  const notifications: any = {
    notifyTeam: jest.fn().mockResolvedValue(undefined),
    notifyStore: jest.fn().mockResolvedValue(undefined),
  };

  const gateway: any = {
    createCharge: jest.fn().mockResolvedValue({ gatewayId: null }),
    confirmPayment: jest
      .fn()
      .mockResolvedValue({ confirmed: true, paidAt: new Date(), gatewayId: null }),
  };

  const gamification: any = { checkAndGrant: jest.fn().mockResolvedValue(undefined) };

  const svc = new PaymentsService(prisma, subscriptionsService, notifications, gamification, gateway);
  return { svc, prisma, tx, subscriptionsService, notifications, gateway, store };
}

const actorUser = { id: 'user1', type: 'USER' as const };
const actorStore = { id: 'storeuser1', type: 'STORE_USER' as const, storeId: 'store1' };

// ─────────────────────────────────────────────────────────────────────────────
describe('PaymentsService.confirm (fluxo confirmar → renovar)', () => {
  it('confirma um pagamento PENDING e renova a assinatura', async () => {
    const { svc, subscriptionsService, tx } = makeService({
      id: 'p1',
      customerId: 'cust1',
      status: 'PENDING',
      gatewayId: null,
    });

    const result = await svc.confirm('p1', actorUser);

    // Renovou a assinatura via subscriptions service, dentro da transação.
    expect(subscriptionsService.renewFromPayment).toHaveBeenCalledWith('cust1', tx, actorUser);
    // Marcou o pagamento como CONFIRMED usando updateMany atômico.
    expect(tx.payment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'PENDING' }) }),
    );
    expect(result.status).toBe('CONFIRMED');
    // Registrou auditoria da confirmação.
    expect(tx.auditLog.create).toHaveBeenCalled();
  });

  it('é idempotente: pagamento já CONFIRMED lança ConflictException', async () => {
    const { svc } = makeService({
      id: 'p1',
      customerId: 'cust1',
      status: 'CONFIRMED',
    });

    await expect(svc.confirm('p1', actorUser)).rejects.toThrow(ConflictException);
  });

  it('rejeita confirmar um pagamento CANCELLED', async () => {
    const { svc } = makeService({ id: 'p1', customerId: 'cust1', status: 'CANCELLED' });
    await expect(svc.confirm('p1', actorUser)).rejects.toThrow();
  });

  it('[FINDING 3] double-confirm simultâneo: updateMany retorna count=0 → lança ConflictException', async () => {
    const { svc, tx } = makeService({
      id: 'p1',
      customerId: 'cust1',
      status: 'PENDING',
      gatewayId: null,
    });
    // Simula que outra transação confirmou primeiro → count = 0.
    tx.payment.updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(svc.confirm('p1', actorUser)).rejects.toThrow(ConflictException);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PaymentsService.register — segurança de valor (FINDING 1)', () => {
  it('STORE_USER: ignora amount enviado e usa ClubSettings', async () => {
    const configuredFee = 299;
    const { svc, tx } = makeService(
      { id: 'p1', customerId: 'cust1', status: 'PENDING' },
      { configuredFee },
    );

    await svc.register({ customerId: 'cust1', amount: 1 }, actorStore);

    // O create da transação deve usar o valor configurado, não o enviado (1).
    const createCall = tx.payment.create.mock.calls[0][0];
    expect(Number(createCall.data.amount.toString())).toBe(configuredFee);
  });

  it('STORE_USER: rejeita quando fee não configurada (=0)', async () => {
    const { svc } = makeService(
      { id: 'p1', customerId: 'cust1', status: 'PENDING' },
      { configuredFee: 0 },
    );

    await expect(svc.register({ customerId: 'cust1' }, actorStore)).rejects.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PaymentsService.register — cross-store IDOR (FINDING 2)', () => {
  it('STORE_USER: rejeita cliente de outra loja', async () => {
    const { svc } = makeService(
      { id: 'p1', customerId: 'cust1', status: 'PENDING' },
      { customerStoreId: 'OTHER_STORE' },
    );

    await expect(
      svc.register({ customerId: 'cust1' }, actorStore),
    ).rejects.toThrow(ForbiddenException);
  });

  it('STORE_USER: aceita cliente da mesma loja', async () => {
    const { svc } = makeService(
      { id: 'p1', customerId: 'cust1', status: 'PENDING' },
      { customerStoreId: 'store1' },
    );

    await expect(
      svc.register({ customerId: 'cust1' }, actorStore),
    ).resolves.toBeDefined();
  });
});
