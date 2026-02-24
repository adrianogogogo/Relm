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
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BenefitsService } from './benefits.service';
import { CreateBenefitDto } from './dto/create-benefit.dto';
import { UpdateBenefitDto } from './dto/update-benefit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('admin-benefits')
@ApiBearerAuth()
@Controller('admin/benefits')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM')
export class AdminBenefitsController {
  constructor(private readonly service: BenefitsService) {}

  @Post()
  create(@Body() createDto: CreateBenefitDto) {
    return this.service.create(createDto);
  }

  @Get()
  findAll(
    @Query('active') active?: string,
    @Query('targetRole') targetRole?: string,
  ) {
    const filters: any = {};
    if (active !== undefined) filters.active = active === 'true';
    if (targetRole) filters.targetRole = targetRole;
    return this.service.findAll(filters);
  }

  @Get('statistics')
  getStatistics() {
    return this.service.getStatistics();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateBenefitDto) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
