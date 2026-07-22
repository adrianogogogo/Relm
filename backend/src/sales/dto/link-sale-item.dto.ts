import { IsUUID } from 'class-validator';

export class LinkSaleItemDto {
  // Produto do catálogo ao qual a descrição livre será vinculada.
  @IsUUID()
  productId: string;
}
