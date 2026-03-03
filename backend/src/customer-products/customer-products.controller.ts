import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerProductsService } from './customer-products.service';
import { CreateCustomerProductDto } from './dto/create-customer-product.dto';
import { UpdateCustomerProductDto } from './dto/update-customer-product.dto';
import { ApproveProductDto } from './dto/approve-product.dto';
import { RejectProductDto } from './dto/reject-product.dto';
import { TransferProductDto } from './dto/transfer-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('customer-products', 'admin')
@ApiBearerAuth()
@Controller('api/admin/customer-products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM')
export class CustomerProductsController {
  constructor(private readonly service: CustomerProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar produto (admin pode fazer por cliente)' })
  create(@Body() createDto: CreateCustomerProductDto) {
    return this.service.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar produtos registrados' })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'verificationStatus', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED', 'AUTO_APPROVED'] })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'STOLEN', 'SOLD', 'INACTIVE', 'TRANSFERRED'] })
  @ApiQuery({ name: 'category', required: false, enum: ['ALL', 'BICYCLE', 'ACCESSORY'] })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query('customerId') customerId?: string,
    @Query('verificationStatus') verificationStatus?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll({
      customerId,
      verificationStatus,
      status,
      category,
      search,
    });
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Estatísticas de produtos registrados' })
  getStatistics() {
    return this.service.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar produto por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Ver histórico de mudanças do produto' })
  getHistory(@Param('id') id: string) {
    return this.service.getHistory(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar produto' })
  update(@Param('id') id: string, @Body() updateDto: UpdateCustomerProductDto) {
    return this.service.update(id, updateDto);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Aprovar produto registrado' })
  approve(
    @Param('id') id: string,
    @Body() approveDto: ApproveProductDto,
    @Request() req,
  ) {
    const userId = req.user.sub; // ID do admin
    return this.service.approve(id, approveDto, userId);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Rejeitar produto registrado' })
  reject(
    @Param('id') id: string,
    @Body() rejectDto: RejectProductDto,
    @Request() req,
  ) {
    const userId = req.user.sub;
    return this.service.reject(id, rejectDto, userId);
  }
}

// ============================================
// CONTROLLER PÚBLICO/CLIENTE
// ============================================

@ApiTags('customer-products', 'public')
@Controller('api/customer-products')
export class PublicCustomerProductsController {
  constructor(private readonly service: CustomerProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Cliente registra seu produto' })
  create(@Body() createDto: CreateCustomerProductDto) {
    return this.service.create(createDto);
  }

  @Get('my-products')
  @ApiOperation({ summary: 'Meus produtos (requer autenticação futura)' })
  @ApiQuery({ name: 'customerId', required: true })
  myProducts(@Query('customerId') customerId: string) {
    return this.service.findAll({ customerId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver detalhes do meu produto' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/activate-warranty')
  @ApiOperation({ summary: 'Ativar garantia padrão do produto' })
  @ApiQuery({ name: 'customerId', required: true })
  activateWarranty(
    @Param('id') id: string,
    @Query('customerId') customerId: string,
  ) {
    return this.service.activateStandardWarranty(id, customerId);
  }

  @Post(':id/transfer')
  @ApiOperation({ summary: 'Transferir produto para outro dono' })
  @ApiQuery({ name: 'customerId', required: true })
  transfer(
    @Param('id') id: string,
    @Query('customerId') customerId: string,
    @Body() transferDto: TransferProductDto,
  ) {
    return this.service.transfer(id, transferDto, customerId);
  }
}
