import { Module } from '@nestjs/common';
import { ExtendedWarrantiesService } from './extended-warranties.service';
import { ExtendedWarrantiesController, PublicExtendedWarrantiesController } from './extended-warranties.controller';

@Module({
  controllers: [ExtendedWarrantiesController, PublicExtendedWarrantiesController],
  providers: [ExtendedWarrantiesService],
  exports: [ExtendedWarrantiesService],
})
export class ExtendedWarrantiesModule {}
