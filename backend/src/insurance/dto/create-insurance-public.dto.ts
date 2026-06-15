import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
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
  fullName: string;

  @IsNotEmpty({ message: 'Email é obrigatório' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  @IsString()
  phone: string;

  @IsOptional()
  @IsNumber({}, { message: 'Valor da bike inválido' })
  @Min(0)
  bikeValue?: number;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;
}
