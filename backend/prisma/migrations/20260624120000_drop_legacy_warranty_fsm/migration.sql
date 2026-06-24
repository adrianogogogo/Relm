-- Limpeza da Fase 4: remove o sistema antigo (FSM/enum, eventos, templates),
-- já inerte no código e ausente do schema. Reconcilia a deriva schema↔banco.
-- Idempotente (IF EXISTS). Sem impacto no novo workflow (status_id/history/solutions).

ALTER TABLE "warranty_claims" DROP COLUMN IF EXISTS "status";
DROP TABLE IF EXISTS "warranty_events";
DROP TABLE IF EXISTS "warranty_task_templates";
DROP TYPE IF EXISTS "WarrantyStatus";
