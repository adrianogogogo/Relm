-- Onda 2: tarefas operacionais de uma garantia.
-- Status livre em pt-BR (pendente | concluida | cancelada); assignee texto livre.
CREATE TABLE "warranty_tasks" (
    "id" TEXT NOT NULL,
    "claim_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "assignee" TEXT,
    "due_date" TIMESTAMP(3),
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warranty_tasks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "warranty_tasks_claim_id_idx" ON "warranty_tasks"("claim_id");

ALTER TABLE "warranty_tasks" ADD CONSTRAINT "warranty_tasks_claim_id_fkey"
    FOREIGN KEY ("claim_id") REFERENCES "warranty_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;
