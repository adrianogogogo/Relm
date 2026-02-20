import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: { email?: string; cpf?: string; name?: string }) {
    return this.prisma.customer.findMany({
      where: {
        ...(filters?.email && { email: { contains: filters.email, mode: 'insensitive' } }),
        ...(filters?.cpf && { cpf: filters.cpf }),
        ...(filters?.name && { fullName: { contains: filters.name, mode: 'insensitive' } }),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        cpf: true,
        city: true,
        state: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.customer.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return this.prisma.customer.findUnique({ where: { email } });
  }

  async findByCpf(cpf: string) {
    return this.prisma.customer.findFirst({ where: { cpf } });
  }

  async create(data: any) {
    return this.prisma.customer.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.customer.update({ where: { id }, data });
  }

  async upsertByEmail(data: any) {
    return this.prisma.customer.upsert({
      where: { email: data.email },
      update: data,
      create: data,
    });
  }
}
