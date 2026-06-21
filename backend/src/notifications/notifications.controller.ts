import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationJwtGuard } from './notification-jwt.guard';

/**
 * Endpoints de notificações do usuário logado (equipe Relm ou loja).
 * Protegidos pela NotificationJwtGuard, que aceita tokens de User e StoreUser
 * e expõe { recipientType, recipientId } em req.user.
 */
@Controller('notifications')
@UseGuards(NotificationJwtGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@Request() req: any, @Query('onlyUnread') onlyUnread?: string) {
    return this.notificationsService.findForRecipient(
      req.user.recipientType,
      req.user.recipientId,
      { onlyUnread: onlyUnread === 'true', take: 20 },
    );
  }

  @Get('unread-count')
  async unreadCount(@Request() req: any) {
    const count = await this.notificationsService.unreadCount(
      req.user.recipientType,
      req.user.recipientId,
    );
    return { count };
  }

  @Patch('read-all')
  markAllRead(@Request() req: any) {
    return this.notificationsService.markAllRead(
      req.user.recipientType,
      req.user.recipientId,
    );
  }

  @Patch(':id/read')
  markRead(@Request() req: any, @Param('id') id: string) {
    return this.notificationsService.markRead(
      id,
      req.user.recipientType,
      req.user.recipientId,
    );
  }
}
