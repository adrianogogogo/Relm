import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminUsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        storeId: true,
        distributorId: true,
        createdAt: true,
        store: { select: { id: true, tradeName: true } },
        distributor: { select: { id: true, tradeName: true } },
      },
    });
  }

  async findAllStores() {
    return this.prisma.store.findMany({
      orderBy: { tradeName: 'asc' },
      select: { id: true, tradeName: true },
    });
  }

  async findAllDistributors() {
    return this.prisma.distributor.findMany({
      orderBy: { tradeName: 'asc' },
      select: { id: true, tradeName: true },
    });
  }

  async create(data: {
    name: string;
    email: string;
    password: string;
    role: string;
    storeId?: string;
    distributorId?: string;
  }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException('E-mail já cadastrado');

    const passwordHash = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role as any,
        storeId: data.storeId || null,
        distributorId: data.distributorId || null,
        active: true,
      },
      select: {
        id: true, name: true, email: true, role: true, active: true, createdAt: true,
      },
    });
  }

  async update(id: string, data: {
    name?: string;
    email?: string;
    role?: string;
    storeId?: string | null;
    distributorId?: string | null;
    active?: boolean;
  }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    if (data.email && data.email !== user.email) {
      const conflict = await this.prisma.user.findUnique({ where: { email: data.email } });
      if (conflict) throw new ConflictException('E-mail já cadastrado por outro usuário');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.role !== undefined && { role: data.role as any }),
        ...(data.storeId !== undefined && { storeId: data.storeId }),
        ...(data.distributorId !== undefined && { distributorId: data.distributorId }),
        ...(data.active !== undefined && { active: data.active }),
      },
      select: {
        id: true, name: true, email: true, role: true, active: true,
        storeId: true, distributorId: true,
        store: { select: { id: true, tradeName: true } },
        distributor: { select: { id: true, tradeName: true } },
      },
    });
  }

  async resetPassword(id: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    return { message: 'Senha redefinida com sucesso' };
  }

  async toggleActive(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    return this.prisma.user.update({
      where: { id },
      data: { active: !user.active },
      select: { id: true, name: true, email: true, role: true, active: true },
    });
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    await this.prisma.user.delete({ where: { id } });
    return { message: 'Usuário excluído com sucesso' };
  }
}
