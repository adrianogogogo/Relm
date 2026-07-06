import { Controller, Get, Param } from '@nestjs/common';
import { PointsService } from './points.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Points')
@Controller('v1/points')
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get('balance/:customerId')
  @ApiOperation({ summary: 'Get points balance for a customer' })
  @ApiResponse({ status: 200, description: 'Return points balance' })
  async getBalance(@Param('customerId') customerId: string) {
    const balance = await this.pointsService.getBalance(customerId);
    return { balance };
  }
}
