import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StoreAuthModule } from './store-auth/store-auth.module';
import { CustomerAuthModule } from './customer-auth/customer-auth.module';
import { CustomerPortalModule } from './customer-portal/customer-portal.module';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { CustomersModule } from './customers/customers.module';
import { StoresModule } from './stores/stores.module';
import { ProductsModule } from './products/products.module';
import { SalesModule } from './sales/sales.module';
import { WarrantyModule } from './warranty/warranty.module';
import { BenefitsModule } from './benefits/benefits.module';
import { InsuranceModule } from './insurance/insurance.module';
import { EventsModule } from './events/events.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { ContentModule } from './content/content.module';
import { ReportsModule } from './reports/reports.module';
import { BannersModule } from './banners/banners.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { PointsModule } from './points/points.module';
import { WorkshopModule } from './workshop/workshop.module';
import { RewardsModule } from './rewards/rewards.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { PaymentsModule } from './payments/payments.module';
import { EngagementModule } from './engagement/engagement.module';
import { GamificationModule } from './gamification/gamification.module';
import { PartnersModule } from './partners/partners.module';
import { ClubSettingsModule } from './club-settings/club-settings.module';
import { HealthController } from './health.controller';
import { CommonModule } from './common/common.module';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { MasterServicesModule } from './master-services/master-services.module';
import { MarketingModule } from './marketing/marketing.module';
import { EmailCrmModule } from './email-crm/email-crm.module';
import { AiAssistantModule } from './ai-assistant/ai-assistant.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    // Rate limiting global: teto moderado de 100 req/min por IP (A-03).
    // Endpoints sensíveis (login/recuperação de senha) têm limites mais
    // rígidos definidos via @Throttle nos controllers.
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    CommonModule,
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    AuthModule,
    StoreAuthModule,
    CustomerAuthModule,
    CustomerPortalModule,
    AdminUsersModule,
    AuditLogsModule,
    CustomersModule,
    StoresModule,
    MasterServicesModule,
    ProductsModule,
    SalesModule,
    WarrantyModule,
    BenefitsModule,
    InsuranceModule,
    EventsModule,
    NewsletterModule,
    ContentModule,
    ReportsModule,
    BannersModule,
    NotificationsModule,
    SubscriptionsModule,
    PointsModule,
    WorkshopModule,
    RewardsModule,
    WhatsappModule,
    PaymentsModule,
    EngagementModule,
    GamificationModule,
    PartnersModule,
    ClubSettingsModule,
    MarketingModule,
    EmailCrmModule,
    AiAssistantModule,
  ],
  controllers: [HealthController],
  providers: [
    // ThrottlerGuard global: apenas limita taxa por IP, não autentica.
    // Coexiste com os JwtAuthGuard/RolesGuard aplicados por @UseGuards nos
    // controllers (não há outro APP_GUARD global registrado).
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Auditoria de toda mutação (POST/PUT/PATCH/DELETE). Global de propósito:
    // o modelo anterior era chamada manual em 7 módulos, então todo módulo novo
    // nascia sem auditoria. AuditLogsService.log() nunca lança.
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
