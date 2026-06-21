import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class NotificationJwtGuard extends AuthGuard('notification-jwt') {}
