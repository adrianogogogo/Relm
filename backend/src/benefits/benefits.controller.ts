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
import { BenefitsService } from './benefits.service';
import { CreateBenefitDto } from './dto/create-benefit.dto';
import { UpdateBenefitDto } from './dto/update-benefit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, BenefitCategory } from '@prisma/client';

@Controller('benefits')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN_RELM, UserRole.GERENTE_RELM, UserRole.SUPORTE_RELM)
export class BenefitsController {
  constructor(private readonly benefitsService: BenefitsService) {}

  @Post()
  create(@Body() createBenefitDto: CreateBenefitDto) {
    return this.benefitsService.create(createBenefitDto);
  }

  @Get()
  findAll(
    @Query('category') category?: BenefitCategory,
    @Query('active') active?: string,
    @Query('featured') featured?: string,
  ) {
    const filters: any = {};
    if (category) filters.category = category;
    if (active !== undefined) filters.active = active === 'true';
    if (featured !== undefined) filters.featured = featured === 'true';

    return this.benefitsService.findAll(filters);
  }

  @Get('statistics')
  getStatistics() {
    return this.benefitsService.getStatistics();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.benefitsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBenefitDto: UpdateBenefitDto) {
    return this.benefitsService.update(id, updateBenefitDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.benefitsService.remove(id);
  }
}
