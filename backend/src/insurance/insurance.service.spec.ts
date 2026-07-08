/// <reference types="jest" />
import { InsuranceService } from './insurance.service';

// Constrói um InsuranceService com prisma/dependências mockadas, no estilo do
// payments.service.spec.ts (construtor direto, sem TestingModule).
function makeService(opts: {
  quote?: any;
  activePolicy?: any;
} = {}) {
  const created: any = { policies: [], updatedManyExpiredCount: 0 };

  const tx: any = {
    insuranceQuote: {
      update: jest.fn().mockImplementation(({ data }: any) =>
        Promise.resolve({
          id: 'q1',
          customerId: 'cust1',
          ...data,
          customer: { id: 'cust1', fullName: 'Fulano', email: 'f@x.com' },
        }),
      ),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      findUniqueOrThrow: jest.fn().mockResolvedValue({
        id: 'q1',
        customerId: 'cust1',
        status: 'CONVERTED',
        customer: { id: 'cust1', fullName: 'Fulano', email: 'f@x.com' },
      }),
    },
    insurancePolicy: {
      create: jest.fn().mockImplementation(({ data }: any) => {
        const row = { id: `pol${created.policies.length + 1}`, ...data };
        created.policies.push(row);
        return Promise.resolve(row);
      }),
      findFirst: jest.fn().mockResolvedValue(opts.activePolicy ?? null),
      updateMany: jest.fn().mockResolvedValue({ count: opts.activePolicy ? 1 : 0 }),
    },
  };

  const prisma: any = {
    insuranceQuote: {
      findUnique: jest.fn().mockResolvedValue(opts.quote ?? null),
    },
    insurancePolicy: {
      updateMany: jest.fn().mockImplementation(({ data }: any) => {
        created.updatedManyExpiredData = data;
        return Promise.resolve({ count: 3 });
      }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    $transaction: jest.fn().mockImplementation((cb: any) => cb(tx)),
  };

  const customersService: any = {};
  const notifications: any = {
    notifyTeam: jest.fn().mockResolvedValue(undefined),
  };

  const svc = new InsuranceService(prisma, customersService, notifications);
  return { svc, prisma, tx, notifications, created };
}

// ─────────────────────────────────────────────────────────────────────────────
describe('InsuranceService.convert (cotação → apólice)', () => {
  it('cria a apólice na mesma transação ao converter a cotação', async () => {
    const { svc, tx, notifications, created } = makeService({
      quote: {
        id: 'q1',
        customerId: 'cust1',
        productId: null,
        insuranceCompany: 'Seguradora X',
        quoteValue: 120,
      },
    });

    const result = await svc.convert('q1');

    // Cotação marcada como CONVERTED (updateMany atômico com filtro de status).
    expect(tx.insuranceQuote.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'CONVERTED' }) }),
    );
    // Apólice criada com seguradora vinda da cotação e vigência de 1 ano.
    expect(tx.insurancePolicy.create).toHaveBeenCalledTimes(1);
    const policy = created.policies[0];
    expect(policy.insurer).toBe('Seguradora X');
    expect(policy.status).toBe('ACTIVE');
    expect(policy.quoteId).toBe('q1');
    const span = new Date(policy.expiresAt).getFullYear() - new Date(policy.startsAt).getFullYear();
    expect(span).toBe(1);
    expect(result.policy).toBeDefined();
    expect(notifications.notifyTeam).toHaveBeenCalled();
  });

  it('lança NotFound se a cotação não existe', async () => {
    const { svc } = makeService({ quote: null });
    await expect(svc.convert('nope')).rejects.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('InsuranceService.renew (novo período de apólice)', () => {
  it('encerra a apólice ativa anterior e cria um novo período', async () => {
    const { svc, tx, created } = makeService({
      quote: { id: 'q1', customerId: 'cust1', productId: null },
      activePolicy: {
        id: 'polOld',
        insurer: 'Seguradora X',
        coverage: 'Roubo e furto',
        premium: 100,
        productId: null,
        status: 'ACTIVE',
      },
    });

    const result = await svc.renew('q1');

    // Marcou a anterior como EXPIRED.
    expect(tx.insurancePolicy.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'EXPIRED' }) }),
    );
    // Criou o novo período preservando seguradora/cobertura.
    expect(tx.insurancePolicy.create).toHaveBeenCalledTimes(1);
    expect(created.policies[0].insurer).toBe('Seguradora X');
    expect(created.policies[0].coverage).toBe('Roubo e furto');
    expect(result.policy).toBeDefined();
  });

  it('não cria apólice se a cotação nunca foi convertida', async () => {
    const { svc, tx } = makeService({
      quote: { id: 'q1', customerId: 'cust1', productId: null },
      activePolicy: null,
    });

    const result = await svc.renew('q1');
    expect(tx.insurancePolicy.create).not.toHaveBeenCalled();
    expect(result.policy).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('InsuranceService.handlePolicyExpiration (cron)', () => {
  it('marca apólices ACTIVE vencidas como EXPIRED', async () => {
    const { svc, prisma, created } = makeService();

    await svc.handlePolicyExpiration();

    expect(prisma.insurancePolicy.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'ACTIVE', expiresAt: expect.anything() }),
        data: { status: 'EXPIRED' },
      }),
    );
    expect(created.updatedManyExpiredData).toEqual({ status: 'EXPIRED' });
    // Consulta as janelas de aviso (30 e 7 dias).
    expect(prisma.insurancePolicy.findMany).toHaveBeenCalledTimes(2);
  });

  it('notifica quando há apólices na janela de vencimento', async () => {
    const { svc, prisma, notifications } = makeService();
    prisma.insurancePolicy.findMany.mockResolvedValueOnce([
      {
        policyNumber: 'POL-2026-ABCD',
        expiresAt: new Date(),
        customer: { fullName: 'Fulano' },
      },
    ]);

    await svc.handlePolicyExpiration();
    expect(notifications.notifyTeam).toHaveBeenCalled();
  });
});
