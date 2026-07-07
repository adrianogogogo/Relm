import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { PointsService } from './points.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerJwtGuard } from '../customer-auth/customer-jwt.guard';

@ApiTags('Points')
@Controller('v1/points')
@UseGuards(CustomerJwtGuard)
@ApiBearerAuth()
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get points balance for the authenticated customer' })
  @ApiResponse({ status: 200, description: 'Return points balance' })
  async getBalance(@Request() req: any) {
    const balance = await this.pointsService.getBalance(req.user.customerId);
    return { balance };
  }
}
