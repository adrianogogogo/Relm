import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  MasterServicesService,
  CreateMasterServiceDto,
  UpdateMasterServiceDto,
} from './master-services.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('master-services')
export class MasterServicesController {
  constructor(private readonly masterServicesService: MasterServicesService) {}

  @Get('public')
  findPublic() {
    return this.masterServicesService.findAll(true);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA', 'DISTRIBUIDOR')
  findAll(@Query('active') active?: string) {
    const onlyActive = active === 'true';
    return this.masterServicesService.findAll(onlyActive);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM')
  findOne(@Param('id') id: string) {
    return this.masterServicesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM')
  create(@Body() dto: CreateMasterServiceDto) {
    return this.masterServicesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMasterServiceDto,
  ) {
    return this.masterServicesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM')
  remove(@Param('id') id: string) {
    return this.masterServicesService.remove(id);
  }
}
