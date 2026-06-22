import { Module } from '@nestjs/common';
import { BenefitsController } from './benefits.controller';
import { BenefitsService } from './benefits.service';
import { FeedAudienceGuard } from '../common/guards/feed-audience.guard';

@Module({
  controllers: [BenefitsController],
  providers: [BenefitsService, FeedAudienceGuard],
})
export class BenefitsModule {}
