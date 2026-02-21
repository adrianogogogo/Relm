import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(createCustomerDto: CreateCustomerDto) {
    // Verificar se email já existe
    const existingCustomer = await this.prisma.customer.findUnique({
      where: { email: createCustomerDto.email },
    });

    if (existingCustomer) {
      throw new ConflictException('Email já cadastrado');
    }

    // Normalizar CPF (remover pontos e traços)
    let cpfNormalized = createCustomerDto.cpf;
    if (cpfNormalized) {
      cpfNormalized = cpfNormalized.replace(/\D/g, '');
    }

    const customer = await this.prisma.customer.create({
      data: {
        fullName: createCustomerDto.fullName,
        email: createCustomerDto.email,
        phone: createCustomerDto.phone,
        cpf: cpfNormalized,
        address: createCustomerDto.address,
        city: createCustomerDto.city,
        state: createCustomerDto.state,
        zipCode: createCustomerDto.zipCode,
        storeId: createCustomerDto.storeId,
        notes: createCustomerDto.notes,
        marketingConsent: createCustomerDto.marketingConsent || false,
      },
      include: {
        store: {
          select: {
            id: true,
            tradeName: true,
            city: true,
            state: true,
          },
        },
      },
    });

    return this.formatCustomer(customer);
  }

  async findAll(filters?: { search?: string; storeId?: string; active?: boolean }) {
    const where: any = {};

    if (filters?.search) {
      where.OR = [
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { cpf: { contains: filters.search.replace(/\D/g, '') } },
        { phone: { contains: filters.search } },
      ];
    }

    if (filters?.storeId) {
      where.storeId = filters.storeId;
    }

    if (filters?.active !== undefined) {
      where.active = filters.active;
    }

    const customers = await this.prisma.customer.findMany({
      where,
      include: {
        store: {
          select: {
            id: true,
            tradeName: true,
            city: true,
            state: true,
          },
        },
        warrantyClaims: {
          where: { status: { in: ['APROVADO', 'FINALIZADO'] } },
          select: { id: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return customers.map((customer) => this.formatCustomer(customer));
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        store: {
          select: {
            id: true,
            tradeName: true,
            city: true,
            state: true,
            phone: true,
            address: true,
          },
        },
        warrantyClaims: {
          select: {
            id: true,
            protocolNumber: true,
            status: true,
            createdAt: true,
            product: {
              select: {
                model: true,
                serialNumber: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        insuranceQuotes: {
          select: {
            id: true,
            protocolNumber: true,
            status: true,
            bikeValue: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        eventRegistrations: {
          select: {
            id: true,
            createdAt: true,
            event: {
              select: {
                title: true,
                startAt: true,
                location: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return this.formatCustomer(customer);
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    const existingCustomer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    // Se está alterando email, verificar se não existe outro cliente com esse email
    if (updateCustomerDto.email && updateCustomerDto.email !== existingCustomer.email) {
      const emailExists = await this.prisma.customer.findUnique({
        where: { email: updateCustomerDto.email },
      });

      if (emailExists) {
        throw new ConflictException('Email já cadastrado para outro cliente');
      }
    }

    // Normalizar CPF se fornecido
    let cpfNormalized = updateCustomerDto.cpf;
    if (cpfNormalized) {
      cpfNormalized = cpfNormalized.replace(/\D/g, '');
    }

    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        ...updateCustomerDto,
        cpf: cpfNormalized || existingCustomer.cpf,
      },
      include: {
        store: {
          select: {
            id: true,
            tradeName: true,
            city: true,
            state: true,
          },
        },
      },
    });

    return this.formatCustomer(customer);
  }

  async remove(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    // Soft delete - apenas desativar
    await this.prisma.customer.update({
      where: { id },
      data: { active: false },
    });

    return { message: 'Cliente desativado com sucesso' };
  }

  // Método auxiliar para formatar dados do cliente
  private formatCustomer(customer: any) {
    return {
      ...customer,
      name: customer.fullName, // Alias para compatibilidade com frontend
      hasActiveWarranty: customer.warrantyClaims?.some(
        (w) => w.status === 'APROVADO' || w.status === 'FINALIZADO',
      ),
    };
  }
}
