import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AdminUsersService } from './admin-users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('admin-users')
@Controller('admin-users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN_RELM')
@ApiBearerAuth()
export class AdminUsersController {
  constructor(private adminUsersService: AdminUsersService) {}

  @Get()
  findAll() {
    return this.adminUsersService.findAll();
  }

  @Get('stores')
  findAllStores() {
    return this.adminUsersService.findAllStores();
  }

  @Get('distributors')
  findAllDistributors() {
    return this.adminUsersService.findAllDistributors();
  }

  @Post()
  create(@Body() body: {
    name: string;
    email: string;
    password: string;
    role: string;
    storeId?: string;
    distributorId?: string;
  }) {
    return this.adminUsersService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: {
    name?: string;
    email?: string;
    role?: string;
    storeId?: string | null;
    distributorId?: string | null;
    active?: boolean;
  }) {
    return this.adminUsersService.update(id, body);
  }

  @Patch(':id/reset-password')
  resetPassword(@Param('id') id: string, @Body() body: { password: string }) {
    return this.adminUsersService.resetPassword(id, body.password);
  }

  @Patch(':id/toggle-active')
  toggleActive(@Param('id') id: string) {
    return this.adminUsersService.toggleActive(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminUsersService.remove(id);
  }
}
