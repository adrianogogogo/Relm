import { PartialType } from '@nestjs/swagger';
import { CreateProductCatalogDto } from './create-product-catalog.dto';

export class UpdateProductCatalogDto extends PartialType(CreateProductCatalogDto) {}
