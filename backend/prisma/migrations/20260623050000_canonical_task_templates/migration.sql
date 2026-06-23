-- Torna o conjunto DETALHADO de templates o canonico.
-- 1) Remove os 6 templates genericos semeados em 040000 (decisao: conjunto rico oficial).
-- 2) Garante (idempotente) o conjunto detalhado, para reproduzir em staging/novos bancos.

DELETE FROM "warranty_task_templates" WHERE
  (to_status = 'EM_ANALISE'::"WarrantyStatus"         AND target_role = 'SUPORTE_RELM'::"UserRole" AND title = 'Analisar garantia') OR
  (to_status = 'AGUARDANDO_CLIENTE'::"WarrantyStatus" AND target_role = 'CLIENTE'::"UserRole"      AND title = 'Responder solicitação da Relm') OR
  (to_status = 'APROVADO'::"WarrantyStatus"           AND target_role = 'LOJA'::"UserRole"         AND title = 'Executar reparo/troca') OR
  (to_status = 'APROVADO'::"WarrantyStatus"           AND target_role = 'GERENTE_RELM'::"UserRole" AND title = 'Autorizar solução (custo/troca)') OR
  (to_status = 'REPROVADO'::"WarrantyStatus"          AND target_role = 'SUPORTE_RELM'::"UserRole" AND title = 'Comunicar reprovação ao cliente') OR
  (to_status = 'FINALIZADO'::"WarrantyStatus"         AND target_role = 'SUPORTE_RELM'::"UserRole" AND title = 'Confirmar resolução/entrega');

INSERT INTO "warranty_task_templates" (id, to_status, title, description, target_role, sort_order, active, created_at, updated_at)
SELECT v.id, v.to_status, v.title, v.description, v.target_role, v.sort_order, v.active, v.created_at, v.updated_at
FROM (VALUES
  (gen_random_uuid(), 'EM_ANALISE'::"WarrantyStatus",         'Verificar nota fiscal e dados do produto',   NULL::text, 'SUPORTE_RELM'::"UserRole", 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'EM_ANALISE'::"WarrantyStatus",         'Analisar defeito relatado e fotos',          NULL::text, 'GERENTE_RELM'::"UserRole", 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'EM_ANALISE'::"WarrantyStatus",         'Definir custo estimado da garantia',         NULL::text, 'GERENTE_RELM'::"UserRole", 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'AGUARDANDO_CLIENTE'::"WarrantyStatus", 'Acompanhar resposta do cliente',             NULL::text, 'SUPORTE_RELM'::"UserRole", 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'APROVADO'::"WarrantyStatus",           'Solicitar peça ao fornecedor',               NULL::text, 'GERENTE_RELM'::"UserRole", 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'APROVADO'::"WarrantyStatus",           'Organizar envio da peça ao cliente',         NULL::text, 'SUPORTE_RELM'::"UserRole", 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'APROVADO'::"WarrantyStatus",           'Registrar código de rastreio',               NULL::text, 'SUPORTE_RELM'::"UserRole", 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'REPROVADO'::"WarrantyStatus",          'Enviar comunicado de rejeição ao cliente',   NULL::text, 'SUPORTE_RELM'::"UserRole", 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'FINALIZADO'::"WarrantyStatus",         'Confirmar recebimento com o cliente',        NULL::text, 'SUPORTE_RELM'::"UserRole", 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'FINALIZADO'::"WarrantyStatus",         'Atualizar relatório financeiro',             NULL::text, 'ADMIN_RELM'::"UserRole",   1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
) AS v(id, to_status, title, description, target_role, sort_order, active, created_at, updated_at)
WHERE NOT EXISTS (
  SELECT 1 FROM "warranty_task_templates" t
  WHERE t.to_status = v.to_status AND t.title = v.title AND t.target_role = v.target_role
);
