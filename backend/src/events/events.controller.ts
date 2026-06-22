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
import { RegisterEventDto } from './dto/register-event.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { FeedAudienceGuard } from '../common/guards/feed-audience.guard';

@ApiTags('events')
@Controller()
export class EventsController {
  constructor(private eventsService: EventsService) {}

  // ── Public ───────────────────────────────────────────────────────────────
  @Get('public/events')
  findAll() {
    return this.eventsService.findAll();
  }

  @Post('public/events/:id/register')
  @HttpCode(HttpStatus.CREATED)
  register(@Param('id') id: string, @Body() body: RegisterEventDto) {
    return this.eventsService.register(id, body);
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
}
