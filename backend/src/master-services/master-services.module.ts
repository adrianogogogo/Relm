import { Module } from '@nestjs/common';
import { MasterServicesService } from './master-services.service';
import { MasterServicesController } from './master-services.controller';

@Module({
  controllers: [MasterServicesController],
  providers: [MasterServicesService],
  exports: [MasterServicesService],
})
export class MasterServicesModule {}
