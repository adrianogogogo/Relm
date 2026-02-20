import { Module } from '@nestjs/common';
import { WarrantyController } from './warranty.controller';
import { WarrantyService } from './warranty.service';
import { CustomersModule } from '../customers/customers.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [CustomersModule, ProductsModule],
  controllers: [WarrantyController],
  providers: [WarrantyService],
})
export class WarrantyModule {}
