import { Module } from '@nestjs/common';
import { BenefitsController } from './benefits.controller';
import { PublicBenefitsController } from './public-benefits.controller';
import { BenefitsService } from './benefits.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BenefitsController, PublicBenefitsController],
  providers: [BenefitsService],
  exports: [BenefitsService],
})
export class BenefitsModule {}
