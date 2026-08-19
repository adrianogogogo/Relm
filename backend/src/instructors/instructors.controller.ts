import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  InstructorsService,
  CreateInstructorDto,
  UpdateInstructorDto,
} from './instructors.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CustomerJwtGuard } from '../customer-auth/customer-jwt.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Instructors')
@Controller('instructors')
export class InstructorsController {
  constructor(private readonly instructorsService: InstructorsService) {}

  // ── Especialidades (admin) ─────────────────────────────────────────────────
  // Declaradas antes das rotas dinâmicas: `specialties` casaria com `:id`.

  @Get('specialties')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_RELM, UserRole.GERENTE_RELM, UserRole.SUPORTE_RELM)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin — listar especialidades' })
  findSpecialties() {
    return this.instructorsService.findSpecialties();
  }

  @Post('specialties')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_RELM, UserRole.GERENTE_RELM)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin — criar especialidade' })
  createSpecialty(@Body() dto: { name: string }) {
    return this.instructorsService.createSpecialty(dto?.name);
  }

  @Patch('specialties/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_RELM, UserRole.GERENTE_RELM)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin — renomear/ativar especialidade' })
  updateSpecialty(@Param('id') id: string, @Body() dto: { name?: string; active?: boolean }) {
    return this.instructorsService.updateSpecialty(id, dto);
  }

  // ── Portal do cliente ─────────────────────────────────────────────────────

  /** Lista sem contato: `phone`/`link` só saem ao gerar a credencial. */
  @Get('for-customer')
  @UseGuards(CustomerJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Portal cliente — listar instrutores (sem contato)' })
  findForCustomer(
    @Request() req: any,
    @Query('state') state?: string,
    @Query('specialtyId') specialtyId?: string,
    @Query('remote') remote?: string,
  ) {
    return this.instructorsService.findForCustomer(req.user.customerId, {
      state: state || undefined,
      specialtyId: specialtyId || undefined,
      remote: remote === 'true',
    });
  }

  /** Especialidades ativas para montar o filtro da tela do cliente. */
  @Get('for-customer/specialties')
  @UseGuards(CustomerJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Portal cliente — especialidades ativas (filtro)' })
  findSpecialtiesForCustomer() {
    return this.instructorsService.findSpecialties(true);
  }

  @Get('credentials')
  @UseGuards(CustomerJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Portal cliente — minhas credenciais' })
  findMyCredentials(@Request() req: any) {
    return this.instructorsService.findMyCredentials(req.user.customerId);
  }

  /** Gera (ou devolve) a credencial e revela o contato. Grátis. */
  @Post(':id/credential')
  @UseGuards(CustomerJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Portal cliente — gerar credencial e ver contato' })
  createCredential(@Request() req: any, @Param('id') id: string) {
    return this.instructorsService.createCredential(req.user.customerId, id);
  }

  // ── Painel do instrutor ───────────────────────────────────────────────────

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Instrutor — meu registro e status do termo' })
  me(@Request() req: any) {
    return this.instructorsService.me(req.user.userId);
  }

  @Post('me/accept-terms')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Instrutor — aceitar termo de responsabilidade' })
  acceptTerms(@Request() req: any) {
    return this.instructorsService.acceptTerms(req.user.userId);
  }

  @Get('me/credentials')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Instrutor — clientes vinculados (PII mascarada)' })
  listCredentials(@Request() req: any) {
    return this.instructorsService.listCredentials(req.user.userId);
  }

  @Get('me/credentials/:code')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Instrutor — conferir um código' })
  checkCredential(@Request() req: any, @Param('code') code: string) {
    return this.instructorsService.checkCredential(req.user.userId, code);
  }

  @Post('me/change-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Instrutor — alterar própria senha' })
  changePassword(
    @Request() req: any,
    @Body() dto: { currentPassword: string; newPassword: string },
  ) {
    return this.instructorsService.changeMyPassword(
      req.user.userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  // ── Admin CRUD ────────────────────────────────────────────────────────────
  // Só a Relm cadastra e edita (decisão 10): o instrutor não edita o próprio
  // perfil. SUPORTE_RELM lê, ADMIN/GERENTE escrevem — padrão dos parceiros.

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_RELM, UserRole.GERENTE_RELM, UserRole.SUPORTE_RELM)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin — listar instrutores' })
  findAll() {
    return this.instructorsService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_RELM, UserRole.GERENTE_RELM, UserRole.SUPORTE_RELM)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin — detalhe do instrutor' })
  findOne(@Param('id') id: string) {
    return this.instructorsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_RELM, UserRole.GERENTE_RELM)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin — criar instrutor' })
  create(@Body() dto: CreateInstructorDto) {
    return this.instructorsService.create(dto);
  }

  @Post(':id/reset-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_RELM, UserRole.GERENTE_RELM)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin — redefinir senha do instrutor' })
  resetPassword(@Param('id') id: string, @Body() dto: { newPassword?: string }) {
    return this.instructorsService.resetInstructorPassword(id, dto?.newPassword);
  }

  @Patch(':id/toggle-active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_RELM, UserRole.GERENTE_RELM)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin — alternar ativo/inativo' })
  toggleActive(@Param('id') id: string) {
    return this.instructorsService.toggleActive(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_RELM, UserRole.GERENTE_RELM)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin — atualizar instrutor' })
  update(@Param('id') id: string, @Body() dto: UpdateInstructorDto) {
    return this.instructorsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_RELM, UserRole.GERENTE_RELM)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin — excluir cadastro do instrutor' })
  remove(@Param('id') id: string) {
    return this.instructorsService.remove(id);
  }
}
