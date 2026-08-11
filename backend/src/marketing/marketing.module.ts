import { Module } from '@nestjs/common';
import { MarketingService } from './marketing.service';
import { LandingPublicController, MarketingController } from './marketing.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MarketingController, LandingPublicController],
  providers: [MarketingService],
  exports: [MarketingService],
})
export class MarketingModule {}
