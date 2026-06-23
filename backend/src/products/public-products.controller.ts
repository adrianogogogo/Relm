import { Controller, Get } from '@nestjs/common';
import { ProductsService } from './products.service';

// Catálogo público para o formulário de garantia (cliente não autenticado).
@Controller('public/products')
export class PublicProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findPublicProducts() {
    return this.productsService.findAllPublic();
  }
}
