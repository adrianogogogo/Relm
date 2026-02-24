import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MembershipService } from './membership.service';
import { AddPointsDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('membership')
@Controller('membership')
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  // PUBLIC ENDPOINT - Buscar membership de um cliente
  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Buscar membership de um cliente (público)' })
  async getByCustomerId(@Param('customerId') customerId: string) {
    return this.membershipService.findByCustomerId(customerId);
  }

  // ADMIN ENDPOINTS
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos os memberships (Admin)' })
  @ApiQuery({ name: 'tier', required: false })
  @ApiQuery({ name: 'status', required: false })
  async findAll(
    @Query('tier') tier?: string,
    @Query('status') status?: string,
  ) {
    return this.membershipService.findAll({ tier, status });
  }

  @Post('customer/:customerId/points')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Adicionar pontos manualmente (Admin)' })
  async addPoints(
    @Param('customerId') customerId: string,
    @Body() addPointsDto: AddPointsDto,
  ) {
    return this.membershipService.addPoints(customerId, addPointsDto);
  }

  @Get('tiers/:tier/benefits')
  @ApiOperation({ summary: 'Buscar benefícios de um tier' })
  async getTierBenefits(@Param('tier') tier: string) {
    return this.membershipService.getTierBenefits(tier);
  }

  @Get('tiers')
  @ApiOperation({ summary: 'Listar todos os tiers com seus requisitos' })
  async getTiers() {
    return {
      tiers: [
        {
          name: 'BRONZE',
          minPoints: 0,
          maxPoints: 499,
          benefits: await this.membershipService.getTierBenefits('BRONZE'),
        },
        {
          name: 'SILVER',
          minPoints: 500,
          maxPoints: 1499,
          benefits: await this.membershipService.getTierBenefits('SILVER'),
        },
        {
          name: 'GOLD',
          minPoints: 1500,
          maxPoints: 4999,
          benefits: await this.membershipService.getTierBenefits('GOLD'),
        },
        {
          name: 'DIAMOND',
          minPoints: 5000,
          maxPoints: null,
          benefits: await this.membershipService.getTierBenefits('DIAMOND'),
        },
      ],
    };
  }
}
