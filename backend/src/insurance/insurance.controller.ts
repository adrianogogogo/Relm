import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InsuranceService } from './insurance.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('insurance')
@Controller()
export class InsuranceController {
  constructor(private insuranceService: InsuranceService) {}

  // ── Público ──────────────────────────────────────────────────────────────
  @Post('public/insurance-quote')
  create(@Body() body: any) {
    return this.insuranceService.create(body);
  }

  // ── Admin ─────────────────────────────────────────────────────────────────
  @Get('insurance/quotes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA')
  @ApiBearerAuth()
  findAll(@Query() query: { storeId?: string; customerId?: string; status?: string }) {
    return this.insuranceService.findAll(query);
  }

  @Post('insurance/quotes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM')
  @ApiBearerAuth()
  createAdmin(@Body() body: { customerId: string; productId?: string; bikeValue?: number; city?: string; state?: string }) {
    return this.insuranceService.createAdminQuote(body);
  }

  @Get('insurance/quotes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA')
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.insuranceService.findOne(id);
  }

  @Patch('insurance/quotes/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiBearerAuth()
  approve(
    @Param('id') id: string,
    @Body() body: { quoteValue: number; insuranceCompany: string },
  ) {
    return this.insuranceService.approve(id, body);
  }

  @Patch('insurance/quotes/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiBearerAuth()
  reject(@Param('id') id: string) {
    return this.insuranceService.reject(id);
  }

  @Post('insurance/quotes/:id/convert')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiBearerAuth()
  convert(@Param('id') id: string) {
    return this.insuranceService.convert(id);
  }

  @Patch('insurance/quotes/:id/renew')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiBearerAuth()
  renew(@Param('id') id: string) {
    return this.insuranceService.renew(id);
  }
}
