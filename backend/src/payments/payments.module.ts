import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CustomerAuthModule } from '../customer-auth/customer-auth.module';
import { GamificationModule } from '../gamification/gamification.module';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { StorePaymentsController } from './store-payments.controller';
import { CustomerPaymentsController } from './customer-payments.controller';
import { ManualGatewayService } from './gateway/manual-gateway.service';
import { PAYMENT_GATEWAY } from './gateway/payment-gateway.interface';

@Module({
  imports: [
    PrismaModule,
    SubscriptionsModule,
    NotificationsModule,
    CustomerAuthModule, // fornece a estratégia customer-jwt
    GamificationModule,
  ],
  controllers: [
    PaymentsController,
    StorePaymentsController,
    CustomerPaymentsController,
  ],
  providers: [
    PaymentsService,
    // Drop-in: para plugar um gateway real, troque a classe abaixo.
    { provide: PAYMENT_GATEWAY, useClass: ManualGatewayService },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
