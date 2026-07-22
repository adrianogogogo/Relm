import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { BulkCreateStoresDto } from './dto/bulk-create-stores.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('stores')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'DISTRIBUIDOR')
  create(@Body() createStoreDto: CreateStoreDto) {
    return this.storesService.create(createStoreDto);
  }

  // Importação em lote via planilha (.csv/.xlsx). Restrito a admin/gerente.
  @Post('bulk')
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  bulkCreate(@Body() dto: BulkCreateStoresDto) {
    return this.storesService.createMany(dto.stores);
  }

  @Get()
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'DISTRIBUIDOR', 'LOJA')
  findAll(
    @Query('search') search?: string,
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('active') active?: string,
  ) {
    return this.storesService.findAll({
      search,
      city,
      state,
      active: active === 'true' ? true : active === 'false' ? false : undefined,
    });
  }

  @Get(':id')
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA', 'DISTRIBUIDOR')
  findOne(@Param('id') id: string) {
    return this.storesService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'DISTRIBUIDOR')
  update(@Param('id') id: string, @Body() updateStoreDto: UpdateStoreDto) {
    return this.storesService.update(id, updateStoreDto);
  }

  @Delete(':id')
  @Roles('ADMIN_RELM')
  remove(@Param('id') id: string) {
    return this.storesService.remove(id);
  }
}
