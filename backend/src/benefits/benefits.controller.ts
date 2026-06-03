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
import { BenefitsService } from './benefits.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('benefits')
@Controller()
export class BenefitsController {
  constructor(private benefitsService: BenefitsService) {}

  // ── Public ───────────────────────────────────────────────────────────────
  @Get('public/benefits')
  findAllPublic() {
    return this.benefitsService.findAllPublic();
  }

  // ── Admin ────────────────────────────────────────────────────────────────
  @Get('benefits')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM')
  @ApiBearerAuth()
  findAllAdmin() {
    return this.benefitsService.findAllAdmin();
  }

  @Get('benefits/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM')
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.benefitsService.findOne(id);
  }

  @Post('benefits')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: any) {
    return this.benefitsService.create(body);
  }

  @Patch('benefits/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() body: any) {
    return this.benefitsService.update(id, body);
  }

  @Delete('benefits/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM')
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.benefitsService.remove(id);
  }
}
