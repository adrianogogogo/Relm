import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * DTO para o endpoint PÚBLICO de garantia (POST /public/warranty).
 * Contém SOMENTE os campos enviados pelo formulário público (snake_case,
 * conforme o frontend). Campos sensíveis como status, linkStatus, customerId,
 * productId, protocolNumber e validationToken NUNCA são aceitos do body —
 * são definidos pelo servidor.
 */
export class CreateWarrantyPublicDto {
  // ── Produto ──────────────────────────────────────────────
  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  @IsNotEmpty({ message: 'Tipo do produto é obrigatório' })
  @IsString()
  @MaxLength(100)
  product_type: string;

  @IsNotEmpty({ message: 'Modelo é obrigatório' })
  @IsString()
  @MaxLength(150)
  model: string;

  @IsNotEmpty({ message: 'Número de série é obrigatório' })
  @IsString()
  @MaxLength(100)
  serial_number: string;

  @IsOptional()
  @IsString()
  purchase_date?: string;

  @IsNotEmpty({ message: 'Nome da loja de compra é obrigatório' })
  @IsString()
  @MaxLength(200)
  purchase_store_name: string;

  @IsNotEmpty({ message: 'Número da nota fiscal é obrigatório' })
  @IsString()
  @MaxLength(100)
  invoice_number: string;

  // ── Cliente ──────────────────────────────────────────────
  @IsNotEmpty({ message: 'Nome completo é obrigatório' })
  @IsString()
  @MaxLength(150)
  full_name: string;

  @IsNotEmpty({ message: 'Email é obrigatório' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  @IsString()
  @MaxLength(30)
  phone: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  cpf?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  zip_code?: string;

  @IsOptional()
  @IsBoolean()
  marketing_consent?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  customer_notes?: string;
}
