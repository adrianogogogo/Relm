import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/**
 * DTO para o endpoint ADMINISTRATIVO de garantia (POST /warranty/claims).
 *
 * Diferente do DTO público, aqui o cliente JÁ EXISTE e é vinculado por
 * `customerId` (não há upsert por email). O cadastro é confiável (feito pela
 * equipe Relm), então o linkStatus será definido como CONFIRMED no service.
 * Campos sensíveis (status, linkStatus, protocolNumber, validationToken) NUNCA
 * são aceitos do body — são definidos pelo servidor.
 */
export class CreateWarrantyAdminDto {
  // ── Cliente (existente) ──────────────────────────────────
  @IsNotEmpty({ message: 'Cliente é obrigatório' })
  @IsUUID('all', { message: 'customerId inválido' })
  customerId: string;

  // ── Produto ──────────────────────────────────────────────
  @IsNotEmpty({ message: 'Número de série é obrigatório' })
  @IsString()
  @MaxLength(100)
  serialNumber: string;

  @IsNotEmpty({ message: 'Modelo é obrigatório' })
  @IsString()
  @MaxLength(150)
  model: string;

  @IsNotEmpty({ message: 'Tipo do produto é obrigatório' })
  @IsString()
  @MaxLength(100)
  productType: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  @IsOptional()
  @IsString()
  purchaseDate?: string;

  // ── Nota fiscal / loja de compra ─────────────────────────
  @IsNotEmpty({ message: 'Número da nota fiscal é obrigatório' })
  @IsString()
  @MaxLength(100)
  invoiceNumber: string;

  @IsNotEmpty({ message: 'Nome da loja de compra é obrigatório' })
  @IsString()
  @MaxLength(200)
  purchaseStoreName: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  purchaseStoreCity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  purchaseStoreState?: string;

  // ── Loja vinculada (opcional) ────────────────────────────
  @IsOptional()
  @IsUUID('all', { message: 'storeId inválido' })
  storeId?: string;

  // ── Observações ──────────────────────────────────────────
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  customerNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminNotes?: string;
}
