/**
 * DTO legado — revert-status (FSM) REMOVIDO na Fase 4.
 * O endpoint PATCH /warranty/claims/:id/revert-status foi removido.
 * Reversão de status agora é feita via workflow normal (updateClaimStatus).
 */
export class RevertStatusDto {
  /** Sem uso — mantido apenas para não quebrar imports legados. */
  toStatus?: any;
  reason?: string;
}
