import { PartialType } from '@nestjs/swagger';
import { CreateCustomerProductDto } from './create-customer-product.dto';

export class UpdateCustomerProductDto extends PartialType(CreateCustomerProductDto) {}
