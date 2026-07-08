/// <reference types="jest" />
import { WorkshopService } from './workshop.service';
import { BadRequestException } from '@nestjs/common';
import {
  ServiceType,
  ServiceStatus,
  LogisticsStatus,
  TierLevel,
  SubStatus,
} from '@prisma/client';

// ── Helpers ───────────────────────────────────────────────────────────────

function makeService(opts: {
  tier?: TierLevel;
  usedThisYear?: number;
  order?: any;
  updateManyCount?: number;
} = {}) {
  const tier = opts.tier ?? TierLevel.CARE;

  const created = { id: 'order-1' };

  const tx: any = {
    serviceOrder: {
      count: jest.fn().mockResolvedValue(opts.usedThisYear ?? 0),
      create: jest.fn().mockResolvedValue(created),
    },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
  };

  const prisma: any = {
    customer: {
      findUnique: jest.fn().mockResolvedValue({ id: 'cust1', currentTier: tier }),
    },
    subscription: {
      findUnique: jest.fn().mockResolvedValue(
        tier === TierLevel.PLUS
          ? { tier: TierLevel.PLUS, status: SubStatus.ACTIVE }
          : { tier: TierLevel.CARE, status: SubStatus.ACTIVE },
      ),
    },
    serviceOrder: {
      findUnique: jest.fn().mockResolvedValue(opts.order ?? null),
      updateMany: jest.fn().mockResolvedValue({ count: opts.updateManyCount ?? 1 }),
    },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
    $transaction: jest.fn((cb: any) => cb(tx)),
  };

  const points: any = { addWorkshopCompletionPoints: jest.fn() };
  const service = new WorkshopService(prisma, points);
  return { service, prisma, tx, created };
}

const baseDto = {
  customerId: 'cust1',
  storeId: 'store1',
  bikeModel: 'Relm Carbon',
  scheduledFor: new Date('2026-07-10T09:00:00Z'),
};

// ── Cota anual (allowance enforcement) ──────────────────────────────────────

describe('WorkshopService.bookSlot — cota anual', () => {
  it('CARE: 1ª revisão básica é permitida', async () => {
    const { service, tx } = makeService({ tier: TierLevel.CARE, usedThisYear: 0 });
    const order = await service.bookSlot({
      ...baseDto,
      serviceType: ServiceType.REVISION_BASIC,
    });
    expect(order).toEqual({ id: 'order-1' });
    expect(tx.serviceOrder.create).toHaveBeenCalled();
  });

  it('CARE: 2ª revisão básica no ano é rejeitada', async () => {
    const { service, tx } = makeService({ tier: TierLevel.CARE, usedThisYear: 1 });
    await expect(
      service.bookSlot({ ...baseDto, serviceType: ServiceType.REVISION_BASIC }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.serviceOrder.create).not.toHaveBeenCalled();
  });

  it('CARE: revisão completa (cota 0) é bloqueada antes da transação', async () => {
    const { service } = makeService({ tier: TierLevel.CARE });
    await expect(
      service.bookSlot({ ...baseDto, serviceType: ServiceType.REVISION_COMPLETE }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('PLUS: 2ª revisão básica ainda dentro da cota (2) é permitida', async () => {
    const { service, tx } = makeService({ tier: TierLevel.PLUS, usedThisYear: 1 });
    const order = await service.bookSlot({
      ...baseDto,
      serviceType: ServiceType.REVISION_BASIC,
    });
    expect(order).toEqual({ id: 'order-1' });
    expect(tx.serviceOrder.create).toHaveBeenCalled();
  });

  it('PLUS: bike fitting dentro da cota (1) é permitido', async () => {
    const { service, tx } = makeService({ tier: TierLevel.PLUS, usedThisYear: 0 });
    await service.bookSlot({ ...baseDto, serviceType: ServiceType.BIKE_FITTING });
    expect(tx.serviceOrder.create).toHaveBeenCalled();
  });

  it('PLUS: 2º bike fitting no ano (cota 1) é rejeitado', async () => {
    const { service, tx } = makeService({ tier: TierLevel.PLUS, usedThisYear: 1 });
    await expect(
      service.bookSlot({ ...baseDto, serviceType: ServiceType.BIKE_FITTING }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.serviceOrder.create).not.toHaveBeenCalled();
  });

  it('BUSCA_ENTREGA exige endereço de coleta', async () => {
    const { service } = makeService({ tier: TierLevel.PLUS, usedThisYear: 0 });
    await expect(
      service.bookSlot({ ...baseDto, serviceType: ServiceType.BUSCA_ENTREGA }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('BUSCA_ENTREGA PLUS com endereço cria com logisticsStatus inicial', async () => {
    const { service, tx } = makeService({ tier: TierLevel.PLUS, usedThisYear: 0 });
    await service.bookSlot({
      ...baseDto,
      serviceType: ServiceType.BUSCA_ENTREGA,
      pickupAddress: 'Rua X, 123',
    });
    const data = tx.serviceOrder.create.mock.calls[0][0].data;
    expect(data.logisticsStatus).toBe(LogisticsStatus.COLETA_AGENDADA);
    expect(data.pickupAddress).toBe('Rua X, 123');
  });

  it('tier é derivado da Subscription, não do payload', async () => {
    const { service, prisma } = makeService({ tier: TierLevel.CARE, usedThisYear: 1 });
    // Mesmo que o payload "quisesse" ser PLUS, a subscription manda.
    await expect(
      service.bookSlot({ ...baseDto, serviceType: ServiceType.REVISION_BASIC }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.subscription.findUnique).toHaveBeenCalled();
  });
});

// ── Logística (transições) ──────────────────────────────────────────────────

describe('WorkshopService.advanceLogistics', () => {
  const buscaOrder = {
    id: 'order-1',
    serviceType: ServiceType.BUSCA_ENTREGA,
    logisticsStatus: LogisticsStatus.COLETA_AGENDADA,
  };

  it('avança COLETA_AGENDADA → EM_TRANSPORTE_COLETA', async () => {
    const { service, prisma } = makeService({ order: buscaOrder, updateManyCount: 1 });
    await service.advanceLogistics('order-1', LogisticsStatus.EM_TRANSPORTE_COLETA);
    expect(prisma.serviceOrder.updateMany).toHaveBeenCalledWith({
      where: { id: 'order-1', logisticsStatus: LogisticsStatus.COLETA_AGENDADA },
      data: { logisticsStatus: LogisticsStatus.EM_TRANSPORTE_COLETA },
    });
  });

  it('rejeita transição inválida (pular etapas)', async () => {
    const { service, prisma } = makeService({ order: buscaOrder });
    await expect(
      service.advanceLogistics('order-1', LogisticsStatus.ENTREGUE),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.serviceOrder.updateMany).not.toHaveBeenCalled();
  });

  it('rejeita logística em ordem que não é BUSCA_ENTREGA', async () => {
    const revOrder = { id: 'o2', serviceType: ServiceType.REVISION_BASIC, logisticsStatus: null };
    const { service } = makeService({ order: revOrder });
    await expect(
      service.advanceLogistics('o2', LogisticsStatus.EM_TRANSPORTE_COLETA),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('erro quando a corrida perde (updateMany count=0)', async () => {
    const { service } = makeService({ order: buscaOrder, updateManyCount: 0 });
    await expect(
      service.advanceLogistics('order-1', LogisticsStatus.EM_TRANSPORTE_COLETA),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
