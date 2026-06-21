import { Module } from '@nestjs/common';
import { WarrantyController } from './warranty.controller';
import { WarrantyService } from './warranty.service';
import { CustomersModule } from '../customers/customers.module';
import { ProductsModule } from '../products/products.module';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [CustomersModule, ProductsModule, EmailModule, NotificationsModule],
  controllers: [WarrantyController],
  providers: [WarrantyService],
})
export class WarrantyModule {}
