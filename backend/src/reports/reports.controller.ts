import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  // ── Endpoints existentes (todos os papéis admin/gerente/suporte/loja) ────

  @Get('warranty-summary')
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA')
  getWarrantySummary() {
    return this.reportsService.getWarrantySummary();
  }

  @Get('dashboard-stats')
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA')
  getDashboardStats() {
    return this.reportsService.getDashboardStats();
  }

  // ── ONDA 7: Relatórios financeiros do clube (ADMIN_RELM + GERENTE_RELM) ──

  /** Passivo total de pontos ativos × valor do ponto em BRL. */
  @Get('club/points-liability')
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  getClubPointsLiability() {
    return this.reportsService.getClubPointsLiability();
  }

  /** Receita mensal (últimos 12 meses), MRR, renovações e churn. */
  @Get('club/revenue')
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  getClubRevenue() {
    return this.reportsService.getClubRevenue();
  }

  /** Funil de origens dos membros, upgrades e indicações. */
  @Get('club/funnel')
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  getClubFunnel() {
    return this.reportsService.getClubFunnel();
  }
}
