import { computeWarrantyEnd } from './sales.service';

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
