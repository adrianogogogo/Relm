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

  /** Portal cliente: lista parceiros ativos. Retorna todos, mas anota cada um
   *  com `eligible` (tier do cliente >= minTier do parceiro). Isso permite
   *  exibir parceiros PLUS bloqueados para membros CARE como CTA de upgrade. */
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

    return partners.map((p) => ({
      ...p,
      eligible: tierAtLeast(customerTier, p.minTier),
    }));
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
