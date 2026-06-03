import { Module } from '@nestjs/common';
import { InsuranceController } from './insurance.controller';
import { InsuranceService } from './insurance.service';

@Module({
  imports: [],
  controllers: [InsuranceController],
  providers: [InsuranceService],
})
export class InsuranceModule {}
