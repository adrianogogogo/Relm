import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlusCoverageRule } from '@prisma/client';

export interface UpsertStoreServiceDto {
  masterServiceId: string;
  customName?: string;
  customDescription?: string;
  price: number;
  plusRule?: PlusCoverageRule;
  plusDiscountPercent?: number;
  plusPrice?: number;
  estimatedMinutes?: number;
  // Null/ausente = serviço não resgatável por pontos.
  pointsCost?: number | null;
  active?: boolean;
}

export interface UpdateStoreServiceDto {
  customName?: string;
  customDescription?: string;
  price?: number;
  plusRule?: PlusCoverageRule;
  plusDiscountPercent?: number;
  plusPrice?: number;
  estimatedMinutes?: number;
  pointsCost?: number | null;
  active?: boolean;
}

@Injectable()
export class StoreServicesService {
  constructor(private prisma: PrismaService) {}

  async findByStore(storeId: string, onlyActive: boolean = false) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException('Loja não encontrada');
    }

    const services = await this.prisma.storeService.findMany({
      where: {
        storeId,
        ...(onlyActive ? { active: true } : {}),
      },
      include: {
        masterService: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return services.map((s) => this.formatStoreService(s));
  }

  async findOne(id: string) {
    const storeService = await this.prisma.storeService.findUnique({
      where: { id },
      include: {
        masterService: true,
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

    if (!storeService) {
      throw new NotFoundException('Serviço da loja não encontrado');
    }

    return this.formatStoreService(storeService);
  }

  async upsert(storeId: string, dto: UpsertStoreServiceDto) {
    // Verificar se loja e serviço mestre existem
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new NotFoundException('Loja não encontrada');

    const masterService = await this.prisma.masterService.findUnique({
      where: { id: dto.masterServiceId },
    });
    if (!masterService) throw new NotFoundException('Serviço mestre não encontrado');

    const estimatedMinutes = dto.estimatedMinutes ?? masterService.defaultEstimatedMinutes ?? 60;

    const existing = await this.prisma.storeService.findUnique({
      where: {
        storeId_masterServiceId: {
          storeId,
          masterServiceId: dto.masterServiceId,
        },
      },
    });

    if (existing) {
      const updated = await this.prisma.storeService.update({
        where: { id: existing.id },
        data: {
          customName: dto.customName,
          customDescription: dto.customDescription,
          price: dto.price,
          plusRule: dto.plusRule ?? PlusCoverageRule.FREE,
          plusDiscountPercent: dto.plusDiscountPercent,
          plusPrice: dto.plusPrice,
          estimatedMinutes,
          // Sem `?? null`: undefined faz o Prisma pular o campo, então omitir
          // no payload preserva o custo em pontos em vez de apagá-lo. Mandar
          // null explicitamente é o que desliga o resgate.
          pointsCost: dto.pointsCost,
          active: dto.active ?? true,
        },
        include: { masterService: true },
      });

      return this.formatStoreService(updated);
    }

    const created = await this.prisma.storeService.create({
      data: {
        storeId,
        masterServiceId: dto.masterServiceId,
        customName: dto.customName,
        customDescription: dto.customDescription,
        price: dto.price,
        plusRule: dto.plusRule ?? PlusCoverageRule.FREE,
        plusDiscountPercent: dto.plusDiscountPercent,
        plusPrice: dto.plusPrice,
        estimatedMinutes,
        pointsCost: dto.pointsCost,
        active: dto.active ?? true,
      },
      include: { masterService: true },
    });

    return this.formatStoreService(created);
  }

  async update(id: string, dto: UpdateStoreServiceDto) {
    const existing = await this.prisma.storeService.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Serviço da loja não encontrado');

    const updated = await this.prisma.storeService.update({
      where: { id },
      data: dto,
      include: { masterService: true },
    });

    return this.formatStoreService(updated);
  }

  async remove(id: string) {
    const existing = await this.prisma.storeService.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Serviço da loja não encontrado');

    // Desativação lógica
    const updated = await this.prisma.storeService.update({
      where: { id },
      data: { active: false },
    });

    return { message: 'Serviço da loja desativado com sucesso' };
  }

  private formatStoreService(s: any) {
    const name = s.customName || s.masterService?.name || 'Serviço';
    const description = s.customDescription || s.masterService?.description || '';
    const priceCare = Number(s.price);

    let calculatedPlusPrice = 0;
    if (s.plusRule === PlusCoverageRule.FREE) {
      calculatedPlusPrice = 0;
    } else if (s.plusRule === PlusCoverageRule.DISCOUNT_PERCENT) {
      const discount = s.plusDiscountPercent || 0;
      calculatedPlusPrice = Math.max(0, priceCare * (1 - discount / 100));
    } else if (s.plusRule === PlusCoverageRule.FIXED_PRICE) {
      calculatedPlusPrice = Number(s.plusPrice ?? priceCare);
    }

    return {
      ...s,
      displayName: name,
      displayDescription: description,
      priceCare,
      calculatedPlusPrice: Math.round(calculatedPlusPrice * 100) / 100,
    };
  }
}
