import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import {
  WhatsappWebhookController,
  WhatsappPublicController,
  WhatsappAdminController,
} from './whatsapp.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PointsModule } from '../points/points.module';

@Module({
  imports: [PrismaModule, PointsModule],
  controllers: [WhatsappWebhookController, WhatsappPublicController, WhatsappAdminController],
  providers: [WhatsappService],
  exports: [WhatsappService],
})
export class WhatsappModule {}
