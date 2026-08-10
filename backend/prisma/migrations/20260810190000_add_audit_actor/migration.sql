-- AlterTable: ator polimórfico (USER | STORE_USER | CUSTOMER | ANONIMO).
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "actor_type" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "actor_id" TEXT;

-- Backfill: todo log existente foi gravado à mão pelos 7 módulos, sempre com
-- ator da equipe Relm (users.id). Sem isso os logs antigos ficariam com ator
-- nulo e sumiriam de qualquer filtro por actorType.
UPDATE "audit_logs"
   SET "actor_type" = 'USER', "actor_id" = "user_id"
 WHERE "user_id" IS NOT NULL
   AND "actor_type" IS NULL;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "audit_logs_actor_type_actor_id_created_at_idx"
    ON "audit_logs"("actor_type", "actor_id", "created_at");
