import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';
import { TierLevel, SubStatus } from '@prisma/client';
import { PointsService } from '../points/points.service';
import { ENTITLEMENTS } from '../common/entitlements';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly pointsService: PointsService,
  ) {}

  async salesTrigger(dto: { customer_email: string; product_serial_number: string; invoice_type: 'BIKE' | 'ACCESSORY'; purchase_value?: number }) {
    this.logger.log(`Sales trigger received for email ${dto.customer_email}, serial ${dto.product_serial_number}, type ${dto.invoice_type}, value ${dto.purchase_value}`);
    
    const customer = await this.prisma.customer.findUnique({
      where: { email: dto.customer_email },
    });

    if (!customer) {
      throw new Error(`Customer with email ${dto.customer_email} not found`);
    }

    const tier = dto.invoice_type === 'BIKE' ? TierLevel.PLUS : TierLevel.CARE;
    const expiresAt = dto.invoice_type === 'BIKE' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null;
    const status = SubStatus.ACTIVE;

    // Renovação = compra de bike por quem já é PLUS ativo → rende bônus de pontos.
    const existing = await this.prisma.subscription.findUnique({ where: { customerId: customer.id } });
    const isRenewal =
      dto.invoice_type === 'BIKE' &&
      existing?.tier === TierLevel.PLUS &&
      existing?.status === SubStatus.ACTIVE;

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.customer.update({
        where: { id: customer.id },
        data: { currentTier: tier },
      });

      const subscription = await tx.subscription.upsert({
        where: { customerId: customer.id },
        update: {
          tier,
          status,
          expiresAt,
          activatedAt: new Date(),
        },
        create: {
          customerId: customer.id,
          tier,
          status,
          expiresAt,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: null,
          action: 'UPDATE_SENSITIVE',
          entity: 'subscriptions',
          entityId: subscription.id,
          metadata: { reason: 'Sales trigger activation', tier, expiresAt },
        },
      });

      // Se um valor de compra foi enviado, acumular os pontos no ledger
      if (dto.purchase_value && dto.purchase_value > 0) {
        await this.pointsService.addPurchasePoints(
          customer.id,
          dto.purchase_value,
          `Compra de ${dto.invoice_type} - Série ${dto.product_serial_number}`,
          subscription.id,
          tx,
        );
      }

      // Bônus de renovação (benefício PLUS).
      if (isRenewal && ENTITLEMENTS[TierLevel.PLUS].renewalBonusPoints > 0) {
        await this.pointsService.earnPoints(
          customer.id,
          ENTITLEMENTS[TierLevel.PLUS].renewalBonusPoints,
          'Bônus de renovação Care Plus',
          subscription.id,
          tx,
        );
      }

      return { customer, subscription };
    });

    this.eventEmitter.emit('subscription.activated', {
      customerId: customer.id,
      tier,
      expiresAt,
    });

    return updated.subscription;
  }

  @Cron('0 1 * * *')
  async handleSubscriptionExpiration() {
    this.logger.log('Running daily subscription expiration cron job...');
    const now = new Date();

    const expiredSubs = await this.prisma.subscription.findMany({
      where: {
        status: SubStatus.ACTIVE,
        expiresAt: { lt: now },
        autoRenew: false,
      },
    });

    this.logger.log(`Found ${expiredSubs.length} expired subscriptions to downgrade.`);

    for (const sub of expiredSubs) {
      try {
        await this.prisma.$transaction(async (tx) => {
          await tx.subscription.update({
            where: { id: sub.id },
            data: {
              tier: TierLevel.CARE,
              status: SubStatus.DOWNGRADED,
              expiresAt: null,
            },
          });

          await tx.customer.update({
            where: { id: sub.customerId },
            data: { currentTier: TierLevel.CARE },
          });

          await tx.auditLog.create({
            data: {
              userId: null,
              action: 'UPDATE_SENSITIVE',
              entity: 'subscriptions',
              entityId: sub.id,
              metadata: { reason: 'Auto downgrade due to expiration' },
            },
          });
        });

        this.eventEmitter.emit('subscription.downgraded', {
          customerId: sub.customerId,
          subscriptionId: sub.id,
        });

        this.logger.log(`Successfully downgraded subscription ${sub.id} for customer ${sub.customerId}`);
      } catch (err) {
        this.logger.error(`Failed to expire subscription ${sub.id}: ${err.message}`);
      }
    }
  }
}
