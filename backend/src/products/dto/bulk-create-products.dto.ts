import { IsArray, ValidateNested, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateProductDto } from './create-product.dto';

export class BulkCreateProductsDto {
  @IsArray()
  @ArrayMaxSize(2000) // ponytail: teto sanidade; subir se importações maiores
  @ValidateNested({ each: true })
  @Type(() => CreateProductDto)
  products: CreateProductDto[];
}
