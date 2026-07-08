import { IsIn, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsUUID()
  customerId: string;

  // Valor da anuidade. Opcional: se omitido, usa o valor de ClubSettings
  // (plus_annual_fee).
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  // MANUAL_LOJA e MANUAL_RELM apenas (GATEWAY reservado para o futuro).
  @IsOptional()
  @IsIn(['MANUAL_LOJA', 'MANUAL_RELM'])
  method?: 'MANUAL_LOJA' | 'MANUAL_RELM';

  @IsOptional()
  @IsString()
  notes?: string;
}
