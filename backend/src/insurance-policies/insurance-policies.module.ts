import { Module } from '@nestjs/common';
import { InsurancePoliciesController } from './insurance-policies.controller';
import { InsurancePoliciesService } from './insurance-policies.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InsurancePoliciesController],
  providers: [InsurancePoliciesService],
  exports: [InsurancePoliciesService],
})
export class InsurancePoliciesModule {}
