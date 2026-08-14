import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { EngagementService } from '../engagement/engagement.service';
import { RegisterEventDto } from './dto/register-event.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { FeedAudienceGuard } from '../common/guards/feed-audience.guard';

import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@ApiTags('events')
@Controller()
export class EventsController {
  constructor(
    private eventsService: EventsService,
    private engagementService: EngagementService,
    private config: ConfigService,
  ) {}

  // ── Public ───────────────────────────────────────────────────────────────
  @Get('public/events')
  findAll() {
    return this.eventsService.findAll();
  }

  @Post('public/events/:id/register')
  @HttpCode(HttpStatus.CREATED)
  register(@Param('id') id: string, @Body() body: RegisterEventDto, @Req() req: any) {
    let authCustomerId: string | undefined = undefined;
    const auth: string | undefined = req.headers?.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      const token = auth.slice('Bearer '.length).trim();
      const customerSecret = this.config.get<string>('CUSTOMER_JWT_SECRET') || this.config.get<string>('JWT_SECRET');
      const defaultSecret = this.config.get<string>('JWT_SECRET');
      try {
        const payload: any = jwt.verify(token, customerSecret as string) || jwt.verify(token, defaultSecret as string);
        if (payload?.type === 'CUSTOMER' || payload?.customerId) {
          authCustomerId = payload.customerId || payload.sub;
        }
      } catch {}
    }
    return this.eventsService.register(id, body, authCustomerId);
  }

  // ── Feed segmentado por perfil (autenticado: CLIENTE/LOJA/DISTRIBUIDOR) ────
  @Get('events/feed')
  @UseGuards(FeedAudienceGuard)
  @ApiBearerAuth()
  feed(@Req() req: any) {
    return this.eventsService.findFeed(req.feedAudience);
  }

  // ── Admin ────────────────────────────────────────────────────────────────
  @Get('events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM')
  @ApiBearerAuth()
  findAllAdmin() {
    return this.eventsService.findAllAdmin();
  }

  @Get('events/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM')
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Post('events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: CreateEventDto) {
    return this.eventsService.create(body);
  }

  @Patch('events/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() body: UpdateEventDto) {
    return this.eventsService.update(id, body);
  }

  @Delete('events/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM')
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }

  @Get('events/:id/registrations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM')
  @ApiBearerAuth()
  getRegistrations(@Param('id') id: string) {
    return this.eventsService.getRegistrations(id);
  }

  /** Marca presença de um inscrito (admin) e credita pontos de participação. */
  @Patch('events/registrations/:registrationId/attend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM')
  @ApiBearerAuth()
  markAttendance(@Param('registrationId') registrationId: string) {
    return this.engagementService.markAttendance(registrationId);
  }
}
