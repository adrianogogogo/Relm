import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { BulkCreateProductsDto } from './dto/bulk-create-products.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('products')
@Controller('products')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Post('bulk')
  @UseGuards(RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  bulkCreate(@Body() dto: BulkCreateProductsDto) {
    return this.productsService.createMany(dto.products);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
