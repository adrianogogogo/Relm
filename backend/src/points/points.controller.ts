import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PointsService } from './points.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerJwtGuard } from '../customer-auth/customer-jwt.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GrantPointsDto } from './dto/grant-points.dto';

@ApiTags('Points')
@Controller('v1/points')
@ApiBearerAuth()
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get('balance')
  @UseGuards(CustomerJwtGuard)
  @ApiOperation({ summary: 'Get points balance for the authenticated customer' })
  @ApiResponse({ status: 200, description: 'Return points balance' })
  async getBalance(@Request() req: any) {
    const balance = await this.pointsService.getBalance(req.user.customerId);
    return { balance };
  }

  @Post('admin/grant')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiOperation({ summary: 'Atribuir pontos a um cliente manualmente' })
  @ApiResponse({ status: 201, description: 'Pontos creditados com sucesso' })
  async grantPoints(@Body() dto: GrantPointsDto) {
    return this.pointsService.grantPointsByAdmin(dto.customerId, dto.points, dto.description);
  }
}
