import { Module } from '@nestjs/common';
import { EngagementService } from './engagement.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PointsModule } from '../points/points.module';

@Module({
  imports: [PrismaModule, PointsModule],
  providers: [EngagementService],
  exports: [EngagementService],
})
export class EngagementModule {}
