import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA')
@ApiBearerAuth()
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('warranty-summary')
  getWarrantySummary() {
    return this.reportsService.getWarrantySummary();
  }

  @Get('dashboard-stats')
  getDashboardStats() {
    return this.reportsService.getDashboardStats();
  }
}
