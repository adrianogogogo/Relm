-- Wave 9: fluxo de aprovação de cotação de seguro (state machine leve)
-- Coluna quoted_at registra quando a Relm enviou a cotação (COTADA), usada pelo
-- cron de expiração de 7 dias. Idempotente.
ALTER TABLE "insurance_quotes" ADD COLUMN IF NOT EXISTS "quoted_at" TIMESTAMP(3);
