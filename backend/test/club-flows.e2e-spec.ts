/**
 * ONDA 8 — Testes de fluxos críticos do clube de assinatura.
 *
 * DECISÃO DE DESIGN: a CI não possui banco de dados, então um e2e HTTP real
 * (bootstrap do AppModule + Postgres) é impraticável aqui. Estes testes são
 * "integration-style": fazem o wiring dos serviços REAIS (PaymentsService,
 * RewardsService) via @nestjs/testing, injetando um PrismaService MOCKADO
 * (jest-mock). Rodam sem banco, determinísticos, e cobrem:
 *
 *   (a) Fluxo de pagamento manual: loja registra (PENDING) → Relm confirma →
 *       assinatura renovada para PLUS.
 *   (b) Resgate em pré-venda bloqueado para membro CARE.
 *
 * O tier é sempre derivado do banco (mock), nunca do payload — os testes
 * verificam justamente esse enforcement server-side.
 */
import { Test } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { PaymentStatus, SubStatus, TierLevel } from '@prisma/client';

import { PrismaService } from '../src/prisma/prisma.service';
import { PaymentsService } from '../src/payments/payments.service';
import { SubscriptionsService } from '../src/subscriptions/subscriptions.service';
import { NotificationsService } from '../src/notifications/notifications.service';
import { GamificationService } from '../src/gamification/gamification.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PointsService } from '../src/points/points.service';
import { EngagementService } from '../src/engagement/engagement.service';
import { RewardsService } from '../src/rewards/rewards.service';
import { ClubSettingsService } from '../src/club-settings/club-settings.service';
import { CronHealthService } from '../src/common/cron-health.service';
import { PAYMENT_GATEWAY } from '../src/payments/gateway/payment-gateway.interface';

// ── Helpers de mock ──────────────────────────────────────────────────────────

/** $transaction que executa o callback passando o próprio mock como `tx`. */
function makePrismaMock(overrides: any = {}) {
  const base: any = {
    customer: { findUnique: jest.fn(), update: jest.fn(), count: jest.fn() },
    subscription: { create: jest.fn(), upsert: jest.fn(), findUnique: jest.fn() },
    payment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    auditLog: { create: jest.fn() },
    catalogItem: { findUnique: jest.fn(), update: jest.fn() },
    pointsLedger: { create: jest.fn() },
    voucher: { create: jest.fn() },
    clubSettings: { findUnique: jest.fn() },
  };
  Object.assign(base, overrides);
  base.$transaction = jest.fn((cb: any) => cb(base));
  return base;
}

describe('Club flows (integration-style, no DB)', () => {
  // ── (a) Pagamento manual: loja registra → Relm confirma → renova ──────────
  describe('Fluxo de pagamento manual (loja registra → Relm confirma → renova)', () => {
    let payments: PaymentsService;
    let prisma: any;

    const CUSTOMER_ID = 'cust-1';
    const STORE_ID = 'store-1';
    const SUB_ID = 'sub-1';
    const PAYMENT_ID = 'pay-1';

    beforeEach(async () => {
      prisma = makePrismaMock();

      // getAnnualFee() → ClubSettings.plus_annual_fee = 300
      prisma.clubSettings.findUnique.mockResolvedValue({ key: 'plus_annual_fee', value: '300' });

      // Cliente pertence à loja e já tem assinatura CARE ACTIVE.
      prisma.customer.findUnique.mockImplementation(({ select }: any) => {
        if (select?.storeId) return Promise.resolve({ storeId: STORE_ID, fullName: 'João' });
        return Promise.resolve({
          id: CUSTOMER_ID,
          storeId: STORE_ID,
          fullName: 'João',
          subscription: { id: SUB_ID, tier: TierLevel.CARE, status: SubStatus.ACTIVE },
        });
      });

      prisma.payment.create.mockResolvedValue({ id: PAYMENT_ID, status: PaymentStatus.PENDING });
      prisma.payment.findUnique.mockResolvedValue({
        id: PAYMENT_ID,
        customerId: CUSTOMER_ID,
        status: PaymentStatus.PENDING,
        gatewayId: null,
      });
      prisma.payment.updateMany.mockResolvedValue({ count: 1 });
      prisma.subscription.upsert.mockResolvedValue({ id: SUB_ID, tier: TierLevel.PLUS });
      prisma.auditLog.create.mockResolvedValue({});

      const gatewayMock = {
        createCharge: jest.fn().mockResolvedValue({ gatewayId: null }),
        confirmPayment: jest.fn().mockResolvedValue({
          confirmed: true,
          paidAt: new Date(),
          gatewayId: null,
        }),
      };

      const moduleRef = await Test.createTestingModule({
        providers: [
          PaymentsService,
          SubscriptionsService,
          { provide: PrismaService, useValue: prisma },
          { provide: PAYMENT_GATEWAY, useValue: gatewayMock },
          { provide: NotificationsService, useValue: { notifyTeam: jest.fn(), notifyStore: jest.fn() } },
          { provide: GamificationService, useValue: { checkAndGrant: jest.fn().mockResolvedValue(undefined) } },
          { provide: PointsService, useValue: { earnPoints: jest.fn().mockResolvedValue(undefined) } },
          { provide: EngagementService, useValue: {} },
          { provide: EventEmitter2, useValue: { emit: jest.fn() } },
          { provide: CronHealthService, useValue: new CronHealthService() },
        ],
      }).compile();

      payments = moduleRef.get(PaymentsService);
    });

    it('loja registra pagamento → nasce PENDING (valor forçado por ClubSettings)', async () => {
      const actor = { id: 'store-user-1', type: 'STORE_USER' as const, storeId: STORE_ID };

      // Loja tenta enviar amount=1 (tampering) — deve ser ignorado.
      await payments.register({ customerId: CUSTOMER_ID, amount: 1 }, actor);

      expect(prisma.payment.create).toHaveBeenCalledTimes(1);
      const created = prisma.payment.create.mock.calls[0][0].data;
      expect(created.status).toBe(PaymentStatus.PENDING);
      // Valor derivado de ClubSettings (300), não do payload (1).
      expect(String(created.amount)).toBe('300');
    });

    it('Relm confirma pagamento PENDING → assinatura renovada para PLUS', async () => {
      const actor = { id: 'relm-user-1', type: 'USER' as const };

      const result = await payments.confirm(PAYMENT_ID, actor);

      // Pagamento marcado CONFIRMED de forma atômica.
      expect(prisma.payment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: PAYMENT_ID, status: PaymentStatus.PENDING },
          data: expect.objectContaining({ status: PaymentStatus.CONFIRMED }),
        }),
      );
      // Assinatura renovada para PLUS (via SubscriptionsService.renewFromPayment).
      expect(prisma.subscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { customerId: CUSTOMER_ID },
          update: expect.objectContaining({ tier: TierLevel.PLUS, status: SubStatus.ACTIVE }),
        }),
      );
      expect(result).toBeDefined();
    });
  });

  // ── (b) Pré-venda bloqueada para CARE ─────────────────────────────────────
  describe('Resgate de pré-venda bloqueado para membro CARE', () => {
    let rewards: RewardsService;
    let prisma: any;

    beforeEach(async () => {
      prisma = makePrismaMock();

      const moduleRef = await Test.createTestingModule({
        providers: [
          RewardsService,
          { provide: PrismaService, useValue: prisma },
          {
            provide: PointsService,
            // Saldo alto para garantir que o bloqueio é pela pré-venda, não por saldo.
            useValue: {
              getBalance: jest.fn().mockResolvedValue(999999),
              getBalances: jest.fn().mockResolvedValue({
                accumulated: 999999, monthly: 0, total: 999999,
              }),
              redeemPoints: jest.fn().mockResolvedValue({ fromMonthly: 0, fromAccumulated: 0 }),
            },
          },
          {
            provide: ClubSettingsService,
            useValue: {
              getSettings: jest.fn().mockResolvedValue({
                pointValueBrl: 0.05, voucherValidityDays: 60,
              }),
            },
          },
        ],
      }).compile();

      rewards = moduleRef.get(RewardsService);
    });

    it('lança ForbiddenException quando item em pré-venda exige PLUS e cliente é CARE', async () => {
      const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      prisma.catalogItem.findUnique.mockResolvedValue({
        id: 'item-1',
        title: 'Item Exclusivo',
        active: true,
        pointsCost: 100,
        stock: 10,
        presaleUntil: future,
        presaleTier: TierLevel.PLUS,
      });
      // Tier derivado do BANCO (não do payload): assinatura CARE ACTIVE.
      prisma.subscription.findUnique.mockResolvedValue({
        tier: TierLevel.CARE,
        status: SubStatus.ACTIVE,
      });

      await expect(
        rewards.redeemReward({ customerId: 'cust-care', catalogItemId: 'item-1' }),
      ).rejects.toBeInstanceOf(ForbiddenException);

      // Nenhum voucher/débito criado.
      expect(prisma.voucher.create).not.toHaveBeenCalled();
      expect(prisma.pointsLedger.create).not.toHaveBeenCalled();
    });
  });
});
