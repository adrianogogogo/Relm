-- Wave 3: Motor de Engajamento (referral + aniversário + presença em eventos)

-- Enum ReferralStatus
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'COMPLETED');

-- Campos de referral no Customer
ALTER TABLE "customers"
  ADD COLUMN IF NOT EXISTS "referral_code" TEXT,
  ADD COLUMN IF NOT EXISTS "referred_by_id" TEXT;

-- Unique no código de indicação
CREATE UNIQUE INDEX IF NOT EXISTS "customers_referral_code_key"
  ON "customers"("referral_code");

-- FK auto-referência: referred_by_id -> customers.id
ALTER TABLE "customers"
  ADD CONSTRAINT "customers_referred_by_id_fkey"
  FOREIGN KEY ("referred_by_id") REFERENCES "customers"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Tabela Referral
CREATE TABLE IF NOT EXISTS "referrals" (
  "id"             TEXT NOT NULL,
  "referrer_id"    TEXT NOT NULL,
  "referred_id"    TEXT NOT NULL,
  "status"         "ReferralStatus" NOT NULL DEFAULT 'PENDING',
  "points_awarded" INTEGER,
  "completed_at"   TIMESTAMP(3),
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- referred_id é único: um cliente só pode ser indicado uma vez
CREATE UNIQUE INDEX IF NOT EXISTS "referrals_referred_id_key"
  ON "referrals"("referred_id");

CREATE INDEX IF NOT EXISTS "referrals_referrer_id_idx"
  ON "referrals"("referrer_id");

ALTER TABLE "referrals"
  ADD CONSTRAINT "referrals_referrer_id_fkey"
  FOREIGN KEY ("referrer_id") REFERENCES "customers"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "referrals"
  ADD CONSTRAINT "referrals_referred_id_fkey"
  FOREIGN KEY ("referred_id") REFERENCES "customers"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Campo attended em EventRegistration
ALTER TABLE "event_registrations"
  ADD COLUMN IF NOT EXISTS "attended" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "attended_at" TIMESTAMP(3);

-- Seed das novas chaves de ClubSettings (idempotente via ON CONFLICT)
INSERT INTO "club_settings" ("id", "key", "value", "updated_at")
VALUES
  (gen_random_uuid(), 'referral_bonus_points',      '500', NOW()),
  (gen_random_uuid(), 'birthday_bonus_points',      '200', NOW()),
  (gen_random_uuid(), 'event_participation_points', '100', NOW())
ON CONFLICT ("key") DO NOTHING;
