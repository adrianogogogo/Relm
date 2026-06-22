import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class CustomersService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  // Notificação best-effort de novo cliente para a equipe Relm.
  private async notifyNewCustomer(customer: {
    id: string;
    fullName: string;
  }): Promise<void> {
    await this.notificationsService.notifyTeam({
      type: 'CUSTOMER_NEW',
      title: 'Novo cliente cadastrado',
      message: `${customer.fullName} foi cadastrado(a).`,
      link: `/admin/customers/${customer.id}`,
    });
  }

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

    await this.notifyNewCustomer(customer);

    return this.formatCustomer(customer);
  }

  async findAll(filters?: {
    search?: string;
    storeId?: string;
    active?: boolean;
    requesterUserId?: string;
    requesterRole?: string;
    page?: number;
    pageSize?: number;
  }) {
    const where: any = {};

    // Paginação obrigatória: limita o volume retornado (M-01).
    // page >= 1, pageSize entre 1 e 200 (default 50).
    const MAX_PAGE_SIZE = 200;
    const page = Math.max(1, Math.floor(filters?.page ?? 1) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Math.floor(filters?.pageSize ?? 50) || 50),
    );
    const skip = (page - 1) * pageSize;

    if (filters?.search) {
      where.OR = [
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { cpf: { contains: filters.search.replace(/\D/g, '') } },
        { phone: { contains: filters.search } },
      ];
    }

    // Usuários de LOJA só podem ver clientes da própria loja.
    // O storeId é forçado a partir do token (ignorando o query param).
    if (filters?.requesterRole === 'LOJA') {
      const requesterStoreId = await this.getRequesterStoreId(
        filters.requesterUserId,
      );
      // Loja sem storeId vinculado não pode ver nenhum cliente.
      if (!requesterStoreId) {
        return { data: [], total: 0, page, pageSize };
      }
      where.storeId = requesterStoreId;
    } else if (filters?.storeId) {
      where.storeId = filters.storeId;
    }

    if (filters?.active !== undefined) {
      where.active = filters.active;
    }

    const [customers, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
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
        skip,
        take: pageSize,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data: customers.map((customer) => this.formatCustomer(customer)),
      total,
      page,
      pageSize,
    };
  }

  async findOne(
    id: string,
    requester?: { requesterUserId?: string; requesterRole?: string },
  ) {
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

    // Usuários de LOJA só podem acessar clientes da própria loja.
    if (requester?.requesterRole === 'LOJA') {
      const requesterStoreId = await this.getRequesterStoreId(
        requester.requesterUserId,
      );
      if (!requesterStoreId || customer.storeId !== requesterStoreId) {
        throw new ForbiddenException(
          'Você não tem permissão para acessar este cliente',
        );
      }
    }

    return this.formatCustomer(customer);
  }

  // Busca o storeId vinculado ao usuário (token de LOJA) a partir do banco,
  // já que o storeId não está presente no payload do JWT.
  private async getRequesterStoreId(
    userId?: string,
  ): Promise<string | null> {
    if (!userId) {
      return null;
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { storeId: true },
    });
    return user?.storeId ?? null;
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

  // Admin (ADMIN_RELM) redefine a senha de qualquer cliente.
  async setPassword(id: string, newPassword: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.customer.update({
      where: { id },
      data: { passwordHash },
    });

    return { message: 'Senha redefinida com sucesso' };
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

  // Método para criar ou atualizar cliente pelo email (usado em fluxos públicos
  // de garantia/seguro/eventos).
  //
  // SEGURANÇA: dados vindos de formulários públicos NÃO são confiáveis. Se um
  // cliente JÁ EXISTE (match por email), não sobrescrevemos campos já
  // preenchidos com dados não confiáveis do request — apenas preenchemos campos
  // que estão vazios. Isso impede que um atacante altere nome/telefone/etc. de
  // outra pessoa informando o email dela.
  async upsertByEmail(customerData: {
    email: string;
    fullName: string;
    phone?: string;
    cpf?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  }) {
    // Normalizar CPF se fornecido
    let cpfNormalized = customerData.cpf;
    if (cpfNormalized) {
      cpfNormalized = cpfNormalized.replace(/\D/g, '');
    }

    const existing = await this.prisma.customer.findUnique({
      where: { email: customerData.email },
    });

    if (existing) {
      // Só preenche campos atualmente vazios; nunca sobrescreve dados existentes.
      const fillIfEmpty = (current: string | null, incoming?: string) =>
        current && current.trim() !== '' ? current : incoming;

      return this.prisma.customer.update({
        where: { id: existing.id },
        data: {
          fullName: fillIfEmpty(existing.fullName, customerData.fullName),
          phone: fillIfEmpty(existing.phone, customerData.phone),
          cpf: fillIfEmpty(existing.cpf, cpfNormalized),
          address: fillIfEmpty(existing.address, customerData.address),
          city: fillIfEmpty(existing.city, customerData.city),
          state: fillIfEmpty(existing.state, customerData.state),
          zipCode: fillIfEmpty(existing.zipCode, customerData.zipCode),
        },
      });
    }

    const created = await this.prisma.customer.create({
      data: {
        email: customerData.email,
        fullName: customerData.fullName,
        phone: customerData.phone,
        cpf: cpfNormalized,
        address: customerData.address,
        city: customerData.city,
        state: customerData.state,
        zipCode: customerData.zipCode,
        marketingConsent: false,
      },
    });

    // Só notifica quando um cliente REALMENTE novo é criado (não em updates).
    await this.notifyNewCustomer(created);

    return created;
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
