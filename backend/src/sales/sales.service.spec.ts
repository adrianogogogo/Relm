import { BadRequestException, NotFoundException } from '@nestjs/common';
import { computeWarrantyEnd, SalesService } from './sales.service';

// O SalesService passou a depender do PointsService (crédito de pontos no
// registro da venda e no complemento da curadoria). Helper único para não
// repetir o mock em todo teste.
function makeService(prisma: any, points: any = {}) {
  const pointsMock = { syncSaleItemPoints: jest.fn().mockResolvedValue(null), ...points };
  return { service: new SalesService(prisma, pointsMock as any), points: pointsMock };
}

describe('SalesService.linkItemToProduct — curadoria', () => {
  it('rejeita com NotFoundException quando o item de venda nao existe', async () => {
    const prisma: any = {
      saleItem: { findUnique: jest.fn().mockResolvedValue(null), update: jest.fn() },
      product: { findUnique: jest.fn() },
    };
    const { service } = makeService(prisma);

    await expect(service.linkItemToProduct('item1', 'prod1')).rejects.toThrow(NotFoundException);
    await expect(service.linkItemToProduct('item1', 'prod1')).rejects.toThrow('Item de venda não encontrado');
  });

  it('rejeita com NotFoundException quando o produto nao existe', async () => {
    const prisma: any = {
      saleItem: {
        findUnique: jest.fn().mockResolvedValue({ id: 'item1', sale: { customerId: 'c1' } }),
        update: jest.fn(),
      },
      product: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    const { service } = makeService(prisma);

    await expect(service.linkItemToProduct('item1', 'prod1')).rejects.toThrow(NotFoundException);
    await expect(service.linkItemToProduct('item1', 'prod1')).rejects.toThrow('Produto não encontrado');
  });

  it('caminho feliz: chama saleItem.update uma vez com where/data corretos', async () => {
    const update = jest.fn().mockResolvedValue({ id: 'item1', productId: 'prod1' });
    const prisma: any = {
      saleItem: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'item1', commercialName: 'Roda Aro 29', sale: { customerId: 'c1' },
        }),
        update,
      },
      product: { findUnique: jest.fn().mockResolvedValue({ id: 'prod1' }) },
    };
    const { service } = makeService(prisma);

    await service.linkItemToProduct('item1', 'prod1');

    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith({ where: { id: 'item1' }, data: { productId: 'prod1' } });
  });

  it('curadoria dispara o complemento de pontos com o item ja vinculado', async () => {
    const updated = { id: 'item1', productId: 'prod1', unitPrice: 500, quantity: 1 };
    const prisma: any = {
      saleItem: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'item1', commercialName: 'Roda Aro 29', sale: { customerId: 'cli-1' },
        }),
        update: jest.fn().mockResolvedValue(updated),
      },
      product: { findUnique: jest.fn().mockResolvedValue({ id: 'prod1' }) },
    };
    const { service, points } = makeService(prisma);

    await service.linkItemToProduct('item1', 'prod1');

    // O item passado precisa ser o ATUALIZADO — com o productId já gravado.
    // Passando o item antigo, a regra do produto nunca seria encontrada e o
    // complemento sairia zerado, que é justamente o ponto da curadoria.
    expect(points.syncSaleItemPoints).toHaveBeenCalledWith(
      'cli-1',
      'item1',
      updated,
      expect.stringContaining('Curadoria'),
    );
  });
});

describe('SalesService.create — crédito de pontos', () => {
  function prismaForCreate(items: any[]) {
    return {
      user: { findUnique: jest.fn().mockResolvedValue(null) },
      customer: { findUnique: jest.fn().mockResolvedValue({ id: 'cli-1' }) },
      sale: {
        create: jest.fn().mockResolvedValue({ id: 'venda-1', customerId: 'cli-1', items }),
      },
    } as any;
  }

  const dto: any = {
    customerId: 'cli-1',
    saleDate: '2026-08-10T00:00:00Z',
    items: [{ commercialName: 'Roda Aro 29' }],
  };

  it('credita pontos de cada item da venda', async () => {
    const items = [
      { id: 'it-1', commercialName: 'Roda Aro 29', unitPrice: 500, quantity: 1 },
      { id: 'it-2', commercialName: 'Capacete', unitPrice: 300, quantity: 2 },
    ];
    const { service, points } = makeService(prismaForCreate(items));

    await service.create(dto);

    expect(points.syncSaleItemPoints).toHaveBeenCalledTimes(2);
    expect(points.syncSaleItemPoints).toHaveBeenCalledWith(
      'cli-1', 'it-1', items[0], expect.stringContaining('Roda Aro 29'),
    );
  });

  // A venda é o registro primário; pontos são recuperáveis (o sync credita só
  // a diferença). Falhar a venda no balcão por causa do ledger seria pior.
  it('falha no crédito de pontos NÃO derruba o registro da venda', async () => {
    const items = [{ id: 'it-1', commercialName: 'Roda Aro 29', unitPrice: 500, quantity: 1 }];
    const { service } = makeService(prismaForCreate(items), {
      syncSaleItemPoints: jest.fn().mockRejectedValue(new Error('ledger fora do ar')),
    });

    await expect(service.create(dto)).resolves.toMatchObject({ id: 'venda-1' });
  });
});

describe('SalesService.findAll — escopo por loja', () => {
  it('rejeita com BadRequestException quando usuario LOJA nao tem storeId', async () => {
    const prisma: any = {
      user: { findUnique: jest.fn().mockResolvedValue({ role: 'LOJA', storeId: null }) },
      sale: { findMany: jest.fn(), count: jest.fn() },
      $transaction: jest.fn(),
    };
    const { service } = makeService(prisma);

    await expect(service.findAll({}, 'user1')).rejects.toThrow(BadRequestException);
    await expect(service.findAll({}, 'user1')).rejects.toThrow('Usuário de loja sem loja vinculada.');
  });
});

describe('computeWarrantyEnd', () => {
  it('soma o prazo em dias a data da venda', () => {
    expect(computeWarrantyEnd(new Date('2026-07-22T00:00:00Z'), 90))
      .toEqual(new Date('2026-10-20T00:00:00Z'));
  });

  it('retorna null quando warrantyDays e null', () => {
    expect(computeWarrantyEnd(new Date('2026-07-22T00:00:00Z'), null)).toBeNull();
  });

  it('retorna null quando warrantyDays e undefined', () => {
    expect(computeWarrantyEnd(new Date('2026-07-22T00:00:00Z'), undefined)).toBeNull();
  });

  it('retorna a propria data da venda quando warrantyDays e zero (nao null - trava bug do falsy)', () => {
    const saleDate = new Date('2026-07-22T00:00:00Z');
    expect(computeWarrantyEnd(saleDate, 0)).toEqual(saleDate);
  });
});
