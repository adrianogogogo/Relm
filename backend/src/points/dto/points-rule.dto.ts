import {
  IsBoolean, IsEnum, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min,
} from 'class-validator';
import { PointsRuleMode } from '@prisma/client';

export class CreatePointsRuleDto {
  // Exatamente um dos dois — a exclusividade é validada no service, porque
  // class-validator não expressa XOR sem validador customizado.
  @IsOptional()
  @IsUUID()
  productId?: string;

  // Categoria livre (Product.productType é String, não enum): "Road", "MTB",
  // "Acessórios"… Precisa bater exatamente com o que está no produto.
  @IsOptional()
  @IsString()
  @MaxLength(60)
  productType?: string;

  @IsEnum(PointsRuleMode)
  mode: PointsRuleMode;

  // FIXO: pontos por unidade. POR_REAL: pontos por real do subtotal.
  @IsNumber()
  @Min(0)
  value: number;
}

export class UpdatePointsRuleDto {
  @IsOptional()
  @IsEnum(PointsRuleMode)
  mode?: PointsRuleMode;

  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  // Desligar a regra sem apagar: o item volta a pontuar pelo multiplicador.
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
