import { Module } from '@nestjs/common';
import { StoresService } from './stores.service';
import { StoresController } from './stores.controller';
import { StoreProfileController } from './store-profile.controller';
import { PublicStoresController } from './public-stores.controller';
import { StoreServicesController } from './store-services.controller';
import { StoreServicesService } from './store-services.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PublicStoresController, StoreServicesController, StoresController, StoreProfileController],
  providers: [StoresService, StoreServicesService],
  exports: [StoresService, StoreServicesService],
})
export class StoresModule {}
