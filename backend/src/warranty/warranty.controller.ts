import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WarrantyService } from './warranty.service';
import { CreateWarrantyPublicDto } from './dto/create-warranty-public.dto';
import { CreateWarrantyAdminDto } from './dto/create-warranty-admin.dto';
import { SetCostDto } from './dto/set-cost.dto';
import { RevertStatusDto } from './dto/revert-status.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('public', 'warranty')
@Controller()
export class WarrantyController {
  constructor(private warrantyService: WarrantyService) {}

  @Post('public/warranty')
  @ApiOperation({ summary: 'Criar garantia (público)' })
  async createPublic(@Body() body: CreateWarrantyPublicDto) {
    return this.warrantyService.createFromPublic(body);
  }

  @Post('warranty/claims')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cadastrar garantia (painel admin)' })
  async createByAdmin(
    @Body() body: CreateWarrantyAdminDto,
    @Request() req: any,
  ) {
    return this.warrantyService.createByAdmin(body, req.user?.userId);
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

  @Patch('warranty/claims/:id/cost')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Definir/limpar custo da garantia (admin/gerente)' })
  async setCost(
    @Param('id') id: string,
    @Body() body: SetCostDto,
    @Request() req: any,
  ) {
    return this.warrantyService.setCost(
      id,
      body.cost ?? null,
      req.user?.userId,
    );
  }

  @Patch('warranty/claims/:id/revert-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reverter status da garantia (override admin/gerente)',
  })
  async revertStatus(
    @Param('id') id: string,
    @Body() body: RevertStatusDto,
    @Request() req: any,
  ) {
    return this.warrantyService.revertStatus(
      id,
      body.toStatus,
      body.reason,
      req.user?.userId,
    );
  }

  @Get('public/warranty/validate/:token')
  @ApiOperation({ summary: 'Validar token de garantia (público)' })
  async validateToken(@Param('token') token: string) {
    return this.warrantyService.validateWarrantyToken(token);
  }

  // ── Tarefas da garantia (Onda 2) ────────────────────────────────────────────

  @Post('warranty/claims/:id/tasks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar tarefa da garantia' })
  async createTask(
    @Param('id') id: string,
    @Body() body: CreateTaskDto,
    @Request() req: any,
  ) {
    return this.warrantyService.createTask(id, body, req.user?.userId);
  }

  @Patch('warranty/tasks/:taskId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar tarefa da garantia' })
  async updateTask(@Param('taskId') taskId: string, @Body() body: UpdateTaskDto) {
    return this.warrantyService.updateTask(taskId, body);
  }

  @Delete('warranty/tasks/:taskId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover tarefa da garantia' })
  async deleteTask(@Param('taskId') taskId: string) {
    return this.warrantyService.deleteTask(taskId);
  }
}
