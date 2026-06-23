-- Coluna de perfil responsavel na tarefa (filtravel) + seed dos templates de fluxo.

-- 1) Coluna assignee_role (perfil alvo da tarefa, separado do texto livre assignee).
ALTER TABLE "warranty_tasks" ADD COLUMN IF NOT EXISTS "assignee_role" TEXT;

-- 2) Seed dos templates de geracao automatica por transicao de status.
--    Mapeia cada status-destino -> tarefa(s) -> perfil responsavel.
INSERT INTO "warranty_task_templates"
  ("id", "to_status", "title", "description", "target_role", "sort_order", "active", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'EM_ANALISE'::"WarrantyStatus",         'Analisar garantia',               NULL, 'SUPORTE_RELM'::"UserRole", 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'AGUARDANDO_CLIENTE'::"WarrantyStatus", 'Responder solicitação da Relm',   NULL, 'CLIENTE'::"UserRole",      0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'APROVADO'::"WarrantyStatus",           'Autorizar solução (custo/troca)', NULL, 'GERENTE_RELM'::"UserRole", 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'APROVADO'::"WarrantyStatus",           'Executar reparo/troca',           NULL, 'LOJA'::"UserRole",         1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'REPROVADO'::"WarrantyStatus",          'Comunicar reprovação ao cliente', NULL, 'SUPORTE_RELM'::"UserRole", 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'FINALIZADO'::"WarrantyStatus",         'Confirmar resolução/entrega',     NULL, 'SUPORTE_RELM'::"UserRole", 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
