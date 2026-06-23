-- Onda 4: responsavel atual (FK para users) e data de fechamento automatico.
ALTER TABLE "warranty_claims" ADD COLUMN "assigned_to_user_id" TEXT;
ALTER TABLE "warranty_claims" ADD COLUMN "auto_close_at" TIMESTAMP(3);

CREATE INDEX "warranty_claims_assigned_to_user_id_idx" ON "warranty_claims"("assigned_to_user_id");

ALTER TABLE "warranty_claims" ADD CONSTRAINT "warranty_claims_assigned_to_user_id_fkey"
    FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
