-- Plano 012: modulo de instrutores. Credenciamento com desconto por tier, sem
-- repasse e sem comissao — por isso NAO existe nenhuma coluna de preco aqui.
-- Escrita a mao e idempotente (mesmo padrao das demais): o historico de
-- migrations do banco local esta atras do schema real e `migrate deploy` falha.

-- Role do instrutor. Ele loga pelo /auth/login que ja existe (tabela `users`),
-- sem quarta superficie de autenticacao.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'INSTRUTOR';

-- CreateTable: especialidades (treino de estrada, MTB, triathlon...). Tabela, e
-- nao enum, porque a Relm cadastra novas sem deploy.
CREATE TABLE IF NOT EXISTS "instructor_specialties" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instructor_specialties_pkey" PRIMARY KEY ("id")
);

-- CreateTable: o instrutor/assessoria exibido ao cliente.
-- `benefit` vale para todos os clientes; `benefit_plus` e o desconto adicional
-- do Plus e o Care TAMBEM o ve (e o argumento de venda da assinatura).
-- `phone` e obrigatorio, mas so sai da API depois que o cliente gera a
-- credencial — e o que garante que todo contato passe pelo sistema.
CREATE TABLE IF NOT EXISTS "instructors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "benefit" TEXT NOT NULL,
    "benefit_plus" TEXT,
    "phone" TEXT NOT NULL,
    "link" TEXT,
    "logo_url" TEXT,
    "city" TEXT,
    "state" TEXT,
    "remote" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "terms_accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instructors_pkey" PRIMARY KEY ("id")
);

-- CreateTable: juncao N:N implicita do Prisma. Nomes de tabela/colunas/indices
-- sao os que o client gerado espera — nao renomear.
CREATE TABLE IF NOT EXISTS "_InstructorToInstructorSpecialty" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- AlterTable: vinculo do usuario INSTRUTOR com o seu registro (espelha store_id).
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "instructor_id" TEXT;

-- AlterTable: terceiro alvo possivel do voucher. Diferente dos outros dois, o
-- alvo instrutor e um VINCULO, nao um cupom: nasce UNUSED e nunca vira USED.
ALTER TABLE "vouchers" ADD COLUMN IF NOT EXISTS "instructor_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "instructor_specialties_name_key" ON "instructor_specialties"("name");
CREATE INDEX IF NOT EXISTS "instructors_active_state_idx" ON "instructors"("active", "state");
-- O vinculo ativo e procurado por (instrutor, cliente, status) antes de criar outro.
CREATE INDEX IF NOT EXISTS "vouchers_instructor_id_customer_id_status_idx" ON "vouchers"("instructor_id", "customer_id", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "_InstructorToInstructorSpecialty_AB_unique" ON "_InstructorToInstructorSpecialty"("A", "B");
CREATE INDEX IF NOT EXISTS "_InstructorToInstructorSpecialty_B_index" ON "_InstructorToInstructorSpecialty"("B");

-- AddForeignKey: Postgres nao tem IF NOT EXISTS para constraint, dai os DO blocks.
DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_instructor_id_fkey"
    FOREIGN KEY ("instructor_id") REFERENCES "instructors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_instructor_id_fkey"
    FOREIGN KEY ("instructor_id") REFERENCES "instructors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "_InstructorToInstructorSpecialty" ADD CONSTRAINT "_InstructorToInstructorSpecialty_A_fkey"
    FOREIGN KEY ("A") REFERENCES "instructors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "_InstructorToInstructorSpecialty" ADD CONSTRAINT "_InstructorToInstructorSpecialty_B_fkey"
    FOREIGN KEY ("B") REFERENCES "instructor_specialties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
