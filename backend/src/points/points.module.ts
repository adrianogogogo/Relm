import { Module, forwardRef } from '@nestjs/common';
import { PointsService } from './points.service';
import { PointsController } from './points.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CustomerAuthModule } from '../customer-auth/customer-auth.module';
import { ClubSettingsModule } from '../club-settings/club-settings.module';

@Module({
  // forwardRef: ciclo Points -> CustomerAuth -> Engagement -> Points
  imports: [PrismaModule, forwardRef(() => CustomerAuthModule), ClubSettingsModule],
  controllers: [PointsController],
  providers: [PointsService],
  exports: [PointsService],
})
export class PointsModule {}
