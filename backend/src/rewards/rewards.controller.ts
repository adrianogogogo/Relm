import { Controller, Post, Body } from '@nestjs/common';
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

  @Post('seed')
  @ApiOperation({ summary: 'Seed rewards catalog' })
  async seedCatalog() {
    await this.rewardsService.seedCatalog();
    return { message: 'Rewards catalog seeded' };
  }
}
