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
        storeUser: { findUnique: jest.fn().mockResolvedValue(null) },
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

    it('escopa por loja: papel LOJA vê garantias da própria loja OU órfãs de cliente seu', async () => {
      const { service, prisma } = buildService({});
      prisma.user.findUnique.mockResolvedValue({ storeId: 'loja-A' });

      await service.findAll({}, { requesterUserId: 'user-1', requesterRole: 'LOJA' });

      expect(prisma.warrantyClaim.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: [
              {
                OR: [
                  { storeId: 'loja-A' },
                  { AND: [{ storeId: null }, { customer: { storeId: 'loja-A' } }] },
                ],
              },
            ],
          }),
        }),
      );
    });

    // Regressão do P0 do plano 010. O OR que cobria garantia órfã era
    // incondicional, então uma garantia DA loja-B cujo cliente é da loja-A
    // vazava para a loja-A. O braço do cliente só vale quando storeId é nulo.
    it('não vaza entre lojas: garantia com storeId de outra loja fica fora, mesmo se o cliente é meu', async () => {
      const { service, prisma } = buildService({});
      prisma.user.findUnique.mockResolvedValue({ storeId: 'loja-A' });

      await service.findAll({}, { requesterUserId: 'user-1', requesterRole: 'LOJA' });

      const { where } = prisma.warrantyClaim.findMany.mock.calls[0][0];
      const customerArm = where.AND[0].OR.find((c: any) => !('storeId' in c));
      // O braço do cliente precisa exigir storeId nulo — sem isso, claim de
      // outra loja com cliente meu entraria no resultado.
      expect(customerArm.AND).toContainEqual({ storeId: null });
    });

    it('não confia no query param: filters.storeId de outra loja é ignorado para papel LOJA', async () => {
      const { service, prisma } = buildService({});
      prisma.user.findUnique.mockResolvedValue({ storeId: 'loja-A' });

      await service.findAll(
        { storeId: 'loja-B' },
        { requesterUserId: 'user-1', requesterRole: 'LOJA' },
      );

      const { where } = prisma.warrantyClaim.findMany.mock.calls[0][0];
      expect(JSON.stringify(where)).toContain('loja-A');
      expect(JSON.stringify(where)).not.toContain('loja-B');
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
