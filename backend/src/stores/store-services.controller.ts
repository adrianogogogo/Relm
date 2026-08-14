import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import {
  StoreServicesService,
  UpsertStoreServiceDto,
  UpdateStoreServiceDto,
} from './store-services.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller()
export class StoreServicesController {
  constructor(private readonly storeServicesService: StoreServicesService) {}

  @Get('public/stores/:storeId/services')
  findPublicStoreServices(@Param('storeId') storeId: string) {
    return this.storeServicesService.findByStore(storeId, true);
  }

  @Get('stores/:storeId/services')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA', 'DISTRIBUIDOR', 'CLIENTE')
  findStoreServices(
    @Param('storeId') storeId: string,
    @Query('active') active?: string,
  ) {
    const onlyActive = active === 'true';
    return this.storeServicesService.findByStore(storeId, onlyActive);
  }

  @Get('stores/services/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA', 'DISTRIBUIDOR', 'CLIENTE')
  findOne(@Param('id') id: string) {
    return this.storeServicesService.findOne(id);
  }

  @Post('stores/:storeId/services')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA', 'DISTRIBUIDOR')
  upsertStoreService(
    @Param('storeId') storeId: string,
    @Body() dto: UpsertStoreServiceDto,
    @Req() req: any,
  ) {
    if (req.user?.role === 'LOJA' && req.user?.storeId && req.user.storeId !== storeId) {
      throw new ForbiddenException('A loja só pode gerenciar serviços do seu próprio perfil');
    }
    return this.storeServicesService.upsert(storeId, dto);
  }

  @Patch('stores/services/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA', 'DISTRIBUIDOR')
  async updateStoreService(
    @Param('id') id: string,
    @Body() dto: UpdateStoreServiceDto,
    @Req() req: any,
  ) {
    if (req.user?.role === 'LOJA' && req.user?.storeId) {
      const existing = await this.storeServicesService.findOne(id);
      if (existing.storeId !== req.user.storeId) {
        throw new ForbiddenException('A loja só pode alterar serviços do seu próprio perfil');
      }
    }
    return this.storeServicesService.update(id, dto);
  }

  @Delete('stores/services/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA', 'DISTRIBUIDOR')
  async removeStoreService(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    if (req.user?.role === 'LOJA' && req.user?.storeId) {
      const existing = await this.storeServicesService.findOne(id);
      if (existing.storeId !== req.user.storeId) {
        throw new ForbiddenException('A loja só pode desativar serviços do seu próprio perfil');
      }
    }
    return this.storeServicesService.remove(id);
  }
}
