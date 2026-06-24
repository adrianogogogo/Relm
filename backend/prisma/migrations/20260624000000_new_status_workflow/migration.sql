-- Fase 1: novo workflow de status & soluções (RelmDesk-style), ADITIVO.
-- Coexiste com o enum WarrantyStatus até a fase de remoção.

-- 1) Tabela de status configuráveis
CREATE TABLE "warranty_statuses" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#666666',
    "sort_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    CONSTRAINT "warranty_statuses_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "warranty_statuses_slug_key" ON "warranty_statuses"("slug");

-- Seed com IDs fixos 1..10 (referenciados no _finalizeApproval).
INSERT INTO "warranty_statuses" ("id","name","slug","color","sort_order","description") VALUES
  (1,'Novo','novo','#2196F3',1,'Ticket recém criado'),
  (2,'Em Triagem','em-triagem','#FF9800',2,'Ticket em análise inicial'),
  (3,'Aguardando Informações','aguardando-informacoes','#FFC107',3,'Aguardando dados do cliente/loja'),
  (4,'Em Análise','em-analise','#9C27B0',4,'Equipe técnica analisando'),
  (5,'Solução Proposta','solucao-proposta','#00BCD4',5,'Solução identificada, aguardando aprovação'),
  (6,'Em Execução','em-execucao','#FF5722',6,'Solução sendo executada'),
  (7,'Logística/Envio','logistica-envio','#795548',7,'Produto em logística/transporte'),
  (8,'Aguardando Confirmação','aguardando-confirmacao','#607D8B',8,'Aguardando confirmação do cliente'),
  (9,'Resolvido','resolvido','#4CAF50',9,'Ticket resolvido'),
  (10,'Fechado/Arquivado','fechado','#9E9E9E',10,'Ticket encerrado');

-- Ressincroniza a sequence (inserimos IDs explícitos).
SELECT setval('warranty_statuses_id_seq', 10, true);

-- 2) Coluna status_id no claim + FK + índice
ALTER TABLE "warranty_claims" ADD COLUMN "status_id" INTEGER;
ALTER TABLE "warranty_claims" ADD CONSTRAINT "warranty_claims_status_id_fkey"
    FOREIGN KEY ("status_id") REFERENCES "warranty_statuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "warranty_claims_status_id_idx" ON "warranty_claims"("status_id");

-- 3) Backfill: mapeia o enum antigo -> novo status
UPDATE "warranty_claims" SET "status_id" = CASE "status"
  WHEN 'RECEBIDO'           THEN 1   -- Novo
  WHEN 'EM_ANALISE'         THEN 4   -- Em Análise
  WHEN 'AGUARDANDO_CLIENTE' THEN 3   -- Aguardando Informações
  WHEN 'APROVADO'           THEN 6   -- Em Execução
  WHEN 'REPROVADO'          THEN 10  -- Fechado
  WHEN 'FINALIZADO'         THEN 10  -- Fechado
  WHEN 'CANCELADO'          THEN 10  -- Fechado
  ELSE 1
END;

-- 4) Timeline imutável
CREATE TABLE "warranty_history" (
    "id" TEXT NOT NULL,
    "claim_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action_type" TEXT NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "note" TEXT,
    "is_internal" BOOLEAN NOT NULL DEFAULT true,
    "ball_from_id" TEXT,
    "ball_to_id" TEXT,
    "status_from_id" INTEGER,
    "status_to_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "warranty_history_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "warranty_history_claim_id_idx" ON "warranty_history"("claim_id");
CREATE INDEX "warranty_history_created_at_idx" ON "warranty_history"("created_at");
ALTER TABLE "warranty_history" ADD CONSTRAINT "warranty_history_claim_id_fkey"
    FOREIGN KEY ("claim_id") REFERENCES "warranty_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5) Soluções (autorização em 2 níveis)
CREATE TABLE "warranty_solutions" (
    "id" TEXT NOT NULL,
    "claim_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "solution_type" TEXT NOT NULL DEFAULT 'outro',
    "has_cost" BOOLEAN NOT NULL DEFAULT false,
    "cost_value" DECIMAL(10,2),
    "cost_notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "proposed_by" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "requires_director" BOOLEAN NOT NULL DEFAULT false,
    "authorization_level" TEXT NOT NULL DEFAULT 'gestor',
    "director_approved_by" TEXT,
    "director_approved_at" TIMESTAMP(3),
    "director_rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "warranty_solutions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "warranty_solutions_claim_id_idx" ON "warranty_solutions"("claim_id");
CREATE INDEX "warranty_solutions_authorization_level_status_idx" ON "warranty_solutions"("authorization_level","status");
ALTER TABLE "warranty_solutions" ADD CONSTRAINT "warranty_solutions_claim_id_fkey"
    FOREIGN KEY ("claim_id") REFERENCES "warranty_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;
