import { WarrantyService } from './warranty.service';

describe('WarrantyService auto-task idempotency', () => {
  function makeService(existingStageTaskCount: number) {
    const prisma: any = {
      warrantyClaim: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'c1', status: 'EM_ANALISE', protocolNumber: 'GRT-2026-TEST',
          customer: { email: 'x@y.com', fullName: 'X' }, product: { model: 'M' },
          assignedTo: null,
        }),
        update: jest.fn().mockResolvedValue({ id: 'c1', status: 'APROVADO', protocolNumber: 'GRT-2026-TEST', customer: { email: 'x@y.com', fullName: 'X' }, product: { model: 'M' } }),
      },
      warrantyEvent: { create: jest.fn().mockResolvedValue({}) },
      warrantyTask: {
        count: jest.fn().mockResolvedValue(existingStageTaskCount),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      warrantyTaskTemplate: {
        findMany: jest.fn().mockResolvedValue([
          { title: 'Autorizar', targetRole: 'GERENTE_RELM', toStatus: 'APROVADO', sortOrder: 0 },
        ]),
      },
      user: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const noop: any = {
      sendWarrantyApprovalEmail: jest.fn().mockResolvedValue(undefined),
      log: jest.fn().mockResolvedValue(undefined),
      notifyTeam: jest.fn().mockResolvedValue(undefined),
    };
    // Constructor order: prisma, customersService, productsService,
    // emailService, notificationsService, auditLogsService.
    const service = new WarrantyService(prisma, noop, noop, noop, noop, noop);
    return { service, prisma };
  }

  it('does NOT regenerate tasks when the stage already has auto-tasks', async () => {
    const { service, prisma } = makeService(2);
    await service.approveWarranty('c1', 'user-1');
    expect(prisma.warrantyTask.createMany).not.toHaveBeenCalled();
  });

  it('generates tasks the first time a stage is entered', async () => {
    const { service, prisma } = makeService(0);
    await service.approveWarranty('c1', 'user-1');
    expect(prisma.warrantyTask.createMany).toHaveBeenCalledTimes(1);
  });
});
