import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { WarrantyStatus } from '@prisma/client';

const WARRANTY_STATUS_VALUES = Object.values(WarrantyStatus);

/**
 * DTO para reverter (override administrativo) o status de uma garantia
 * (PATCH /warranty/claims/:id/revert-status).
 *
 * Diferente da FSM normal (forward-only), este caminho permite mover o status
 * para QUALQUER valor válido do enum. É restrito a ADMIN_RELM/GERENTE_RELM e
 * exige justificativa, registrada no histórico (warrantyEvent).
 */
export class RevertStatusDto {
  @IsIn(WARRANTY_STATUS_VALUES, {
    message: `toStatus deve ser um dos: ${WARRANTY_STATUS_VALUES.join(', ')}`,
  })
  toStatus: WarrantyStatus;

  @IsString()
  @IsNotEmpty({ message: 'Justificativa é obrigatória' })
  @MaxLength(2000, { message: 'Justificativa muito longa (máx. 2000)' })
  reason: string;
}
