import { Module, forwardRef } from '@nestjs/common';
import { EngagementService } from './engagement.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PointsModule } from '../points/points.module';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  // forwardRef: ciclo Points -> CustomerAuth -> Engagement -> Points
  imports: [PrismaModule, forwardRef(() => PointsModule), GamificationModule],
  providers: [EngagementService],
  exports: [EngagementService],
})
export class EngagementModule {}
