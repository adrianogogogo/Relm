import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
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
  findStoreServices(
    @Param('storeId') storeId: string,
    @Query('active') active?: string,
  ) {
    const onlyActive = active === 'true';
    return this.storeServicesService.findByStore(storeId, onlyActive);
  }

  @Get('stores/services/:id')
  findOne(@Param('id') id: string) {
    return this.storeServicesService.findOne(id);
  }

  @Post('stores/:storeId/services')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  upsertStoreService(
    @Param('storeId') storeId: string,
    @Body() dto: UpsertStoreServiceDto,
  ) {
    return this.storeServicesService.upsert(storeId, dto);
  }

  @Patch('stores/services/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  updateStoreService(
    @Param('id') id: string,
    @Body() dto: UpdateStoreServiceDto,
  ) {
    return this.storeServicesService.update(id, dto);
  }

  @Delete('stores/services/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM')
  removeStoreService(@Param('id') id: string) {
    return this.storeServicesService.remove(id);
  }
}
