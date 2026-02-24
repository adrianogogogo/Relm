import { Module } from '@nestjs/common';
import { InsurancePoliciesController } from './insurance-policies.controller';
import { InsurancePoliciesService } from './insurance-policies.service';

@Module({
  controllers: [InsurancePoliciesController],
  providers: [InsurancePoliciesService],
  exports: [InsurancePoliciesService],
})
export class InsurancePoliciesModule {}
