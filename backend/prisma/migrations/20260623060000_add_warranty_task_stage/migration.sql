-- Vincula a tarefa a etapa do fluxo que a originou (WarrantyStatus em texto).
-- Usado para listar as "tarefas desta etapa" no card de Fluxo/Proximos Passos.
ALTER TABLE "warranty_tasks" ADD COLUMN IF NOT EXISTS "stage" TEXT;
