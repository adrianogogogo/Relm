import {
  IsArray, IsDateString, IsInt, IsNumber, IsOptional, IsString,
  IsUUID, MaxLength, Min, ArrayMinSize, ArrayMaxSize, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSaleItemDto {
  // Nome comercial livre — é o que o lojista digita no PDV.
  @IsString()
  @MaxLength(200)
  commercialName: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  serialNumber?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  // 60 / 90 / 180 / 360 são os prazos usuais, mas o campo é livre em dias.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  warrantyDays?: number;
}

export class CreateSaleDto {
  @IsUUID()
  customerId: string;

  @IsOptional()
  @IsUUID()
  storeId?: string;

  @IsDateString()
  saleDate: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  invoiceNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50) // ponytail: teto sanidade; subir se vendas maiores aparecerem
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];
}
