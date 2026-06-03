import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InsuranceService } from './insurance.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('insurance')
@Controller()
export class InsuranceController {
  constructor(private insuranceService: InsuranceService) {}

  @Post('public/insurance-quote')
  create(@Body() body: any) {
    return this.insuranceService.create(body);
  }

  @Get('insurance/quotes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA')
  @ApiBearerAuth()
  findAll(@Query() query: { storeId?: string; customerId?: string; status?: string }) {
    return this.insuranceService.findAll(query);
  }
}
