import { Controller, Post, Body, Get, Patch, Delete, Param } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Rewards')
@Controller('v1/rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Post('redeem')
  @ApiOperation({ summary: 'Redeem a catalog reward item' })
  async redeemReward(@Body() dto: { customerId: string; catalogItemId: string }) {
    return this.rewardsService.redeemReward(dto);
  }

  @Get('catalog')
  @ApiOperation({ summary: 'Get all catalog items' })
  async getCatalog() {
    return this.rewardsService.getCatalog();
  }

  @Post('catalog')
  @ApiOperation({ summary: 'Create catalog item' })
  async createCatalogItem(
    @Body() dto: { title: string; description: string; pointsCost: number; stock: number },
  ) {
    return this.rewardsService.createCatalogItem(dto);
  }

  @Patch('catalog/:id')
  @ApiOperation({ summary: 'Update catalog item' })
  async updateCatalogItem(
    @Param('id') id: string,
    @Body() dto: { title?: string; description?: string; pointsCost?: number; stock?: number; active?: boolean },
  ) {
    return this.rewardsService.updateCatalogItem(id, dto);
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
