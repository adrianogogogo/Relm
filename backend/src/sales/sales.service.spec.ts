import { BadRequestException } from '@nestjs/common';
import { computeWarrantyEnd, SalesService } from './sales.service';

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
