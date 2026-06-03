import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WarrantyService } from './warranty.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('public', 'warranty')
@Controller()
export class WarrantyController {
  constructor(private warrantyService: WarrantyService) {}

  @Post('public/warranty')
  @ApiOperation({ summary: 'Criar garantia (público)' })
  async createPublic(@Body() body: any) {
    return this.warrantyService.createFromPublic(body);
  }

  @Get('warranty/claims')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar garantias' })
  async findAll(@Query() query: any) {
    return this.warrantyService.findAll(query);
  }

  @Get('warranty/claims/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalhes da garantia' })
  async findOne(@Param('id') id: string) {
    return this.warrantyService.findOne(id);
  }

  @Patch('warranty/claims/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Alterar status da garantia (FSM)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    return this.warrantyService.updateStatus(
      id,
      body.to_status,
      req.user.userId,
      body,
    );
  }

  @Post('warranty/claims/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aprovar garantia e enviar email com token' })
  async approve(
    @Param('id') id: string,
    @Body() body: { adminNotes?: string },
    @Request() req: any,
  ) {
    return this.warrantyService.approveWarranty(
      id,
      req.user.userId,
      body.adminNotes,
    );
  }

  @Post('warranty/claims/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rejeitar garantia e enviar email' })
  async reject(
    @Param('id') id: string,
    @Body() body: { rejectionReason: string; adminNotes?: string },
    @Request() req: any,
  ) {
    return this.warrantyService.rejectWarranty(
      id,
      req.user.userId,
      body.rejectionReason,
      body.adminNotes,
    );
  }

  @Get('public/warranty/validate/:token')
  @ApiOperation({ summary: 'Validar token de garantia (público)' })
  async validateToken(@Param('token') token: string) {
    return this.warrantyService.validateWarrantyToken(token);
  }
}
