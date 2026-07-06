import { Controller, Post, Body, Get, Param } from '@nestjs/common';
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
