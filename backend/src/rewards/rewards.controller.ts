import { Controller, Post, Body, Get, Patch, Delete, Param, Query } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TierLevel } from '@prisma/client';

@ApiTags('Rewards')
@Controller('v1/rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Post('redeem')
  @ApiOperation({ summary: 'Redeem a catalog reward item' })
  async redeemReward(@Body() dto: { customerId: string; catalogItemId: string }) {
    // customerTier NÃO é aceito do cliente — o tier é derivado da assinatura no service.
    return this.rewardsService.redeemReward({ customerId: dto.customerId, catalogItemId: dto.catalogItemId });
  }

  @Get('catalog')
  @ApiOperation({ summary: 'Get all catalog items (optional ?tier=CARE|PLUS filters presale)' })
  async getCatalog(@Query('tier') tier?: TierLevel) {
    return this.rewardsService.getCatalog(tier);
  }

  @Post('catalog')
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
  @ApiOperation({ summary: 'Inactivate catalog item' })
  async deleteCatalogItem(@Param('id') id: string) {
    return this.rewardsService.deleteCatalogItem(id);
  }

  @Get('vouchers')
  @ApiOperation({ summary: 'Get all vouchers (admin view)' })
  async getAllVouchers() {
    return this.rewardsService.getAllVouchers();
  }

  @Patch('vouchers/:code/use')
  @ApiOperation({ summary: 'Mark a voucher as used' })
  async useVoucher(@Param('code') code: string) {
    return this.rewardsService.useVoucher(code);
  }

  @Get('vouchers/:customerId')
  @ApiOperation({ summary: 'Get all vouchers for a customer' })
  async getVouchers(@Param('customerId') customerId: string) {
    return this.rewardsService.getVouchers(customerId);
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed rewards catalog' })
  async seedCatalog() {
    await this.rewardsService.seedCatalog();
    return { message: 'Rewards catalog seeded' };
  }
}
