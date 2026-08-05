import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TierLevel, PartnerCategory } from '@prisma/client';
import { tierAtLeast } from '../common/entitlements';

export interface CreatePartnerDto {
  name: string;
  category: PartnerCategory;
  description?: string;
  benefit: string;
  minTier?: TierLevel;
  logoUrl?: string;
  link?: string;
  city?: string;
  active?: boolean;
}

export type UpdatePartnerDto = Partial<CreatePartnerDto>;

@Injectable()
export class PartnersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Admin: lista todos os parceiros (ativos e inativos). */
  async findAll() {
    return this.prisma.partner.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  /** Portal cliente: lista parceiros ativos (inclui parceiros diretos e lojas parceiras ativas). */
  async findForCustomer(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { currentTier: true },
    });
    const customerTier: TierLevel = customer?.currentTier ?? TierLevel.CARE;

    const partners = await this.prisma.partner.findMany({
      where: { active: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    const mappedPartners = partners.map((p) => ({
      ...p,
      eligible: tierAtLeast(customerTier, p.minTier),
    }));

    // Buscar lojas parceiras ativas e mapeá-las como parceiros da comunidade
    const stores = await this.prisma.store.findMany({
      where: { active: true },
      include: {
        storeServices: {
          where: { active: true },
          include: { masterService: true },
        },
      },
    });

    const storePartners = stores.map((s) => {
      const conveniences = s.storeServices
        .filter((ss) => ss.masterService?.category === 'Conveniências & Hub do Ciclista')
        .map((ss) => ss.masterService?.name?.split('(')[0]?.trim());

      const benefitText =
        conveniences.length > 0
          ? `Hub do Ciclista: ${conveniences.slice(0, 3).join(', ')}${
              conveniences.length > 3 ? ' e mais' : ''
            }`
          : 'Loja Parceira & Oficina Especializada Relm Care+';

      return {
        id: `store-${s.id}`,
        name: s.tradeName,
        category: PartnerCategory.CAFE,
        description: s.address
          ? `${s.address} — ${s.city}/${s.state}`
          : `${s.city}/${s.state}`,
        benefit: benefitText,
        minTier: TierLevel.CARE,
        logoUrl: s.logoUrl,
        link: `/cliente/lojas`,
        city: `${s.city}/${s.state}`,
        active: true,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        eligible: true,
        isStore: true,
      };
    });

    return [...mappedPartners, ...storePartners];
  }

  async findOne(id: string) {
    const partner = await this.prisma.partner.findUnique({ where: { id } });
    if (!partner) throw new NotFoundException('Parceiro não encontrado');
    return partner;
  }

  async create(dto: CreatePartnerDto) {
    return this.prisma.partner.create({ data: dto });
  }

  async update(id: string, dto: UpdatePartnerDto) {
    await this.findOne(id);
    return this.prisma.partner.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.partner.update({ where: { id }, data: { active: false } });
  }
}
