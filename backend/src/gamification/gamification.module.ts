import { Module, forwardRef } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CustomerAuthModule } from '../customer-auth/customer-auth.module';

@Module({
  // forwardRef: ciclo Gamification -> CustomerAuth -> Engagement -> Gamification
  imports: [PrismaModule, forwardRef(() => CustomerAuthModule)],
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
