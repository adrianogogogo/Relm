import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request,
} from '@nestjs/common';
import { PointsService } from './points.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerJwtGuard } from '../customer-auth/customer-jwt.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GrantPointsDto } from './dto/grant-points.dto';
import { CreatePointsRuleDto, UpdatePointsRuleDto } from './dto/points-rule.dto';

@ApiTags('Points')
@Controller('v1/points')
@ApiBearerAuth()
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get('balance')
  @UseGuards(CustomerJwtGuard)
  @ApiOperation({ summary: 'Saldos de pontos do cliente autenticado' })
  @ApiResponse({
    status: 200,
    description: 'accumulated (histórico), monthly (uso-ou-perde do Plus) e total',
  })
  async getBalance(@Request() req: any) {
    const balances = await this.pointsService.getBalances(req.user.customerId);
    // `balance` continua sendo o ACUMULÁVEL, não o total — de propósito. É o
    // que o resgate de catálogo aceita (rewards.service.ts valida e debita só
    // o acumulável), então apontá-lo para o total faria a tela oferecer um
    // resgate que o backend recusa. Os campos novos são aditivos: nenhum
    // consumidor existente quebra.
    return { balance: balances.accumulated, ...balances };
  }

  @Post('admin/grant')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiOperation({ summary: 'Atribuir pontos a um cliente manualmente' })
  @ApiResponse({ status: 201, description: 'Pontos creditados com sucesso' })
  async grantPoints(@Body() dto: GrantPointsDto) {
    return this.pointsService.grantPointsByAdmin(dto.customerId, dto.points, dto.description);
  }

  // ── Regras de pontuação por produto/categoria ─────────────────────────────

  @Get('admin/rules')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiOperation({ summary: 'Listar regras de pontuação' })
  listRules() {
    return this.pointsService.listPointsRules();
  }

  @Post('admin/rules')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiOperation({ summary: 'Criar regra de pontuação (produto OU categoria)' })
  createRule(@Body() dto: CreatePointsRuleDto) {
    return this.pointsService.createPointsRule(dto);
  }

  @Patch('admin/rules/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiOperation({ summary: 'Alterar modo, valor ou estado de uma regra' })
  updateRule(@Param('id') id: string, @Body() dto: UpdatePointsRuleDto) {
    return this.pointsService.updatePointsRule(id, dto);
  }

  @Delete('admin/rules/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiOperation({ summary: 'Remover regra de pontuação' })
  removeRule(@Param('id') id: string) {
    return this.pointsService.removePointsRule(id);
  }
}
