/// <reference types="jest" />
import { GamificationService, BADGE } from './gamification.service';
import { PointTxType, ReferralStatus } from '@prisma/client';

// ── Helpers ───────────────────────────────────────────────────────────────

const ACHIEVEMENT_ID = 'ach-uuid-1';

function makeService(overrides: {
  achievementActive?: boolean;
  createError?: any;
  confirmedPayments?: number;
  attended?: number;
  completedReferrals?: number;
  earnSum?: number;
  leaderboardOptIn?: boolean;
  nickname?: string | null;
} = {}) {
  const achievement = {
    id: ACHIEVEMENT_ID,
    active: overrides.achievementActive ?? true,
  };

  const prisma: any = {
    achievement: {
      findUnique: jest.fn().mockResolvedValue(achievement),
      findMany: jest.fn().mockResolvedValue([
        { id: 'ach1', code: BADGE.PRIMEIRA_COMPRA, name: 'Primeira Compra', description: 'desc', icon: '🛒', active: true, createdAt: new Date() },
        { id: 'ach2', code: BADGE.DEZ_PEDAIS,      name: 'Dez Pedais',      description: 'desc', icon: '🚴', active: true, createdAt: new Date() },
      ]),
    },
    customerAchievement: {
      create: overrides.createError
        ? jest.fn().mockRejectedValue(overrides.createError)
        : jest.fn().mockResolvedValue({ id: 'ca1' }),
      findMany: jest.fn().mockResolvedValue([
        { achievementId: 'ach1', earnedAt: new Date('2026-01-01') },
      ]),
    },
    payment: {
      count: jest.fn().mockResolvedValue(overrides.confirmedPayments ?? 0),
    },
    eventRegistration: {
      count: jest.fn().mockResolvedValue(overrides.attended ?? 0),
    },
    referral: {
      count: jest.fn().mockResolvedValue(overrides.completedReferrals ?? 0),
    },
    pointsLedger: {
      groupBy: jest.fn().mockResolvedValue([]),
      aggregate: jest.fn().mockResolvedValue({ _sum: { amount: overrides.earnSum ?? 0 } }),
    },
    customer: {
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({
        leaderboardOptIn: overrides.leaderboardOptIn ?? false,
        nickname: overrides.nickname ?? null,
      }),
    },
  };

  const service = new GamificationService(prisma);
  return { service, prisma };
}

// ── Tests: grantAchievement ───────────────────────────────────────────────

describe('GamificationService.grantAchievement', () => {
  it('concede o badge e retorna true quando o achievement existe e está ativo', async () => {
    const { service, prisma } = makeService();

    const result = await service.grantAchievement('cust1', BADGE.PRIMEIRA_COMPRA);

    expect(result).toBe(true);
    expect(prisma.customerAchievement.create).toHaveBeenCalledWith({
      data: { customerId: 'cust1', achievementId: ACHIEVEMENT_ID },
    });
  });

  it('retorna false quando o achievement não existe (findUnique retorna null)', async () => {
    const { service, prisma } = makeService();
    prisma.achievement.findUnique.mockResolvedValue(null);

    const result = await service.grantAchievement('cust1', BADGE.PRIMEIRA_COMPRA);

    expect(result).toBe(false);
    expect(prisma.customerAchievement.create).not.toHaveBeenCalled();
  });

  it('retorna false quando o achievement está inativo', async () => {
    const { service } = makeService({ achievementActive: false });

    const result = await service.grantAchievement('cust1', BADGE.PRIMEIRA_COMPRA);

    expect(result).toBe(false);
  });

  it('é idempotente: retorna false em P2002 (badge já concedido) sem relançar', async () => {
    const p2002 = Object.assign(new Error('Unique constraint'), { code: 'P2002' });
    const { service } = makeService({ createError: p2002 });

    const result = await service.grantAchievement('cust1', BADGE.PRIMEIRA_COMPRA);

    expect(result).toBe(false);
  });

  it('relança erros que não são P2002', async () => {
    const dbError = Object.assign(new Error('DB error'), { code: 'P1001' });
    const { service } = makeService({ createError: dbError });

    await expect(
      service.grantAchievement('cust1', BADGE.PRIMEIRA_COMPRA),
    ).rejects.toThrow('DB error');
  });
});

// ── Tests: checkAndGrant ──────────────────────────────────────────────────

describe('GamificationService.checkAndGrant', () => {
  it('concede PRIMEIRA_COMPRA quando há >= 1 pagamento confirmado', async () => {
    const { service, prisma } = makeService({ confirmedPayments: 1 });
    const grantSpy = jest.spyOn(service, 'grantAchievement').mockResolvedValue(true);

    await service.checkAndGrant('cust1');

    expect(grantSpy).toHaveBeenCalledWith('cust1', BADGE.PRIMEIRA_COMPRA, undefined);
    expect(grantSpy).not.toHaveBeenCalledWith('cust1', BADGE.RENOVACAO_PLUS, undefined);
  });

  it('concede RENOVACAO_PLUS quando há >= 2 pagamentos confirmados', async () => {
    const { service } = makeService({ confirmedPayments: 2 });
    const grantSpy = jest.spyOn(service, 'grantAchievement').mockResolvedValue(true);

    await service.checkAndGrant('cust1');

    expect(grantSpy).toHaveBeenCalledWith('cust1', BADGE.PRIMEIRA_COMPRA, undefined);
    expect(grantSpy).toHaveBeenCalledWith('cust1', BADGE.RENOVACAO_PLUS, undefined);
  });

  it('concede DEZ_PEDAIS quando attended >= 10', async () => {
    const { service } = makeService({ attended: 10 });
    const grantSpy = jest.spyOn(service, 'grantAchievement').mockResolvedValue(true);

    await service.checkAndGrant('cust1');

    expect(grantSpy).toHaveBeenCalledWith('cust1', BADGE.DEZ_PEDAIS, undefined);
  });

  it('concede INDICOU_5 quando completedReferrals >= 5', async () => {
    const { service } = makeService({ completedReferrals: 5 });
    const grantSpy = jest.spyOn(service, 'grantAchievement').mockResolvedValue(true);

    await service.checkAndGrant('cust1');

    expect(grantSpy).toHaveBeenCalledWith('cust1', BADGE.INDICOU_5, undefined);
  });

  it('concede PONTOS_10K quando earnSum >= 10000', async () => {
    const { service } = makeService({ earnSum: 10000 });
    const grantSpy = jest.spyOn(service, 'grantAchievement').mockResolvedValue(true);

    await service.checkAndGrant('cust1');

    expect(grantSpy).toHaveBeenCalledWith('cust1', BADGE.PONTOS_10K, undefined);
  });

  it('não concede nenhum badge quando critérios não são atingidos', async () => {
    const { service } = makeService({
      confirmedPayments: 0, attended: 0,
      completedReferrals: 0, earnSum: 0,
    });
    const grantSpy = jest.spyOn(service, 'grantAchievement').mockResolvedValue(false);

    await service.checkAndGrant('cust1');

    expect(grantSpy).not.toHaveBeenCalled();
  });

  it('não lança exceção mesmo quando grantAchievement falha internamente', async () => {
    const { service, prisma } = makeService({ confirmedPayments: 1 });
    prisma.payment.count.mockRejectedValue(new Error('DB falhou'));

    // Deve resolver sem lançar
    await expect(service.checkAndGrant('cust1')).resolves.toBeUndefined();
  });
});

// ── Tests: getLeaderboard / leaderboard opt-in ────────────────────────────

describe('GamificationService.getLeaderboard', () => {
  it('retorna lista vazia quando nenhum cliente tem opt-in', async () => {
    const { service } = makeService();

    const result = await service.getLeaderboard('cust1');

    expect(result).toEqual([]);
  });

  it('mapeia rank e nickname fallback corretamente', async () => {
    const { service, prisma } = makeService();
    prisma.pointsLedger.groupBy.mockResolvedValue([
      { customerId: 'cust-a', _sum: { amount: 5000 } },
      { customerId: 'cust-b', _sum: { amount: 3000 } },
    ]);
    prisma.customer.findMany.mockResolvedValue([
      { id: 'cust-a', nickname: 'Ciclista Pro' },
      { id: 'cust-b', nickname: null },
    ]);

    const result = await service.getLeaderboard('cust-a');

    expect(result[0]).toMatchObject({ rank: 1, nickname: 'Ciclista Pro', points: 5000, isMe: true });
    expect(result[1]).toMatchObject({ rank: 2, nickname: 'Membro RELM', points: 3000, isMe: false });
  });
});

describe('GamificationService.updateLeaderboardOptIn', () => {
  it('sanitiza o nickname: remove HTML e limita a 30 chars', async () => {
    const { service, prisma } = makeService({ leaderboardOptIn: true, nickname: 'Clean' });
    const dirty = '<script>alert(1)</script>Pedala Muito Legal Mesmo Aqui Isso É Demais';

    await service.updateLeaderboardOptIn('cust1', true, dirty);

    const updateCall = prisma.customer.update.mock.calls[0][0];
    // Após remoção do HTML: 'alert(1)Pedala Muito Legal Mesmo Aqui Isso É Demais'
    // Fatiado em 30 chars: 'alert(1)Pedala Muito Legal Mes'
    expect(updateCall.data.nickname).toBe('alert(1)Pedala Muito Legal Mes');
    expect(updateCall.data.nickname.length).toBeLessThanOrEqual(30);
  });

  it('salva leaderboardOptIn=false e não altera nickname quando não fornecido', async () => {
    const { service, prisma } = makeService({ leaderboardOptIn: false });

    await service.updateLeaderboardOptIn('cust1', false);

    const updateCall = prisma.customer.update.mock.calls[0][0];
    expect(updateCall.data.leaderboardOptIn).toBe(false);
    expect(updateCall.data.nickname).toBeUndefined();
  });
});
