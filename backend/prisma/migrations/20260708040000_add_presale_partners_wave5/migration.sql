-- Wave 5: Pré-venda exclusiva por tier + módulo de Parceiros

-- 1. Campos de pré-venda em catalog_items
ALTER TABLE "catalog_items"
  ADD COLUMN IF NOT EXISTS "presale_until" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "presale_tier"  TEXT;

-- 2. Enum PartnerCategory
DO $$ BEGIN
  CREATE TYPE "PartnerCategory" AS ENUM ('CAFE', 'HOTEL', 'PROVA', 'OUTRO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Tabela partners
CREATE TABLE IF NOT EXISTS "partners" (
  "id"          TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "category"    "PartnerCategory" NOT NULL,
  "description" TEXT,
  "benefit"     TEXT NOT NULL,
  "min_tier"    "TierLevel" NOT NULL DEFAULT 'CARE',
  "logo_url"    TEXT,
  "link"        TEXT,
  "city"        TEXT,
  "active"      BOOLEAN NOT NULL DEFAULT true,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "partners_active_min_tier_idx" ON "partners"("active", "min_tier");
