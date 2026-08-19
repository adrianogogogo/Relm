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
  const createdUsers: any[] = [];

  const prisma: any = {
    customer: { findUnique: jest.fn().mockResolvedValue(customer) },
    instructor: {
      findUnique: jest.fn().mockResolvedValue(opts.instructorMissing ? null : instructor),
      findMany: jest
        .fn()
        .mockImplementation(({ select }: any = {}) =>
          Promise.resolve([applySelect(instructor, select)]),
        ),
      create: jest.fn().mockImplementation(({ data }: any) => {
        const ins = { id: 'i1', ...data, specialties: [], users: [] };
        return Promise.resolve(ins);
      }),
      update: jest.fn().mockImplementation(({ data }: any) => ({ ...instructor, ...data })),
    },
    instructorSpecialty: { findMany: jest.fn().mockResolvedValue([]) },
    user: {
      findUnique: jest.fn().mockImplementation(({ where }: any) => {
        if (where?.email === 'duplicado@teste.com') {
          return Promise.resolve({ id: 'u-existente', email: 'duplicado@teste.com' });
        }
        if (where?.email) {
          return Promise.resolve(null);
        }
        if (where?.id === 'u1') {
          return Promise.resolve({
            id: 'u1',
            instructorId: opts.userInstructorId ?? 'i1',
            passwordHash: opts.userPasswordHash ?? '$2a$10$abcdefghijklmnopqrstuv',
          });
        }
        return Promise.resolve(opts.userFindResult ?? { instructorId: opts.userInstructorId ?? 'i1' });
      }),
      create: jest.fn().mockImplementation(({ data }: any) => {
        const u = { id: `u${createdUsers.length + 1}`, ...data };
        createdUsers.push(u);
        return Promise.resolve(u);
      }),
      update: jest.fn().mockResolvedValue({ id: 'u1' }),
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

  prisma.$transaction = jest.fn().mockImplementation((cb: any) => cb(prisma));

  return {
    service: new InstructorsService(prisma),
    prisma,
    created,
    createdUsers,
    instructor,
    customer,
  };
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
    });

    it('care e plus recebem o mesmo catálogo (care vê o benefício do plus)', async () => {
      const { service } = makeService({ customer: makeCustomer({ currentTier: TierLevel.CARE }) });

      const result = await service.findForCustomer('c1');

      expect(result.customerTier).toBe(TierLevel.CARE);
      expect(result.isPlus).toBe(false);
      expect(result.instructors).toHaveLength(1);
    });
  });

  describe('createCredential', () => {
    it('gera credencial com código INS- e revela o contato', async () => {
      const { service, created } = makeService();

      const result = await service.createCredential('c1', 'i1');

      expect(result.code).toMatch(/^INS-[A-Z0-9]{6}$/);
      expect(result.phone).toBe('11912345678');
      expect(result.link).toBe('https://exemplo.test');
      expect(created).toHaveLength(1);
      expect(created[0].status).toBe(VoucherStatus.UNUSED);
      expect(created[0].instructorId).toBe('i1');
    });

    it('é idempotente: segundo clique devolve a credencial existente', async () => {
      const existing = {
        id: 'v-existente',
        code: 'INS-JAEXISTE',
        expiresAt: new Date('2027-01-01'),
        status: VoucherStatus.UNUSED,
        instructorId: 'i1',
        customerId: 'c1',
      };
      const { service, created } = makeService({ existingVoucher: existing });

      const result = await service.createCredential('c1', 'i1');

      expect(result.code).toBe('INS-JAEXISTE');
      expect(created).toHaveLength(0);
    });

    it('falha se o instrutor estiver inativo', async () => {
      const { service } = makeService({
        instructor: makeInstructor({ active: false }),
      });

      await expect(service.createCredential('c1', 'i1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('cadastro de instrutor com login automático', () => {
    it('cria instrutor e usuário INSTRUTOR vinculado na mesma transação', async () => {
      const { service, prisma, createdUsers } = makeService();

      const result = await service.create({
        name: 'Assessoria Top',
        benefit: '10% de desconto',
        phone: '11999998888',
        email: 'contato@assessoria.com',
        initialPassword: 'MinhaSenha@123',
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(createdUsers).toHaveLength(1);
      expect(createdUsers[0].email).toBe('contato@assessoria.com');
      expect(createdUsers[0].role).toBe('INSTRUTOR');
      expect(createdUsers[0].instructorId).toBe('i1');
    });

    it('rejeita criação se o e-mail já pertencer a outro usuário', async () => {
      const { service } = makeService();

      await expect(
        service.create({
          name: 'Assessoria Duplicada',
          benefit: '10%',
          phone: '11999998888',
          email: 'duplicado@teste.com',
        }),
      ).rejects.toThrow('E-mail de acesso já cadastrado');
    });
  });

  describe('gestão de senhas', () => {
    it('admin redefine a senha do instrutor com sucesso', async () => {
      const { service, prisma } = makeService({
        instructor: {
          ...makeInstructor(),
          users: [{ id: 'u1', email: 'instrutor@teste.com', role: 'INSTRUTOR' }],
        },
      });

      const result = await service.resetInstructorPassword('i1', 'NovaSenha@2026');

      expect(result.message).toBe('Senha redefinida com sucesso');
      expect(prisma.user.update).toHaveBeenCalled();
    });

    it('rejeita reset de senha menor que 6 caracteres', async () => {
      const { service } = makeService({
        instructor: {
          ...makeInstructor(),
          users: [{ id: 'u1', email: 'instrutor@teste.com', role: 'INSTRUTOR' }],
        },
      });

      await expect(service.resetInstructorPassword('i1', '123')).rejects.toThrow(
        'mínimo 6 caracteres',
      );
    });

    it('instrutor altera a própria senha se a senha atual for informada corretamente', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('SenhaAntiga@123', 10);
      const { service } = makeService({ userPasswordHash: hash });

      const result = await service.changeMyPassword('u1', 'SenhaAntiga@123', 'NovaSenha@456');

      expect(result.message).toBe('Senha alterada com sucesso');
    });

    it('rejeita alteração de senha se a senha atual estiver incorreta', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('SenhaAntiga@123', 10);
      const { service } = makeService({ userPasswordHash: hash });

      await expect(
        service.changeMyPassword('u1', 'SenhaErrada@123', 'NovaSenha@456'),
      ).rejects.toThrow('Senha atual incorreta');
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

      expect(result.credentials[0].customerCpf).toBe('123.***.**-01');
      expect(result.credentials[0].customerPhone).toBe('(11) 9****-4321');
      // Nome completo é preservado: ele precisa casar o código com a pessoa.
      expect(result.credentials[0].customerName).toBe('Cliente Teste');
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
        NotFoundException,
      );
    });
  });
});
