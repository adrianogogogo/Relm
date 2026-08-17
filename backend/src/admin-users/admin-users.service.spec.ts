/// <reference types="jest" />
import { AdminUsersService } from './admin-users.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// Um usuário INSTRUTOR sem `instructorId` é conta morta: loga e nenhum endpoint
// do painel funciona. Estes testes travam a validação na entrada.

function makeService(opts: any = {}) {
  const prisma: any = {
    user: {
      findUnique: jest.fn().mockResolvedValue(opts.existingUser ?? null),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation(({ data }: any) => ({ id: 'u1', ...data })),
      update: jest.fn().mockImplementation(({ data }: any) => ({ id: 'u1', ...data })),
    },
    instructor: {
      findUnique: jest
        .fn()
        .mockResolvedValue(opts.instructorExists === false ? null : { id: 'i1' }),
      findMany: jest.fn().mockResolvedValue([{ id: 'i1', name: 'Assessoria Teste' }]),
    },
    store: { findMany: jest.fn().mockResolvedValue([]) },
    distributor: { findMany: jest.fn().mockResolvedValue([]) },
  };
  return { service: new AdminUsersService(prisma), prisma };
}

const baseUser = {
  name: 'Instrutor Teste',
  email: 'instrutor@teste.test',
  password: 'Teste@2025',
  role: 'INSTRUTOR',
};

describe('AdminUsersService — vínculo do instrutor', () => {
  it('cria o usuário INSTRUTOR com o instructorId persistido', async () => {
    const { service, prisma } = makeService();

    await service.create({ ...baseUser, instructorId: 'i1' });

    expect(prisma.user.create).toHaveBeenCalled();
    expect(prisma.user.create.mock.calls[0][0].data.instructorId).toBe('i1');
  });

  it('recusa INSTRUTOR sem instructorId', async () => {
    const { service, prisma } = makeService();

    await expect(service.create(baseUser)).rejects.toThrow(BadRequestException);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('recusa instructorId que não existe', async () => {
    const { service } = makeService({ instructorExists: false });

    await expect(service.create({ ...baseUser, instructorId: 'inexistente' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('não exige vínculo para os outros papéis', async () => {
    const { service, prisma } = makeService();

    await service.create({ ...baseUser, role: 'SUPORTE_RELM' });

    expect(prisma.user.create.mock.calls[0][0].data.instructorId).toBeNull();
  });

  it('impede remover o vínculo de quem já é INSTRUTOR', async () => {
    const { service } = makeService({
      existingUser: {
        id: 'u1',
        email: 'instrutor@teste.test',
        role: 'INSTRUTOR',
        instructorId: 'i1',
      },
    });

    await expect(service.update('u1', { instructorId: null })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('promover um usuário existente a INSTRUTOR exige o vínculo', async () => {
    const { service } = makeService({
      existingUser: { id: 'u1', email: 'x@teste.test', role: 'SUPORTE_RELM', instructorId: null },
    });

    await expect(service.update('u1', { role: 'INSTRUTOR' })).rejects.toThrow(
      BadRequestException,
    );
  });
});
