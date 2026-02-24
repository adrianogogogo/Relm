import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { MembershipModule } from '../membership/membership.module';
import { EventsController, PublicEventsController } from './events.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, MembershipModule],
  controllers: [EventsController, PublicEventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
