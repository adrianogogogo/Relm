import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';
import { UpdateWhatsappSettingsDto, BroadcastDto } from './dto/whatsapp.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('WhatsApp')
@Controller('v1/webhooks/whatsapp')
export class WhatsappWebhookController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get()
  @ApiOperation({ summary: 'WhatsApp Meta webhook handshake verification' })
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ): string {
    return this.whatsappService.verifyWebhook(mode, token, challenge);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'WhatsApp message event hook' })
  async handleIncomingMessage(@Body() payload: any) {
    return this.whatsappService.handleIncomingMessage(payload);
  }
}

// ── Public endpoint (no auth) ─────────────────────────────────────────────────

@ApiTags('WhatsApp')
@Controller('public/whatsapp-contact')
export class WhatsappPublicController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Returns the configured WhatsApp contact number (public)' })
  getPublicContact() {
    return this.whatsappService.getPublicContact();
  }
}

// ── Admin endpoints ───────────────────────────────────────────────────────────

@ApiTags('WhatsApp')
@Controller('whatsapp')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN_RELM', 'GERENTE_RELM')
export class WhatsappAdminController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('settings')
  @ApiOperation({ summary: 'Get WhatsApp Cloud API settings (token masked)' })
  getSettings() {
    return this.whatsappService.getSettings();
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update WhatsApp Cloud API settings' })
  updateSettings(@Body() dto: UpdateWhatsappSettingsDto) {
    return this.whatsappService.updateSettings(dto);
  }

  @Post('broadcast')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send broadcast message to customers via WhatsApp Cloud API' })
  broadcast(@Body() dto: BroadcastDto, @Request() req: any) {
    return this.whatsappService.broadcast(dto, req.user.userId);
  }
}
