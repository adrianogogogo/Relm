/// <reference types="jest" />
import { WhatsappService, SETTING_WA_CLOUD_TOKEN, SETTING_WA_PHONE_NUMBER_ID, SETTING_WA_NUMBER } from './whatsapp.service';
import { BroadcastTarget } from './dto/whatsapp.dto';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSettingsMap(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    [SETTING_WA_CLOUD_TOKEN]: 'secret-token-1234',
    [SETTING_WA_PHONE_NUMBER_ID]: 'phone-id-999',
    [SETTING_WA_NUMBER]: '5511999998888',
    ...overrides,
  };
}

function makeService(
  settings: Record<string, string> = makeSettingsMap(),
  customers: any[] = [],
  subscriptions: any[] = [],
) {
  const prisma: any = {
    clubSettings: {
      findUnique: jest.fn().mockImplementation(({ where }: any) => {
        const value = settings[where.key];
        return Promise.resolve(value !== undefined ? { key: where.key, value } : null);
      }),
      upsert: jest.fn().mockResolvedValue({}),
    },
    customer: {
      findMany: jest.fn().mockResolvedValue(customers),
    },
    subscription: {
      findMany: jest.fn().mockResolvedValue(subscriptions),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({}),
    },
  };

  const pointsService: any = { getBalance: jest.fn().mockResolvedValue(100) };

  const svc = new WhatsappService(prisma, pointsService);
  return { svc, prisma };
}

// ── toE164 ────────────────────────────────────────────────────────────────────

describe('WhatsappService.toE164', () => {
  let svc: WhatsappService;

  beforeEach(() => {
    ({ svc } = makeService());
  });

  it('normalizes 11-digit local BR mobile', () => {
    expect(svc.toE164('11999998888')).toBe('+5511999998888');
  });

  it('normalizes 10-digit local BR landline', () => {
    expect(svc.toE164('1133334444')).toBe('+551133334444');
  });

  it('passes through already-E164 BR number', () => {
    expect(svc.toE164('5511999998888')).toBe('+5511999998888');
  });

  it('returns null for empty string', () => {
    expect(svc.toE164('')).toBeNull();
  });

  it('strips non-digits', () => {
    expect(svc.toE164('(11) 99999-8888')).toBe('+5511999998888');
  });
});

// ── getSettings masking ───────────────────────────────────────────────────────

describe('WhatsappService.getSettings', () => {
  it('masks token and never returns raw value', async () => {
    const { svc } = makeService(makeSettingsMap({ [SETTING_WA_CLOUD_TOKEN]: 'mysecrettoken1234' }));
    const result = await svc.getSettings();
    expect(result.tokenSet).toBe(true);
    expect(result.tokenMasked).toBe('****1234');
    expect((result as any).token).toBeUndefined();
    expect((result as any).cloudToken).toBeUndefined();
  });

  it('returns tokenSet false when token is empty', async () => {
    const { svc } = makeService(makeSettingsMap({ [SETTING_WA_CLOUD_TOKEN]: '' }));
    const result = await svc.getSettings();
    expect(result.tokenSet).toBe(false);
    expect(result.tokenMasked).toBeNull();
  });
});

// ── broadcast targeting ───────────────────────────────────────────────────────

describe('WhatsappService.broadcast', () => {
  const token = 'token-abc';
  const phoneId = 'pid-123';

  function makeFullService(customers: any[], subscriptions: any[]) {
    return makeService(
      makeSettingsMap({ [SETTING_WA_CLOUD_TOKEN]: token, [SETTING_WA_PHONE_NUMBER_ID]: phoneId }),
      customers,
      subscriptions,
    );
  }

  it('PLUS target picks only ACTIVE PLUS customers with phone', async () => {
    const subs = [{ customerId: 'c1' }, { customerId: 'c2' }];
    const customers = [
      { id: 'c1', phone: '11999998888', fullName: 'Ana' },
      { id: 'c2', phone: '11888887777', fullName: 'Bob' },
    ];
    const { svc, prisma } = makeFullService(customers, subs);

    // mock sendCloudMessage to avoid actual HTTP
    const sendSpy = jest.spyOn(svc, 'sendCloudMessage').mockResolvedValue();

    const result = await svc.broadcast(
      { message: 'Olá PLUS!', target: BroadcastTarget.PLUS },
      'admin-id',
    );

    expect(prisma.subscription.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tier: 'PLUS', status: 'ACTIVE' }) }),
    );
    expect(result.sent).toBe(2);
    expect(result.skipped).toBe(0);
    expect(result.configured).toBe(true);
    expect(sendSpy).toHaveBeenCalledTimes(2);
  });

  it('skips customers without phone', async () => {
    const customers = [
      { id: 'c1', phone: '', fullName: 'Sem Fone' },
      { id: 'c2', phone: '11999998888', fullName: 'Com Fone' },
    ];
    const { svc } = makeFullService(customers, []);
    jest.spyOn(svc, 'sendCloudMessage').mockResolvedValue();

    const result = await svc.broadcast(
      { message: 'Teste', target: BroadcastTarget.ALL },
      'admin-id',
    );

    expect(result.skipped).toBe(1);
    expect(result.sent).toBe(1);
  });

  it('returns configured:false without calling send when credentials missing', async () => {
    const { svc } = makeService(
      makeSettingsMap({ [SETTING_WA_CLOUD_TOKEN]: '', [SETTING_WA_PHONE_NUMBER_ID]: '' }),
      [],
    );
    const sendSpy = jest.spyOn(svc, 'sendCloudMessage');

    const result = await svc.broadcast(
      { message: 'Teste', target: BroadcastTarget.ALL },
      'admin-id',
    );

    expect(result.configured).toBe(false);
    expect(sendSpy).not.toHaveBeenCalled();
    expect(result.total).toBe(0);
  });

  it('counts failed sends and still writes audit log', async () => {
    const customers = [
      { id: 'c1', phone: '11999998888', fullName: 'Err' },
      { id: 'c2', phone: '11888887777', fullName: 'Ok' },
    ];
    const { svc, prisma } = makeFullService(customers, []);
    let callCount = 0;
    jest.spyOn(svc, 'sendCloudMessage').mockImplementation(async () => {
      callCount++;
      if (callCount === 1) throw new Error('network error');
    });

    const result = await svc.broadcast(
      { message: 'Teste', target: BroadcastTarget.ALL },
      'admin-id',
    );

    expect(result.failed).toBe(1);
    expect(result.sent).toBe(1);
    expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
  });
});

// ── getPublicContact ──────────────────────────────────────────────────────────

describe('WhatsappService.getPublicContact', () => {
  it('returns number when configured', async () => {
    const { svc } = makeService(makeSettingsMap({ [SETTING_WA_NUMBER]: '5511999998888' }));
    const result = await svc.getPublicContact();
    expect(result.number).toBe('5511999998888');
  });

  it('returns null when number is empty', async () => {
    const { svc } = makeService(makeSettingsMap({ [SETTING_WA_NUMBER]: '' }));
    const result = await svc.getPublicContact();
    expect(result.number).toBeNull();
  });
});
