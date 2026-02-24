import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMembershipDto, AddPointsDto } from './dto';

// Configuração de tiers e pontos necessários
const TIER_CONFIG = {
  BRONZE: { minPoints: 0, maxPoints: 499 },
  SILVER: { minPoints: 500, maxPoints: 1499 },
  GOLD: { minPoints: 1500, maxPoints: 4999 },
  DIAMOND: { minPoints: 5000, maxPoints: Infinity },
};

// Pontos por ações
export const POINTS_RULES = {
  WARRANTY_REGISTRATION: 100,
  PURCHASE_PER_100: 50, // 50 pontos a cada R$ 100
  EVENT_PARTICIPATION: 30,
  REFERRAL: 200,
  FIRST_PURCHASE: 150,
};

@Injectable()
export class MembershipService {
  constructor(private prisma: PrismaService) {}

  /**
   * Criar ou buscar membership de um cliente
   */
  async getOrCreateMembership(customerId: string) {
    let membership = await this.prisma.benefitMembership.findUnique({
      where: { customerId },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        _count: {
          select: { transactions: true, redemptions: true },
        },
      },
    });

    if (!membership) {
      membership = await this.prisma.benefitMembership.create({
        data: {
          customerId,
          tier: 'BRONZE',
          points: 0,
          lifetimePoints: 0,
          status: 'ACTIVE',
        },
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          _count: {
            select: { transactions: true, redemptions: true },
          },
        },
      });
    }

    return this.enrichMembershipData(membership);
  }

  /**
   * Adicionar pontos e recalcular tier
   */
  async addPoints(customerId: string, addPointsDto: AddPointsDto) {
    const membership = await this.getOrCreateMembership(customerId);

    const { points, reason, referenceType, referenceId } = addPointsDto;

    if (points <= 0) {
      throw new BadRequestException('Pontos devem ser maiores que zero');
    }

    // Criar transação
    await this.prisma.membershipTransaction.create({
      data: {
        membershipId: membership.id,
        type: 'EARN',
        points,
        reason,
        referenceType,
        referenceId,
      },
    });

    // Atualizar pontos
    const newPoints = membership.points + points;
    const newLifetimePoints = membership.lifetimePoints + points;

    // Calcular novo tier
    const newTier = this.calculateTier(newPoints);

    const updated = await this.prisma.benefitMembership.update({
      where: { id: membership.id },
      data: {
        points: newPoints,
        lifetimePoints: newLifetimePoints,
        tier: newTier,
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        _count: {
          select: { transactions: true, redemptions: true },
        },
      },
    });

    return {
      ...this.enrichMembershipData(updated),
      pointsAdded: points,
      tierChanged: membership.tier !== newTier,
      previousTier: membership.tier,
    };
  }

  /**
   * Remover pontos (quando usar benefício)
   */
  async spendPoints(customerId: string, points: number, reason: string) {
    const membership = await this.getOrCreateMembership(customerId);

    if (points <= 0) {
      throw new BadRequestException('Pontos devem ser maiores que zero');
    }

    if (membership.points < points) {
      throw new BadRequestException('Pontos insuficientes');
    }

    // Criar transação
    await this.prisma.membershipTransaction.create({
      data: {
        membershipId: membership.id,
        type: 'SPEND',
        points: -points,
        reason,
      },
    });

    // Atualizar pontos
    const newPoints = membership.points - points;
    const newTier = this.calculateTier(newPoints);

    const updated = await this.prisma.benefitMembership.update({
      where: { id: membership.id },
      data: {
        points: newPoints,
        tier: newTier,
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return this.enrichMembershipData(updated);
  }

  /**
   * Buscar membership com detalhes completos
   */
  async findByCustomerId(customerId: string) {
    const membership = await this.getOrCreateMembership(customerId);

    // Buscar últimas transações
    const transactions = await this.prisma.membershipTransaction.findMany({
      where: { membershipId: membership.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Buscar benefícios do tier atual
    const tierBenefits = await this.prisma.tierBenefit.findMany({
      where: { tier: membership.tier, active: true },
    });

    return {
      ...membership,
      recentTransactions: transactions,
      tierBenefits: tierBenefits.map((b) => ({
        ...b,
        benefitValue: JSON.parse(b.benefitValue),
      })),
    };
  }

  /**
   * Listar todos os memberships (Admin)
   */
  async findAll(filters?: { tier?: string; status?: string }) {
    const where: any = {};

    if (filters?.tier) where.tier = filters.tier;
    if (filters?.status) where.status = filters.status;

    const memberships = await this.prisma.benefitMembership.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        _count: {
          select: { transactions: true, redemptions: true },
        },
      },
      orderBy: { lifetimePoints: 'desc' },
    });

    return memberships.map((m) => this.enrichMembershipData(m));
  }

  /**
   * Buscar benefícios de um tier
   */
  async getTierBenefits(tier: string) {
    const benefits = await this.prisma.tierBenefit.findMany({
      where: { tier, active: true },
    });

    return benefits.map((b) => ({
      ...b,
      benefitValue: JSON.parse(b.benefitValue),
    }));
  }

  /**
   * Calcular tier baseado nos pontos
   */
  private calculateTier(points: number): string {
    if (points >= TIER_CONFIG.DIAMOND.minPoints) return 'DIAMOND';
    if (points >= TIER_CONFIG.GOLD.minPoints) return 'GOLD';
    if (points >= TIER_CONFIG.SILVER.minPoints) return 'SILVER';
    return 'BRONZE';
  }

  /**
   * Enriquecer dados do membership com informações calculadas
   */
  private enrichMembershipData(membership: any) {
    const currentTier = membership.tier || 'BRONZE';
    const nextTier = this.getNextTier(currentTier);
    const nextTierPoints = nextTier ? TIER_CONFIG[nextTier].minPoints : null;
    const pointsToNextTier = nextTierPoints
      ? nextTierPoints - membership.points
      : 0;

    return {
      ...membership,
      currentTier,
      nextTier,
      pointsToNextTier: pointsToNextTier > 0 ? pointsToNextTier : 0,
      tierProgress:
        nextTierPoints && nextTierPoints > 0
          ? Math.min((membership.points / nextTierPoints) * 100, 100)
          : 100,
    };
  }

  /**
   * Obter próximo tier
   */
  private getNextTier(currentTier: string): string | null {
    const tiers = ['BRONZE', 'SILVER', 'GOLD', 'DIAMOND'];
    const currentIndex = tiers.indexOf(currentTier);
    return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
  }

  /**
   * Processar pontos de garantia (chamado quando garantia é aprovada)
   */
  async processWarrantyPoints(customerId: string, warrantyId: string) {
    return this.addPoints(customerId, {
      points: POINTS_RULES.WARRANTY_REGISTRATION,
      reason: 'Cadastro de garantia aprovado',
      referenceType: 'WARRANTY',
      referenceId: warrantyId,
    });
  }

  /**
   * Processar pontos de compra
   */
  async processPurchasePoints(customerId: string, purchaseAmount: number, purchaseId?: string) {
    const points = Math.floor(purchaseAmount / 100) * POINTS_RULES.PURCHASE_PER_100;
    
    if (points > 0) {
      return this.addPoints(customerId, {
        points,
        reason: `Compra no valor de R$ ${purchaseAmount.toFixed(2)}`,
        referenceType: 'PURCHASE',
        referenceId: purchaseId,
      });
    }
  }

  /**
   * Processar pontos de evento
   */
  async processEventPoints(customerId: string, eventId: string) {
    return this.addPoints(customerId, {
      points: POINTS_RULES.EVENT_PARTICIPATION,
      reason: 'Participação em evento',
      referenceType: 'EVENT',
      referenceId: eventId,
    });
  }
}
