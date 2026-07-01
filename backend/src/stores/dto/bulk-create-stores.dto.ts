import { IsArray, ValidateNested, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateStoreDto } from './create-store.dto';

export class BulkCreateStoresDto {
  @IsArray()
  @ArrayMaxSize(2000) // ponytail: teto sanidade; subir se importações maiores
  @ValidateNested({ each: true })
  @Type(() => CreateStoreDto)
  stores: CreateStoreDto[];
}
