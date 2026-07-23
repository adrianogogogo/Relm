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
  Request,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { BulkCreateCustomersDto } from './dto/bulk-create-customers.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminResetPasswordDto } from '../common/dto/admin-reset-password.dto';

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA')
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  // Importação em lote via planilha (.csv/.xlsx). Restrito a admin/gerente.
  @Post('bulk')
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  bulkCreate(@Body() dto: BulkCreateCustomersDto) {
    return this.customersService.createMany(dto.customers);
  }

  @Get()
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA')
  findAll(
    @Request() req: any,
    @Query('search') search?: string,
    @Query('storeId') storeId?: string,
    @Query('active') active?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    const userRole = req.user?.role || req.user?.type || req.user?.userType;
    const storeIdFromToken = req.user?.storeId;

    return this.customersService.findAll({
      search,
      storeId: storeId || storeIdFromToken,
      active: active === 'true' ? true : active === 'false' ? false : undefined,
      requesterUserId: userId,
      requesterRole: userRole,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Get(':id')
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA')
  findOne(@Request() req: any, @Param('id') id: string) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    const userRole = req.user?.role || req.user?.type || req.user?.userType;

    return this.customersService.findOne(id, {
      requesterUserId: userId,
      requesterRole: userRole,
    });
  }

  @Patch(':id')
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA')
  update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.customersService.update(id, updateCustomerDto);
  }

  // Admin redefine a senha de qualquer cliente (ADMIN_RELM-only).
  @Patch(':id/reset-password')
  @Roles('ADMIN_RELM')
  resetPassword(@Param('id') id: string, @Body() dto: AdminResetPasswordDto) {
    return this.customersService.setPassword(id, dto.password);
  }

  @Delete(':id')
  @Roles('ADMIN_RELM')
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}
