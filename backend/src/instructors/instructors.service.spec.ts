/// <reference types="jest" />
import { InstructorsService } from './instructors.service';
import { TierLevel, VoucherStatus } from '@prisma/client';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

// Cada teste aqui trava uma decisão do plano 012. Se um deles ficar vermelho,
// alguém desfez uma decisão de produto — não é flake.

function makeInstructor(over: Partial<any> = {}) {
  return {
    id: 'i1',
    name: 'Assessoria Teste',
    description: null,
    benefit: '5% para membros',
    benefitPlus: '15% para Plus',
    phone: '11912345678',
    link: 'https://exemplo.test',
    logoUrl: null,
    city: 'São Paulo',
    state: 'SP',
    remote: false,
    active: true,
    termsAcceptedAt: new Date('2026-08-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  };
}

function makeCustomer(over: Partial<any> = {}) {
  return {
    fullName: 'Cliente Teste',
    cpf: '12345678901',
    phone: '11987654321',
    currentTier: TierLevel.CARE,
    subscription: null,
    state: 'SP',
    ...over,
  };
}

// O Prisma real devolve APENAS as colunas do `select`. Sem isto o mock entrega
// o registro inteiro e o teste de vazamento de contato passa por engano.
function applySelect(row: any, select?: Record<string, any>) {
  if (!select) return row;
  return Object.fromEntries(
    Object.keys(select)
      .filter((k) => select[k])
      .map((k) => [k, row[k] ?? null]),
  );
}

function makeService(opts: any = {}) {
  const instructor = opts.instructor ?? makeInstructor();
  const customer = opts.customer ?? makeCustomer();
  const created: any[] = [];

  const prisma: any = {
    customer: { findUnique: jest.fn().mockResolvedValue(customer) },
    instructor: {
      findUnique: jest.fn().mockResolvedValue(opts.instructorMissing ? null : instructor),
      findMany: jest
        .fn()
        .mockImplementation(({ select }: any = {}) =>
          Promise.resolve([applySelect(instructor, select)]),
        ),
      update: jest.fn().mockImplementation(({ data }: any) => ({ ...instructor, ...data })),
    },
    instructorSpecialty: { findMany: jest.fn().mockResolvedValue([]) },
    user: {
      findUnique: jest.fn().mockResolvedValue({ instructorId: opts.userInstructorId ?? 'i1' }),
    },
    voucher: {
      findFirst: jest.fn().mockResolvedValue(opts.existingVoucher ?? null),
      findUnique: jest.fn().mockResolvedValue(opts.voucherByCode ?? null),
      findMany: jest.fn().mockResolvedValue(opts.vouchers ?? []),
      create: jest.fn().mockImplementation(({ data }: any) => {
        const v = { id: `v${created.length + 1}`, ...data };
        created.push(v);
        return Promise.resolve(v);
      }),
      update: jest.fn(),
    },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
  };

  return { service: new InstructorsService(prisma), prisma, created, instructor, customer };
}

describe('InstructorsService', () => {
  describe('findForCustomer', () => {
    it('não expõe contato do instrutor na listagem (decisão 6)', async () => {
      const { service, prisma } = makeService();

      const result = await service.findForCustomer('c1');

      const select = prisma.instructor.findMany.mock.calls[0][0].select;
      expect(select.phone).toBeUndefined();
      expect(select.link).toBeUndefined();
      expect(select.benefit).toBe(true);
      expect(select.benefitPlus).toBe(true);
      // Nada no payload devolvido carrega contato.
      expect(JSON.stringify(result)).not.toContain('11912345678');
      expect(JSON.stringify(result)).not.toContain('exemplo.test');
    });

    it('devolve o tier do cliente para a tela destacar a linha certa', async () => {
      const { service } = makeService({
        customer: makeCustomer({ currentTier: TierLevel.PLUS }),
      });

      const result = await service.findForCustomer('c1');

      expect(result.customerTier).toBe(TierLevel.PLUS);
      expect(result.isPlus).toBe(true);
    });
  });

  describe('createCredential', () => {
    it('é idempotente: duas chamadas devolvem o mesmo código', async () => {
      const first = makeService();
      const created = await first.service.createCredential('c1', 'i1');

      const second = makeService({
        existingVoucher: {
          id: 'v1',
          code: created.code,
          expiresAt: created.expiresAt,
          status: VoucherStatus.UNUSED,
        },
      });
      const again = await second.service.createCredential('c1', 'i1');

      expect(again.code).toBe(created.code);
      expect(second.prisma.voucher.create).not.toHaveBeenCalled();
      // Vínculo reaproveitado não gera log novo.
      expect(second.prisma.auditLog.create).not.toHaveBeenCalled();
    });

    it('nasce UNUSED e nada no fluxo marca USED (é vínculo, não cupom)', async () => {
      const { service, prisma, created } = makeService();

      await service.createCredential('c1', 'i1');

      expect(created[0].status).toBe(VoucherStatus.UNUSED);
      expect(prisma.voucher.update).not.toHaveBeenCalled();
    });

    it('é grátis: não gasta pontos nem congela valor', async () => {
      const { service, created } = makeService();

      await service.createCredential('c1', 'i1');

      expect(created[0].pointsSpent).toBeNull();
      expect(created[0].brlValue).toBeNull();
      // O service recebe só o Prisma: credencial não é resgate de pontos.
      expect(InstructorsService.length).toBe(1);
    });

    it('Plus: validade da credencial = vencimento da assinatura', async () => {
      const subExpiry = new Date('2027-03-10');
      const { service, created } = makeService({
        customer: makeCustomer({
          currentTier: TierLevel.PLUS,
          subscription: { expiresAt: subExpiry },
        }),
      });

      await service.createCredential('c1', 'i1');

      expect(created[0].expiresAt).toEqual(subExpiry);
    });

    it('Care: validade de 12 meses (a assinatura Care não tem vencimento)', async () => {
      const { service, created } = makeService();

      await service.createCredential('c1', 'i1');

      const expected = new Date();
      expected.setFullYear(expected.getFullYear() + 1);
      // Tolerância de 1 min: o service usa `new Date()` no momento da criação.
      expect(Math.abs(created[0].expiresAt.getTime() - expected.getTime())).toBeLessThan(60_000);
    });

    it('revela o contato — este é o único método que devolve telefone/link', async () => {
      const { service } = makeService();

      const result = await service.createCredential('c1', 'i1');

      expect(result.contact).toEqual({ phone: '11912345678', link: 'https://exemplo.test' });
    });

    it('instrutor inativo não gera credencial', async () => {
      const { service } = makeService({ instructor: makeInstructor({ active: false }) });

      await expect(service.createCredential('c1', 'i1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('painel do instrutor', () => {
    it('mascara CPF e telefone do cliente (LGPD, plano 002)', async () => {
      const { service } = makeService({
        vouchers: [
          {
            code: 'INS-ABCDE',
            expiresAt: new Date('2027-01-01'),
            createdAt: new Date('2026-08-01'),
            customer: makeCustomer(),
          },
        ],
      });

      const result = await service.listCredentials('u1');

      expect(result.total).toBe(1);
      expect(result.credentials[0].customerCpf).toBe('123.***.**-01');
      expect(result.credentials[0].customerPhone).toBe('(11) 9****-4321');
      // Nome completo é preservado: ele precisa casar o código com a pessoa.
      expect(result.credentials[0].customerName).toBe('Cliente Teste');
    });

    it('calcula o status AGORA: Plus vencido não aparece como ativo', async () => {
      const { service } = makeService({
        vouchers: [
          {
            code: 'INS-ABCDE',
            expiresAt: new Date('2027-01-01'),
            createdAt: new Date('2026-08-01'),
            customer: makeCustomer({
              currentTier: TierLevel.PLUS,
              subscription: { expiresAt: new Date('2026-01-01') },
            }),
          },
        ],
      });

      const result = await service.listCredentials('u1');

      expect(result.credentials[0].status).toBe('PLUS_VENCIDO');
    });

    it('sem termo aceito, o painel é bloqueado', async () => {
      const { service } = makeService({
        instructor: makeInstructor({ termsAcceptedAt: null }),
      });

      await expect(service.listCredentials('u1')).rejects.toThrow(ForbiddenException);
    });

    it('instrutor não consulta credencial de outro instrutor', async () => {
      const { service } = makeService({
        voucherByCode: {
          code: 'INS-XXXXX',
          expiresAt: new Date('2027-01-01'),
          createdAt: new Date(),
          instructorId: 'i2', // pertence a outro instrutor
          customer: makeCustomer(),
        },
      });

      await expect(service.checkCredential('u1', 'INS-XXXXX')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
