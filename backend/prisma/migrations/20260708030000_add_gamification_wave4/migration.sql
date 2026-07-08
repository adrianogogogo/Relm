-- Wave 4: Gamificação (conquistas/badges + ranking + LGPD opt-in)

-- ── Tabela Achievement (catálogo de badges) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS "achievements" (
  "id"          TEXT        NOT NULL,
  "code"        TEXT        NOT NULL,
  "name"        TEXT        NOT NULL,
  "description" TEXT        NOT NULL,
  "icon"        TEXT,
  "active"      BOOLEAN     NOT NULL DEFAULT true,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "achievements_code_key"
  ON "achievements"("code");

-- ── Tabela CustomerAchievement (badges conquistados) ─────────────────────────
CREATE TABLE IF NOT EXISTS "customer_achievements" (
  "id"             TEXT         NOT NULL,
  "customer_id"    TEXT         NOT NULL,
  "achievement_id" TEXT         NOT NULL,
  "earned_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "customer_achievements_pkey" PRIMARY KEY ("id")
);

-- Garante idempotência: um cliente não pode ganhar o mesmo badge duas vezes
CREATE UNIQUE INDEX IF NOT EXISTS "customer_achievements_customer_id_achievement_id_key"
  ON "customer_achievements"("customer_id", "achievement_id");

CREATE INDEX IF NOT EXISTS "customer_achievements_customer_id_idx"
  ON "customer_achievements"("customer_id");

ALTER TABLE "customer_achievements"
  ADD CONSTRAINT "customer_achievements_customer_id_fkey"
  FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "customer_achievements"
  ADD CONSTRAINT "customer_achievements_achievement_id_fkey"
  FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Campos LGPD de ranking no Customer ───────────────────────────────────────
ALTER TABLE "customers"
  ADD COLUMN IF NOT EXISTS "leaderboard_opt_in" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "nickname"            TEXT;

-- ── Seed dos badges iniciais (idempotente) ────────────────────────────────────
INSERT INTO "achievements" ("id", "code", "name", "description", "icon", "active", "created_at")
VALUES
  (gen_random_uuid(), 'PRIMEIRA_COMPRA',  'Primeira Compra',       'Realizou o primeiro pedido na Relm',                  '🛒', true, NOW()),
  (gen_random_uuid(), 'DEZ_PEDAIS',       'Dez Pedais',            'Participou de 10 eventos do clube',                   '🚴', true, NOW()),
  (gen_random_uuid(), 'RENOVACAO_PLUS',   'Renovação Plus',        'Renovou a assinatura Plus',                           '⭐', true, NOW()),
  (gen_random_uuid(), 'INDICOU_5',        'Embaixador',            'Completou 5 indicações de novos membros',             '🤝', true, NOW()),
  (gen_random_uuid(), 'PONTOS_10K',       'Clube dos 10K',         'Acumulou 10.000 pontos ao longo do tempo',            '🏆', true, NOW())
ON CONFLICT ("code") DO NOTHING;
