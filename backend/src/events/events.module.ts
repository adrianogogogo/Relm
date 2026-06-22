import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { FeedAudienceGuard } from '../common/guards/feed-audience.guard';

@Module({
  imports: [NotificationsModule],
  controllers: [EventsController],
  providers: [EventsService, FeedAudienceGuard],
})
export class EventsModule {}
