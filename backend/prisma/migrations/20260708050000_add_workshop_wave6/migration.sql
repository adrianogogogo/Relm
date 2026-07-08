-- Wave 6: Oficina completa — novos tipos de serviço + logística leva-e-traz

-- 1. Novos valores no enum ServiceType (idempotente)
ALTER TYPE "ServiceType" ADD VALUE IF NOT EXISTS 'LAVAGEM_LUBRIFICACAO';
ALTER TYPE "ServiceType" ADD VALUE IF NOT EXISTS 'BUSCA_ENTREGA';
ALTER TYPE "ServiceType" ADD VALUE IF NOT EXISTS 'BIKE_FITTING';

-- 2. Enum LogisticsStatus
DO $$ BEGIN
  CREATE TYPE "LogisticsStatus" AS ENUM (
    'COLETA_AGENDADA',
    'EM_TRANSPORTE_COLETA',
    'NA_OFICINA',
    'EM_TRANSPORTE_ENTREGA',
    'ENTREGUE'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. serviceType ganha DEFAULT para linhas antigas sem valor explícito
ALTER TABLE "service_orders"
  ALTER COLUMN "service_type" SET DEFAULT 'REVISION_BASIC';

-- 4. Campos de logística (nullable — só usados em BUSCA_ENTREGA)
ALTER TABLE "service_orders"
  ADD COLUMN IF NOT EXISTS "pickup_address"   TEXT,
  ADD COLUMN IF NOT EXISTS "logistics_status" "LogisticsStatus";

-- 5. Índice para contagem de cota anual por tipo
CREATE INDEX IF NOT EXISTS "service_orders_customer_id_service_type_created_at_idx"
  ON "service_orders"("customer_id", "service_type", "created_at");
