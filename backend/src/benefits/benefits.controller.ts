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
import { BenefitsService } from './benefits.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { FeedAudienceGuard } from '../common/guards/feed-audience.guard';
import { TIER_COMPARISON, ENTITLEMENTS } from '../common/entitlements';

@ApiTags('benefits')
@Controller()
export class BenefitsController {
  constructor(private benefitsService: BenefitsService) {}

  // ── Public ───────────────────────────────────────────────────────────────
  @Get('public/benefits')
  findAllPublic() {
    return this.benefitsService.findAllPublic();
  }

  // Tabela comparativa CARE vs PLUS — mesma fonte que o enforcement.
  @Get('public/tiers/comparison')
  tiersComparison() {
    return TIER_COMPARISON;
  }

  // Knobs por tier — o frontend indexa por user.currentTier (mesma fonte do enforcement).
  @Get('public/tiers/entitlements')
  tiersEntitlements() {
    return ENTITLEMENTS;
  }

  // ── Feed segmentado por perfil (autenticado: CLIENTE/LOJA/DISTRIBUIDOR) ────
  @Get('benefits/feed')
  @UseGuards(FeedAudienceGuard)
  @ApiBearerAuth()
  feed(@Req() req: any) {
    return this.benefitsService.findFeed(req.feedAudience);
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
