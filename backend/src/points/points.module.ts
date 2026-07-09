import { Module, forwardRef } from '@nestjs/common';
import { PointsService } from './points.service';
import { PointsController } from './points.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CustomerAuthModule } from '../customer-auth/customer-auth.module';

@Module({
  // forwardRef: ciclo Points -> CustomerAuth -> Engagement -> Points
  imports: [PrismaModule, forwardRef(() => CustomerAuthModule)],
  controllers: [PointsController],
  providers: [PointsService],
  exports: [PointsService],
})
export class PointsModule {}
