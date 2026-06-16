import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * DTO para o endpoint PÚBLICO de cotação de seguro.
 * Contém SOMENTE os campos que o formulário público pode enviar.
 * Campos sensíveis (status, quoteValue, protocolNumber, customerId, productId,
 * insuranceCompany) são definidos pelo servidor e NUNCA aceitos do body.
 */
export class CreateInsurancePublicDto {
  @IsNotEmpty({ message: 'Nome completo é obrigatório' })
  @IsString()
  @MaxLength(150, { message: 'Nome completo deve ter no máximo 150 caracteres' })
  fullName: string;

  @IsNotEmpty({ message: 'Email é obrigatório' })
  @IsEmail({}, { message: 'Email inválido' })
  @MaxLength(255, { message: 'Email deve ter no máximo 255 caracteres' })
  email: string;

  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  @IsString()
  @MaxLength(30, { message: 'Telefone deve ter no máximo 30 caracteres' })
  phone: string;

  @IsOptional()
  @IsNumber({}, { message: 'Valor da bike inválido' })
  @Min(0)
  bikeValue?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Cidade deve ter no máximo 100 caracteres' })
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Estado deve ter no máximo 50 caracteres' })
  state?: string;
}
