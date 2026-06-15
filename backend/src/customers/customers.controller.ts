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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA')
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @Get()
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA', 'DISTRIBUIDOR')
  findAll(
    @Request() req: any,
    @Query('search') search?: string,
    @Query('storeId') storeId?: string,
    @Query('active') active?: string,
  ) {
    return this.customersService.findAll({
      search,
      storeId,
      active: active === 'true' ? true : active === 'false' ? false : undefined,
      requesterUserId: req.user?.userId,
      requesterRole: req.user?.role,
    });
  }

  @Get(':id')
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA', 'DISTRIBUIDOR')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.customersService.findOne(id, {
      requesterUserId: req.user?.userId,
      requesterRole: req.user?.role,
    });
  }

  @Patch(':id')
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA')
  update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  @Roles('ADMIN_RELM')
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}
