import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { ProductsModule } from './products/products.module';
import { WarrantyModule } from './warranty/warranty.module';
import { BenefitsModule } from './benefits/benefits.module';
import { InsuranceModule } from './insurance/insurance.module';
import { EventsModule } from './events/events.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { ContentModule } from './content/content.module';
import { ReportsModule } from './reports/reports.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    PrismaModule,
    AuthModule,
    CustomersModule,
    ProductsModule,
    WarrantyModule,
    BenefitsModule,
    InsuranceModule,
    EventsModule,
    NewsletterModule,
    ContentModule,
    ReportsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
