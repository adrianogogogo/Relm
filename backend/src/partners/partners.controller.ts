import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PartnersService, CreatePartnerDto, UpdatePartnerDto } from './partners.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CustomerJwtGuard } from '../customer-auth/customer-jwt.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Partners')
@Controller('partners')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  // ── Admin CRUD ─────────────────────────────────────────────────────────────

  /** Lista todos os parceiros (ativos e inativos). Roles: ADMIN/GERENTE leitura+escrita, SUPORTE só leitura. */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_RELM, UserRole.GERENTE_RELM, UserRole.SUPORTE_RELM)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin — listar todos os parceiros' })
  findAll() {
    return this.partnersService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_RELM, UserRole.GERENTE_RELM)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin — criar parceiro' })
  create(@Body() dto: CreatePartnerDto) {
    return this.partnersService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_RELM, UserRole.GERENTE_RELM)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin — atualizar parceiro' })
  update(@Param('id') id: string, @Body() dto: UpdatePartnerDto) {
    return this.partnersService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_RELM, UserRole.GERENTE_RELM)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin — inativar parceiro' })
  remove(@Param('id') id: string) {
    return this.partnersService.remove(id);
  }

  // ── Customer portal ────────────────────────────────────────────────────────

  /** Lista parceiros ativos anotados com eligible=true/false conforme o tier do cliente. */
  @Get('for-customer')
  @UseGuards(CustomerJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Portal cliente — listar parceiros com flag eligible' })
  findForCustomer(@Request() req: any) {
    return this.partnersService.findForCustomer(req.user.customerId);
  }
}
