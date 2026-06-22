import { IsNumber, IsOptional, Min, ValidateIf } from 'class-validator';

/**
 * DTO para definir/limpar o custo da garantia (PATCH /warranty/claims/:id/cost).
 *
 * `cost` aceita:
 *  - um número >= 0 (custo da garantia para a empresa);
 *  - `null` para limpar o custo previamente informado.
 *
 * Apenas ADMIN_RELM/GERENTE_RELM podem usar este endpoint (RolesGuard).
 */
export class SetCostDto {
  @ValidateIf((_, value) => value !== null)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'cost deve ser um número com até 2 casas decimais ou null' },
  )
  @Min(0, { message: 'cost não pode ser negativo' })
  @IsOptional()
  cost: number | null;
}
