import { BadRequestException, NotFoundException } from '@nestjs/common';
import { computeWarrantyEnd, SalesService } from './sales.service';

describe('SalesService.linkItemToProduct — curadoria', () => {
  it('rejeita com NotFoundException quando o item de venda nao existe', async () => {
    const prisma: any = {
      saleItem: { findUnique: jest.fn().mockResolvedValue(null), update: jest.fn() },
      product: { findUnique: jest.fn() },
    };
    const service = new SalesService(prisma);

    await expect(service.linkItemToProduct('item1', 'prod1')).rejects.toThrow(NotFoundException);
    await expect(service.linkItemToProduct('item1', 'prod1')).rejects.toThrow('Item de venda não encontrado');
  });

  it('rejeita com NotFoundException quando o produto nao existe', async () => {
    const prisma: any = {
      saleItem: { findUnique: jest.fn().mockResolvedValue({ id: 'item1' }), update: jest.fn() },
      product: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    const service = new SalesService(prisma);

    await expect(service.linkItemToProduct('item1', 'prod1')).rejects.toThrow(NotFoundException);
    await expect(service.linkItemToProduct('item1', 'prod1')).rejects.toThrow('Produto não encontrado');
  });

  it('caminho feliz: chama saleItem.update uma vez com where/data corretos', async () => {
    const update = jest.fn().mockResolvedValue({ id: 'item1', productId: 'prod1' });
    const prisma: any = {
      saleItem: { findUnique: jest.fn().mockResolvedValue({ id: 'item1' }), update },
      product: { findUnique: jest.fn().mockResolvedValue({ id: 'prod1' }) },
    };
    const service = new SalesService(prisma);

    await service.linkItemToProduct('item1', 'prod1');

    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith({ where: { id: 'item1' }, data: { productId: 'prod1' } });
  });
});

describe('SalesService.findAll — escopo por loja', () => {
  it('rejeita com BadRequestException quando usuario LOJA nao tem storeId', async () => {
    const prisma: any = {
      user: { findUnique: jest.fn().mockResolvedValue({ role: 'LOJA', storeId: null }) },
      sale: { findMany: jest.fn(), count: jest.fn() },
      $transaction: jest.fn(),
    };
    const service = new SalesService(prisma);

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
