import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ExtendedWarrantiesService } from './extended-warranties.service';
import { GrantWarrantyDto } from './dto/grant-warranty.dto';
import { CancelWarrantyDto } from './dto/cancel-warranty.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('extended-warranties', 'admin')
@ApiBearerAuth()
@Controller('api/admin/extended-warranties')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN_RELM', 'GERENTE_RELM')
export class ExtendedWarrantiesController {
  constructor(private readonly service: ExtendedWarrantiesService) {}

  @Post('grant')
  @ApiOperation({ summary: 'Conceder garantia estendida (brinde/promo)' })
  grant(@Body() grantDto: GrantWarrantyDto, @Request() req) {
    const userId = req.user.sub;
    return this.service.grant(grantDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar garantias estendidas' })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'customerProductId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'EXPIRED', 'CANCELLED', 'USED'] })
  @ApiQuery({ name: 'type', required: false, enum: ['PURCHASED', 'GRANTED', 'PROMOTIONAL', 'CLUB_REDEMPTION'] })
  findAll(
    @Query('customerId') customerId?: string,
    @Query('customerProductId') customerProductId?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.service.findAll({
      customerId,
      customerProductId,
      status,
      type,
    });
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Estatísticas de garantias estendidas' })
  getStatistics() {
    return this.service.getStatistics();
  }

  @Get('check-expired')
  @ApiOperation({ summary: 'Verificar e marcar garantias expiradas' })
  checkExpired() {
    return this.service.checkExpired();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar garantia por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancelar garantia estendida' })
  cancel(
    @Param('id') id: string,
    @Body() cancelDto: CancelWarrantyDto,
    @Request() req,
  ) {
    const userId = req.user.sub;
    return this.service.cancel(id, cancelDto, userId);
  }
}

// ============================================
// CONTROLLER PÚBLICO/CLIENTE
// ============================================

@ApiTags('extended-warranties', 'public')
@Controller('api/extended-warranties')
export class PublicExtendedWarrantiesController {
  constructor(private readonly service: ExtendedWarrantiesService) {}

  @Get('my-warranties')
  @ApiOperation({ summary: 'Minhas garantias estendidas' })
  @ApiQuery({ name: 'customerId', required: true })
  myWarranties(@Query('customerId') customerId: string) {
    return this.service.findAll({ customerId, status: 'ACTIVE' });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver detalhes da minha garantia' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // TODO: Implementar compra de garantia (requer integração de pagamento)
  // TODO: Implementar resgate com pontos do clube
}
