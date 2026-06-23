import { CustomersService } from './customers.service';

function makeService(role: string) {
  const customerRow = {
    id: 'c1', fullName: 'Maria Silva', email: 'm@x.com',
    cpf: '12345678901', phone: '11912344321', storeId: 's1',
    warrantyClaims: [], store: null,
  };
  const prisma: any = {
    customer: { findUnique: jest.fn().mockResolvedValue({ ...customerRow }) },
    user: { findUnique: jest.fn().mockResolvedValue({ storeId: 's1' }) },
  };
  const service = new CustomersService(prisma, {} as any);
  return { service };
}

describe('CustomersService.findOne masking', () => {
  it('masks CPF/phone for LOJA', async () => {
    const { service } = makeService('LOJA');
    const result: any = await service.findOne('c1', { requesterUserId: 'u1', requesterRole: 'LOJA' });
    expect(result.cpf).toBe('123.***.**-01');
    expect(result.phone).toBe('(11) 9****-4321');
  });
  it('returns raw CPF for ADMIN_RELM', async () => {
    const { service } = makeService('ADMIN_RELM');
    const result: any = await service.findOne('c1', { requesterUserId: 'u1', requesterRole: 'ADMIN_RELM' });
    expect(result.cpf).toBe('12345678901');
  });
});
