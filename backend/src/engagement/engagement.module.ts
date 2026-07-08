import { Module } from '@nestjs/common';
import { EngagementService } from './engagement.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PointsModule } from '../points/points.module';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [PrismaModule, PointsModule, GamificationModule],
  providers: [EngagementService],
  exports: [EngagementService],
})
export class EngagementModule {}
