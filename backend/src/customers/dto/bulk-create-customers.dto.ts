import { IsArray, ValidateNested, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCustomerDto } from './create-customer.dto';

export class BulkCreateCustomersDto {
  @IsArray()
  @ArrayMaxSize(2000) // ponytail: teto sanidade; subir se importações maiores
  @ValidateNested({ each: true })
  @Type(() => CreateCustomerDto)
  customers: CreateCustomerDto[];
}
