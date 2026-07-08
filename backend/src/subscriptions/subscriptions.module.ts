import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PointsModule } from '../points/points.module';
import { EngagementModule } from '../engagement/engagement.module';

@Module({
  imports: [PrismaModule, PointsModule, EngagementModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
