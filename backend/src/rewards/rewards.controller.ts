import { Controller, Post, Body, Get, Patch, Delete, Param, Query, UseGuards, Request } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TierLevel } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CustomerJwtGuard } from '../customer-auth/customer-jwt.guard';

@ApiTags('Rewards')
@Controller('v1/rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Post('redeem')
  @UseGuards(CustomerJwtGuard)
  @ApiOperation({ summary: 'Redeem a catalog reward item' })
  async redeemReward(@Request() req: any, @Body() dto: { customerId: string; catalogItemId: string }) {
    // customerId vem do token, nunca do body — senão qualquer um resgata em nome
    // de qualquer cliente. O campo customerId do corpo é aceito e descartado por
    // compatibilidade com o frontend atual.
    return this.rewardsService.redeemReward({
      customerId: req.user.customerId,
      catalogItemId: dto.catalogItemId,
    });
  }

  @Post('redeem-service')
  @UseGuards(CustomerJwtGuard)
  @ApiOperation({ summary: 'Resgatar um serviço de loja com pontos' })
  async redeemService(@Request() req: any, @Body() dto: { storeServiceId: string }) {
    // Mesmo cuidado do resgate de prêmio: o cliente vem do token, nunca do body.
    return this.rewardsService.redeemService({
      customerId: req.user.customerId,
      storeServiceId: dto.storeServiceId,
    });
  }

  @Get('services')
  @UseGuards(CustomerJwtGuard)
  @ApiOperation({ summary: 'Serviços resgatáveis com pontos (?storeId filtra por loja)' })
  async getRedeemableServices(@Query('storeId') storeId?: string) {
    return this.rewardsService.getRedeemableServices(storeId);
  }

  // ponytail: catálogo permanece público — é lido pelo portal do cliente e pelo
  // admin, que usam tokens de tipos diferentes. Sem PII e somente leitura.
  // Se um dia precisar fechar, exigirá um guard que aceite ambos os tipos.
  @Get('catalog')
  @ApiOperation({ summary: 'Get all catalog items (optional ?tier=CARE|PLUS filters presale)' })
  async getCatalog(@Query('tier') tier?: TierLevel) {
    return this.rewardsService.getCatalog(tier);
  }

  @Post('catalog')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiOperation({ summary: 'Create catalog item' })
  async createCatalogItem(
    @Body() dto: {
      title: string;
      description: string;
      pointsCost: number;
      stock: number;
      presaleUntil?: string | null;
      presaleTier?: TierLevel | null;
    },
  ) {
    return this.rewardsService.createCatalogItem({
      ...dto,
      presaleUntil: dto.presaleUntil ? new Date(dto.presaleUntil) : null,
    });
  }

  @Patch('catalog/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiOperation({ summary: 'Update catalog item' })
  async updateCatalogItem(
    @Param('id') id: string,
    @Body() dto: {
      title?: string;
      description?: string;
      pointsCost?: number;
      stock?: number;
      active?: boolean;
      presaleUntil?: string | null;
      presaleTier?: TierLevel | null;
    },
  ) {
    return this.rewardsService.updateCatalogItem(id, {
      ...dto,
      presaleUntil: dto.presaleUntil !== undefined
        ? (dto.presaleUntil ? new Date(dto.presaleUntil) : null)
        : undefined,
    });
  }

  @Delete('catalog/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiOperation({ summary: 'Inactivate catalog item' })
  async deleteCatalogItem(@Param('id') id: string) {
    return this.rewardsService.deleteCatalogItem(id);
  }

  @Get('vouchers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM')
  @ApiOperation({ summary: 'Get all vouchers (admin view)' })
  async getAllVouchers() {
    return this.rewardsService.getAllVouchers();
  }

  @Post('vouchers/manual')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiOperation({ summary: 'Create voucher manually (Admin/Gerente only)' })
  async createVoucherManual(
    @Request() req: any,
    @Body() dto: {
      customerId: string;
      catalogItemId: string;
      debitPoints: boolean;
      expirationDays: number;
    },
  ) {
    return this.rewardsService.createVoucherManual({
      ...dto,
      requesterUserId: req.user.userId,
    });
  }

  @Patch('vouchers/:code/use')
  @UseGuards(JwtAuthGuard, RolesGuard)
  // LOJA entra para poder baixar o voucher no atendimento. O escopo é feito no
  // service: a loja só dá baixa em voucher de serviço DELA.
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA')
  @ApiOperation({ summary: 'Mark a voucher as used' })
  async useVoucher(@Param('code') code: string, @Request() req: any) {
    return this.rewardsService.useVoucher(code, {
      userId: req.user?.userId,
      role: req.user?.role,
    });
  }

  @Get('vouchers/:customerId')
  @UseGuards(CustomerJwtGuard)
  @ApiOperation({ summary: 'Get all vouchers for a customer' })
  async getVouchers(@Request() req: any, @Param('customerId') customerId: string) {
    // O :customerId da URL é ignorado — o cliente só enxerga os próprios vouchers.
    // ponytail: parâmetro mantido na rota só para não quebrar o frontend atual.
    return this.rewardsService.getVouchers(req.user.customerId);
  }

  @Post('seed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM')
  @ApiOperation({ summary: 'Seed rewards catalog' })
  async seedCatalog() {
    await this.rewardsService.seedCatalog();
    return { message: 'Rewards catalog seeded' };
  }
}
