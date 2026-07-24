import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ClubSettingsService } from './club-settings.service';
import { UpdateClubSettingsDto } from './dto/update-club-settings.dto';

@Controller('club-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClubSettingsController {
  constructor(private readonly service: ClubSettingsService) {}

  @Get()
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA')
  getSettings() {
    return this.service.getSettings();
  }

  @Put()
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  updateSettings(@Body() dto: UpdateClubSettingsDto) {
    return this.service.updateSettings(dto);
  }
}
