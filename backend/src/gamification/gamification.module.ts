import { Module } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CustomerAuthModule } from '../customer-auth/customer-auth.module';

@Module({
  imports: [PrismaModule, CustomerAuthModule],
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
