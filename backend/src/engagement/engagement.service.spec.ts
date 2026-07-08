/// <reference types="jest" />
import { EngagementService } from './engagement.service';
import { ReferralStatus } from '@prisma/client';

// ── Factories ──────────────────────────────────────────────────────────────

function makeService(overrides: {
  referral?: any;
  ledgerEntry?: any;
  customers?: any[];
  settingValue?: number;
} = {}) {
  const referralRecord = overrides.referral ?? null;
  const ledgerEntry    = overrides.ledgerEntry ?? null;
  const customers      = overrides.customers ?? [];
  const settingValue   = overrides.settingValue ?? 500;

  const txMock: any = {
    referral: {
      findUnique: jest.fn().mockResolvedValue(referralRecord),
      update:     jest.fn().mockResolvedValue({ ...referralRecord, status: ReferralStatus.COMPLETED }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      create:     jest.fn().mockResolvedValue({ id: 'ref1', status: ReferralStatus.PENDING }),
    },
    customer: {
      findUnique: jest.fn().mockResolvedValue(null),
      update:     jest.fn().mockResolvedValue({}),
    },
    eventRegistration: {
      update: jest.fn().mockResolvedValue({ id: 'reg1', attended: true }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };

  const prisma: any = {
    clubSettings: {
      findUnique: jest.fn().mockResolvedValue({ value: String(settingValue) }),
    },
    customer: {
      findUniqueOrThrow: jest.fn().mockResolvedValue({ referralCode: null }),
      update: jest.fn().mockImplementation(({ data }: any) =>
        Promise.resolve({ referralCode: data.referralCode }),
      ),
      findMany: jest.fn().mockResolvedValue(customers),
    },
    referral: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(referralRecord),
      update: jest.fn().mockResolvedValue({}),
    },
    pointsLedger: {
      findFirst: jest.fn().mockResolvedValue(ledgerEntry),
    },
    eventRegistration: {
      findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'reg1', customerId: 'cust1', attended: false }),
      update: jest.fn().mockResolvedValue({ id: 'reg1', attended: true }),
    },
    $transaction: jest.fn().mockImplementation((cb: any) => cb(txMock)),
  };

  const pointsService: any = {
    earnPoints: jest.fn().mockResolvedValue({ id: 'ledger1' }),
  };

  const service = new EngagementService(prisma, pointsService);

  return { service, prisma, pointsService, txMock };
}

// ── Tests: completeReferral ────────────────────────────────────────────────

describe('EngagementService.completeReferral', () => {
  it('awards points and marks COMPLETED when referral is PENDING', async () => {
    const pendingReferral = {
      id: 'ref1',
      referrerId: 'referrer1',
      referredId: 'referred1',
      status: ReferralStatus.PENDING,
    };
    const { service, pointsService, txMock } = makeService({
      referral: pendingReferral,
      settingValue: 500,
    });

    await service.completeReferral('referred1', txMock);

    expect(pointsService.earnPoints).toHaveBeenCalledWith(
      'referrer1',
      500,
      expect.stringContaining('indicação'),
      'ref1',
      txMock,
    );
    expect(txMock.referral.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ref1', status: ReferralStatus.PENDING },
        data: expect.objectContaining({ status: ReferralStatus.COMPLETED, pointsAwarded: 500 }),
      }),
    );
  });

  it('is idempotent: does nothing if referral is already COMPLETED', async () => {
    const completedReferral = {
      id: 'ref1',
      referrerId: 'referrer1',
      referredId: 'referred1',
      status: ReferralStatus.COMPLETED,
    };
    const { service, pointsService, txMock } = makeService({ referral: completedReferral });

    await service.completeReferral('referred1', txMock);

    expect(pointsService.earnPoints).not.toHaveBeenCalled();
    expect(txMock.referral.update).not.toHaveBeenCalled();
  });

  it('is idempotent: does nothing if no referral exists for the customer', async () => {
    const { service, pointsService, txMock } = makeService({ referral: null });

    await service.completeReferral('unknown', txMock);

    expect(pointsService.earnPoints).not.toHaveBeenCalled();
  });
});

// ── Tests: applyReferralCode ───────────────────────────────────────────────

describe('EngagementService.applyReferralCode', () => {
  it('creates a PENDING referral when code is valid and not self-referral', async () => {
    const { service, txMock } = makeService();
    txMock.customer.findUnique.mockResolvedValue({ id: 'referrer1' });

    const result = await service.applyReferralCode('newCustomer1', 'ABCDEFG', txMock);

    expect(result).toBe(true);
    expect(txMock.referral.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          referrerId: 'referrer1',
          referredId: 'newCustomer1',
          status: ReferralStatus.PENDING,
        }),
      }),
    );
  });

  it('returns false when code is undefined', async () => {
    const { service, txMock } = makeService();
    const result = await service.applyReferralCode('cust1', undefined, txMock);
    expect(result).toBe(false);
    expect(txMock.referral.create).not.toHaveBeenCalled();
  });

  it('returns false on self-referral', async () => {
    const { service, txMock } = makeService();
    txMock.customer.findUnique.mockResolvedValue({ id: 'same' });

    const result = await service.applyReferralCode('same', 'MYCODE1', txMock);
    expect(result).toBe(false);
  });

  it('returns false when code does not exist', async () => {
    const { service, txMock } = makeService();
    txMock.customer.findUnique.mockResolvedValue(null);

    const result = await service.applyReferralCode('cust1', 'INVALID', txMock);
    expect(result).toBe(false);
  });
});

// ── Tests: handleBirthdayBonus (cron idempotency) ─────────────────────────

describe('EngagementService.handleBirthdayBonus', () => {
  it('credits birthday points to a customer whose birthday is today', async () => {
    const now = new Date();
    const birthDate = new Date(Date.UTC(1990, now.getMonth(), now.getDate()));

    const { service, prisma, pointsService } = makeService({
      customers: [
        { id: 'cust1', birthDate },
      ],
      ledgerEntry: null, // não existe entrada ainda este ano
      settingValue: 200,
    });

    await service.handleBirthdayBonus();

    expect(pointsService.earnPoints).toHaveBeenCalledWith(
      'cust1',
      200,
      expect.stringContaining('aniversário'),
      `birthday-${now.getFullYear()}-cust1`,
    );
  });

  it('is idempotent: skips customers already credited this year', async () => {
    const now = new Date();
    const birthDate = new Date(Date.UTC(1990, now.getMonth(), now.getDate()));

    const existingEntry = { id: 'ledger99' }; // já existe entrada

    const { service, pointsService } = makeService({
      customers: [{ id: 'cust1', birthDate }],
      ledgerEntry: existingEntry,
      settingValue: 200,
    });

    await service.handleBirthdayBonus();

    expect(pointsService.earnPoints).not.toHaveBeenCalled();
  });

  it('skips customers whose birthday is not today', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const birthDate = new Date(Date.UTC(1990, yesterday.getMonth(), yesterday.getDate()));

    const { service, pointsService } = makeService({
      customers: [{ id: 'cust1', birthDate }],
      ledgerEntry: null,
    });

    await service.handleBirthdayBonus();

    expect(pointsService.earnPoints).not.toHaveBeenCalled();
  });
});

// ── Tests: markAttendance ─────────────────────────────────────────────────

describe('EngagementService.markAttendance', () => {
  it('marks attended and awards points on first call', async () => {
    const { service, pointsService } = makeService({ settingValue: 100 });

    const result = await service.markAttendance('reg1');

    expect(result.attended).toBe(true);
    expect(result.pointsAwarded).toBe(100);
    expect(pointsService.earnPoints).toHaveBeenCalledWith(
      'cust1',
      100,
      expect.stringContaining('evento'),
      'reg1',
      expect.anything(),
    );
  });

  it('is idempotent: returns attended without re-awarding if already attended', async () => {
    const { service, prisma, pointsService } = makeService();
    prisma.eventRegistration.findUniqueOrThrow.mockResolvedValue({
      id: 'reg1',
      customerId: 'cust1',
      attended: true,
    });

    const result = await service.markAttendance('reg1');

    expect(result.attended).toBe(true);
    expect(result.pointsAwarded).toBeNull();
    expect(pointsService.earnPoints).not.toHaveBeenCalled();
  });
});
