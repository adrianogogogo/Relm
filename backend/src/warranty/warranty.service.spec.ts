import { BadRequestException } from '@nestjs/common';
import { WarrantyService } from './warranty.service';

describe('WarrantyService', () => {
  it('should be defined', () => {
    const service = new WarrantyService({} as any, {} as any, {} as any, {} as any, {} as any, {} as any);
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    function buildService(prismaOverrides: any) {
      const prisma = {
        user: { findUnique: jest.fn() },
        warrantyClaim: { findMany: jest.fn().mockResolvedValue([]) },
        ...prismaOverrides,
      };
      const service = new WarrantyService(
        prisma as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
      );
      return { service, prisma };
    }

    it('escopa por loja: papel LOJA usa o storeId do usuário no where', async () => {
      const { service, prisma } = buildService({});
      prisma.user.findUnique.mockResolvedValue({ storeId: 'loja-A' });

      await service.findAll({}, { requesterUserId: 'user-1', requesterRole: 'LOJA' });

      expect(prisma.warrantyClaim.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ storeId: 'loja-A' }),
        }),
      );
    });

    it('não confia no query param: filters.storeId de outra loja é ignorado para papel LOJA', async () => {
      const { service, prisma } = buildService({});
      prisma.user.findUnique.mockResolvedValue({ storeId: 'loja-A' });

      await service.findAll(
        { storeId: 'loja-B' },
        { requesterUserId: 'user-1', requesterRole: 'LOJA' },
      );

      expect(prisma.warrantyClaim.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ storeId: 'loja-A' }),
        }),
      );
    });

    it('loja sem vínculo: rejeita com BadRequestException', async () => {
      const { service, prisma } = buildService({});
      prisma.user.findUnique.mockResolvedValue({ storeId: null });

      await expect(
        service.findAll({}, { requesterUserId: 'user-1', requesterRole: 'LOJA' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('admin não é escopado: papel ADMIN_RELM sem filters.storeId não filtra por loja', async () => {
      const { service, prisma } = buildService({});

      await service.findAll({}, { requesterUserId: 'user-2', requesterRole: 'ADMIN_RELM' });

      const call = prisma.warrantyClaim.findMany.mock.calls[0][0];
      expect(call.where.storeId).toBeUndefined();
    });

    it('máscara: papel LOJA recebe telefone mascarado (diferente do original)', async () => {
      const originalPhone = '11912345678';
      const { service, prisma } = buildService({
        warrantyClaim: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 'claim-1',
              customer: {
                id: 'cust-1',
                fullName: 'Fulano de Tal',
                email: 'fulano@exemplo.com',
                phone: originalPhone,
              },
            },
          ]),
        },
      });
      prisma.user.findUnique.mockResolvedValue({ storeId: 'loja-A' });

      const result = await service.findAll(
        {},
        { requesterUserId: 'user-1', requesterRole: 'LOJA' },
      );

      expect(result[0].customer.phone).not.toBe(originalPhone);
      expect(result[0].customer.fullName).toBe('Fulano de Tal');
    });
  });
});
