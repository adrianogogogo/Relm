import { Module } from '@nestjs/common';
import { BenefitsController } from './benefits.controller';
import { AdminBenefitsController } from './admin-benefits.controller';
import { BenefitsService } from './benefits.service';

@Module({
  controllers: [BenefitsController, AdminBenefitsController],
  providers: [BenefitsService],
})
export class BenefitsModule {}
