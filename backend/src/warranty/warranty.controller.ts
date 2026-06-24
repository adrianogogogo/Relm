import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request,
  UseInterceptors, UploadedFile, BadRequestException, NotFoundException, Res, StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import { mkdirSync, existsSync, createReadStream } from 'fs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WarrantyService } from './warranty.service';
import { CreateWarrantyPublicDto } from './dto/create-warranty-public.dto';
import { CreateWarrantyAdminDto } from './dto/create-warranty-admin.dto';
import { SetCostDto } from './dto/set-cost.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AssignClaimDto } from './dto/assign-claim.dto';
import { CreateSolutionDto } from './dto/create-solution.dto';
import { ApproveSolutionDto } from './dto/approve-solution.dto';
import { UpdateClaimStatusDto } from './dto/update-claim-status.dto';

// Upload de anexos para o disco do servidor. Limite 10MB; PDF e imagens.
// ponytail: disco local — trocar por S3 se o volume crescer.
const warrantyUpload = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      const dir = join(process.cwd(), 'uploads', 'warranty');
      mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname)}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req: any, file: any, cb: any) => {
    const ok = /^(image\/(jpeg|png|webp|gif)|application\/pdf)$/.test(file.mimetype);
    cb(ok ? null : new BadRequestException('Tipo de arquivo não permitido (PDF ou imagem).'), ok);
  },
};
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
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar garantias' })
  async findAll(@Query() query: any) {
    return this.warrantyService.findAll(query);
  }

  @Get('warranty/claims/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalhes da garantia' })
  async findOne(@Param('id') id: string) {
    return this.warrantyService.findOne(id);
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

  @Get('public/warranty/validate/:token')
  @ApiOperation({ summary: 'Validar token de garantia (público)' })
  async validateToken(@Param('token') token: string) {
    return this.warrantyService.validateWarrantyToken(token);
  }

  // ── Responsável / atribuição (Onda 4) ───────────────────────────────────────

  @Get('warranty/assignable-users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar usuários atribuíveis como responsável' })
  async assignableUsers() {
    return this.warrantyService.listAssignableUsers();
  }

  @Patch('warranty/claims/:id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Definir/remover responsável da garantia' })
  async assignClaim(
    @Param('id') id: string,
    @Body() body: AssignClaimDto,
    @Request() req: any,
  ) {
    return this.warrantyService.assignClaim(id, body.userId, req.user?.userId);
  }

  // ── Novo workflow (status livre + soluções 2 níveis) ────────────────────────

  @Get('warranty/meta/statuses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar status configuráveis do workflow' })
  async listStatuses() {
    return this.warrantyService.listStatuses();
  }

  @Patch('warranty/claims/:id/workflow-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar status (tabela) + passar a bola' })
  async updateWorkflowStatus(
    @Param('id') id: string,
    @Body() body: UpdateClaimStatusDto,
    @Request() req: any,
  ) {
    return this.warrantyService.updateClaimStatus(id, body, req.user?.userId);
  }

  @Post('warranty/claims/:id/solutions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Propor solução' })
  async addSolution(
    @Param('id') id: string,
    @Body() body: CreateSolutionDto,
    @Request() req: any,
  ) {
    return this.warrantyService.addSolution(id, body, req.user?.userId);
  }

  @Patch('warranty/claims/:id/solutions/:solutionId/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aprovar/reprovar solução (2 níveis)' })
  async approveSolution(
    @Param('id') id: string,
    @Param('solutionId') solutionId: string,
    @Body() body: ApproveSolutionDto,
    @Request() req: any,
  ) {
    return this.warrantyService.approveSolution(id, solutionId, body, {
      userId: req.user?.userId,
      role: req.user?.role,
    });
  }

  // ── Tarefas da garantia (Onda 2) ────────────────────────────────────────────

  @Post('warranty/claims/:id/tasks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
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
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar tarefa da garantia' })
  async updateTask(
    @Param('taskId') taskId: string,
    @Body() body: UpdateTaskDto,
    @Request() req: any,
  ) {
    return this.warrantyService.updateTask(taskId, body, req.user?.userId);
  }

  @Delete('warranty/tasks/:taskId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover tarefa da garantia' })
  async deleteTask(@Param('taskId') taskId: string, @Request() req: any) {
    return this.warrantyService.deleteTask(taskId, req.user?.userId);
  }

  // ── Anexos da garantia (Onda 3) ─────────────────────────────────────────────

  @Post('warranty/claims/:id/attachments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file', warrantyUpload))
  @ApiOperation({ summary: 'Enviar anexo da garantia (PDF/imagem, até 10MB)' })
  async uploadAttachment(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatório.');
    }
    return this.warrantyService.createAttachment(id, file, req.user?.userId);
  }

  @Get('warranty/attachments/:attId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Baixar anexo da garantia' })
  async downloadAttachment(
    @Param('attId') attId: string,
    @Res({ passthrough: true }) res: any,
  ): Promise<StreamableFile> {
    const att = await this.warrantyService.getAttachmentForDownload(attId);
    if (!existsSync(att.storagePath)) {
      throw new NotFoundException('Arquivo não encontrado no servidor.');
    }
    res.set({
      'Content-Type': att.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(att.fileName)}"`,
    });
    return new StreamableFile(createReadStream(att.storagePath));
  }

  @Delete('warranty/attachments/:attId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover anexo da garantia' })
  async deleteAttachment(@Param('attId') attId: string, @Request() req: any) {
    return this.warrantyService.deleteAttachment(attId, req.user?.userId);
  }
}
