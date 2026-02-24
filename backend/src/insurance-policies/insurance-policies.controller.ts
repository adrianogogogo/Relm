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
import { InsurancePoliciesService } from './insurance-policies.service';
import { CreateInsurancePolicyDto } from './dto/create-insurance-policy.dto';
import { UpdateInsurancePolicyDto } from './dto/update-insurance-policy.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, InsurancePolicyStatus } from '@prisma/client';

@Controller('insurance-policies')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN_RELM, UserRole.GERENTE_RELM, UserRole.SUPORTE_RELM)
export class InsurancePoliciesController {
  constructor(private readonly insurancePoliciesService: InsurancePoliciesService) {}

  @Post()
  create(@Body() createInsurancePolicyDto: CreateInsurancePolicyDto) {
    return this.insurancePoliciesService.create(createInsurancePolicyDto);
  }

  @Get()
  findAll(
    @Query('status') status?: InsurancePolicyStatus,
    @Query('customerId') customerId?: string,
  ) {
    return this.insurancePoliciesService.findAll({ status, customerId });
  }

  @Get('statistics')
  getStatistics() {
    return this.insurancePoliciesService.getStatistics();
  }

  @Get('active')
  findActive() {
    return this.insurancePoliciesService.findActive();
  }

  @Get('expiring-soon')
  findExpiringSoon(@Query('days') days?: string) {
    const daysNumber = days ? parseInt(days, 10) : 30;
    return this.insurancePoliciesService.findExpiringSoon(daysNumber);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.insurancePoliciesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateInsurancePolicyDto: UpdateInsurancePolicyDto,
  ) {
    return this.insurancePoliciesService.update(id, updateInsurancePolicyDto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: InsurancePolicyStatus,
  ) {
    return this.insurancePoliciesService.updateStatus(id, status);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.insurancePoliciesService.remove(id);
  }
}
