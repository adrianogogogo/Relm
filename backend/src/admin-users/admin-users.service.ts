import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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
        instructorId: true,
        createdAt: true,
        store: { select: { id: true, tradeName: true } },
        distributor: { select: { id: true, tradeName: true } },
        instructor: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Instrutores para o select do formulário. Sem isto, criar o login de um
   * instrutor exigia SQL manual: o CRUD de instrutores cria o `Instructor`, mas
   * quem liga um `User` a ele é esta tela.
   */
  async findAllInstructors() {
    return this.prisma.instructor.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
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
    instructorId?: string;
  }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException('E-mail já cadastrado');

    await this.assertInstructorLink(data.role, data.instructorId);

    const passwordHash = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role as any,
        storeId: data.storeId || null,
        distributorId: data.distributorId || null,
        instructorId: data.instructorId || null,
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
    instructorId?: string | null;
    active?: boolean;
  }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    if (data.email && data.email !== user.email) {
      const conflict = await this.prisma.user.findUnique({ where: { email: data.email } });
      if (conflict) throw new ConflictException('E-mail já cadastrado por outro usuário');
    }

    // Vale tanto para quem chega como INSTRUTOR quanto para quem já era e está
    // tendo o vínculo removido no mesmo PATCH.
    const finalRole = data.role ?? user.role;
    const finalInstructorId =
      data.instructorId !== undefined ? data.instructorId : user.instructorId;
    await this.assertInstructorLink(finalRole, finalInstructorId);

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.role !== undefined && { role: data.role as any }),
        ...(data.storeId !== undefined && { storeId: data.storeId }),
        ...(data.distributorId !== undefined && { distributorId: data.distributorId }),
        ...(data.instructorId !== undefined && { instructorId: data.instructorId }),
        ...(data.active !== undefined && { active: data.active }),
      },
      select: {
        id: true, name: true, email: true, role: true, active: true,
        storeId: true, distributorId: true, instructorId: true,
        store: { select: { id: true, tradeName: true } },
        distributor: { select: { id: true, tradeName: true } },
        instructor: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Usuário INSTRUTOR sem `instructorId` é uma conta morta: ele loga e todo
   * endpoint do painel responde "Usuário instrutor sem instrutor vinculado".
   * Barra na entrada em vez de deixar o suporte descobrir depois.
   */
  private async assertInstructorLink(role?: string, instructorId?: string | null) {
    if (role !== 'INSTRUTOR') return;
    if (!instructorId) {
      throw new BadRequestException(
        'Usuário com papel INSTRUTOR precisa estar vinculado a um instrutor cadastrado.',
      );
    }
    const instructor = await this.prisma.instructor.findUnique({
      where: { id: instructorId },
      select: { id: true },
    });
    if (!instructor) throw new NotFoundException('Instrutor não encontrado');
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
