import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoresService {
  constructor(private prisma: PrismaService) {}

  async create(createStoreDto: CreateStoreDto) {
    // Verificar se CNPJ já existe (se fornecido)
    if (createStoreDto.cnpj) {
      const cnpjNormalized = createStoreDto.cnpj.replace(/\D/g, '');
      const existingStore = await this.prisma.store.findUnique({
        where: { cnpj: cnpjNormalized },
      });

      if (existingStore) {
        throw new ConflictException('CNPJ já cadastrado');
      }
    }

    const store = await this.prisma.store.create({
      data: {
        tradeName: createStoreDto.tradeName,
        legalName: createStoreDto.legalName,
        cnpj: createStoreDto.cnpj?.replace(/\D/g, ''),
        aliases: createStoreDto.aliases || [],
        email: createStoreDto.email,
        phone: createStoreDto.phone,
        address: createStoreDto.address,
        city: createStoreDto.city,
        state: createStoreDto.state,
        zipCode: createStoreDto.zipCode,
        latitude: createStoreDto.latitude,
        longitude: createStoreDto.longitude,
        active: createStoreDto.active ?? true,
      },
    });

    return this.formatStore(store);
  }

  // Importação em lote (planilha). skipDuplicates ignora CNPJs já
  // cadastrados (unique) sem abortar o restante. Retorna a contagem criada.
  async createMany(rows: CreateStoreDto[]) {
    const data = rows.map((r) => ({
      tradeName: r.tradeName,
      legalName: r.legalName,
      city: r.city,
      state: r.state,
      ...(r.cnpj && { cnpj: r.cnpj.replace(/\D/g, '') }),
      ...(r.email && { email: r.email }),
      ...(r.phone && { phone: r.phone }),
      ...(r.address && { address: r.address }),
      ...(r.zipCode && { zipCode: r.zipCode }),
    }));
    const result = await this.prisma.store.createMany({
      data,
      skipDuplicates: true,
    });
    return { created: result.count };
  }

  async findAll(filters?: {
    search?: string;
    city?: string;
    state?: string;
    active?: boolean;
  }) {
    const where: any = {};

    if (filters?.search) {
      where.OR = [
        { tradeName: { contains: filters.search, mode: 'insensitive' } },
        { legalName: { contains: filters.search, mode: 'insensitive' } },
        { city: { contains: filters.search, mode: 'insensitive' } },
        { aliases: { hasSome: [filters.search] } },
      ];
    }

    if (filters?.city) {
      where.city = { contains: filters.city, mode: 'insensitive' };
    }

    if (filters?.state) {
      where.state = filters.state;
    }

    if (filters?.active !== undefined) {
      where.active = filters.active;
    }

    const stores = await this.prisma.store.findMany({
      where,
      include: {
        _count: {
          select: {
            customers: true,
            products: true,
            users: true,
          },
        },
      },
      orderBy: [
        { active: 'desc' },
        { city: 'asc' },
        { tradeName: 'asc' },
      ],
    });

    return stores.map((store) => this.formatStore(store));
  }

  async findOne(id: string) {
    const store = await this.prisma.store.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            customers: true,
            products: true,
            users: true,
            warrantyClaims: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            active: true,
          },
        },
        storeUsers: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!store) {
      throw new NotFoundException('Loja não encontrada');
    }

    return this.formatStore(store);
  }

  async update(id: string, updateStoreDto: UpdateStoreDto) {
    const existingStore = await this.prisma.store.findUnique({
      where: { id },
    });

    if (!existingStore) {
      throw new NotFoundException('Loja não encontrada');
    }

    // Se está alterando CNPJ, verificar se não existe outra loja com esse CNPJ
    if (updateStoreDto.cnpj && updateStoreDto.cnpj !== existingStore.cnpj) {
      const cnpjNormalized = updateStoreDto.cnpj.replace(/\D/g, '');
      const cnpjExists = await this.prisma.store.findUnique({
        where: { cnpj: cnpjNormalized },
      });

      if (cnpjExists) {
        throw new ConflictException('CNPJ já cadastrado para outra loja');
      }
    }

    const store = await this.prisma.store.update({
      where: { id },
      data: {
        ...updateStoreDto,
        cnpj: updateStoreDto.cnpj?.replace(/\D/g, ''),
      },
      include: {
        _count: {
          select: {
            customers: true,
            products: true,
            users: true,
          },
        },
      },
    });

    return this.formatStore(store);
  }

  async remove(id: string) {
    const store = await this.prisma.store.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            customers: true,
            products: true,
            users: true,
          },
        },
      },
    });

    if (!store) {
      throw new NotFoundException('Loja não encontrada');
    }

    // Verificar se tem relacionamentos ativos
    const hasRelationships =
      store._count.customers > 0 ||
      store._count.products > 0 ||
      store._count.users > 0;

    if (hasRelationships) {
      // Soft delete - apenas desativar
      await this.prisma.store.update({
        where: { id },
        data: { active: false },
      });

      return {
        message:
          'Loja desativada com sucesso (possui registros vinculados)',
      };
    } else {
      // Hard delete - pode remover
      await this.prisma.store.delete({
        where: { id },
      });

      return { message: 'Loja removida com sucesso' };
    }
  }

  // Método público para busca de lojas (usado na home)
  async findPublicStores(filters?: {
    city?: string;
    state?: string;
    latitude?: number;
    longitude?: number;
    radius?: number; // em km
  }) {
    const where: any = { active: true };

    if (filters?.city) {
      where.city = { contains: filters.city, mode: 'insensitive' };
    }

    if (filters?.state) {
      where.state = filters.state;
    }

    const stores = await this.prisma.store.findMany({
      where,
      select: {
        id: true,
        tradeName: true,
        address: true,
        city: true,
        state: true,
        phone: true,
        email: true,
        latitude: true,
        longitude: true,
        storeServices: {
          where: { active: true },
          select: {
            id: true,
            price: true,
            plusRule: true,
            plusDiscountPercent: true,
            plusPrice: true,
            estimatedMinutes: true,
            masterService: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: [
        { city: 'asc' },
        { tradeName: 'asc' },
      ],
    });

    // Se forneceu coordenadas, calcular distância e ordenar
    if (filters?.latitude && filters?.longitude) {
      const storesWithDistance = stores
        .map((store) => {
          if (store.latitude && store.longitude) {
            const distance = this.calculateDistance(
              filters.latitude!,
              filters.longitude!,
              parseFloat(store.latitude),
              parseFloat(store.longitude),
            );

            return { ...store, distance };
          }
          return { ...store, distance: null };
        })
        .filter((store) => {
          // Se especificou raio, filtrar
          if (filters.radius && store.distance) {
            return store.distance <= filters.radius;
          }
          return true;
        })
        .sort((a, b) => {
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });

      return storesWithDistance;
    }

    return stores;
  }

  // Método auxiliar para formatar dados da loja
  private formatStore(store: any) {
    return {
      ...store,
      cnpjFormatted: store.cnpj
        ? store.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
        : null,
    };
  }

  // Calcular distância entre duas coordenadas (fórmula de Haversine)
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Raio da Terra em km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 10) / 10; // Arredondar para 1 casa decimal
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
