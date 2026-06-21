import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationJwtStrategy } from './notification-jwt.strategy';

@Module({
  imports: [PassportModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationJwtStrategy],
  exports: [NotificationsService],
})
export class NotificationsModule {}
