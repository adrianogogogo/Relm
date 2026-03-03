import { Module } from '@nestjs/common';
import { CustomerProductsService } from './customer-products.service';
import { CustomerProductsController, PublicCustomerProductsController } from './customer-products.controller';

@Module({
  controllers: [CustomerProductsController, PublicCustomerProductsController],
  providers: [CustomerProductsService],
  exports: [CustomerProductsService],
})
export class CustomerProductsModule {}
