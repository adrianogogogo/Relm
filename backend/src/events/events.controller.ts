import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

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
  register(
    @Param('id') id: string,
    @Body() body: { email: string; fullName: string; phone?: string },
  ) {
    return this.eventsService.register(id, body);
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
  create(@Body() body: any) {
    return this.eventsService.create(body);
  }

  @Patch('events/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() body: any) {
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
