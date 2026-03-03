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
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ProductCatalogService } from './product-catalog.service';
import { CreateProductCatalogDto } from './dto/create-product-catalog.dto';
import { UpdateProductCatalogDto } from './dto/update-product-catalog.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('product-catalog', 'admin')
@ApiBearerAuth()
@Controller('api/admin/product-catalog')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN_RELM', 'GERENTE_RELM')
export class ProductCatalogController {
  constructor(private readonly service: ProductCatalogService) {}

  @Post()
  @ApiOperation({ summary: 'Criar produto no catálogo' })
  create(@Body() createDto: CreateProductCatalogDto) {
    return this.service.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar produtos do catálogo' })
  @ApiQuery({ name: 'category', required: false, enum: ['BICYCLE', 'ACCESSORY'] })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @Query('category') category?: string,
    @Query('active') active?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll({
      category,
      active: active === 'true' ? true : active === 'false' ? false : undefined,
      search,
    });
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Estatísticas do catálogo' })
  getStatistics() {
    return this.service.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar produto por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar produto' })
  update(@Param('id') id: string, @Body() updateDto: UpdateProductCatalogDto) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar produto (só se não tiver registros)' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
