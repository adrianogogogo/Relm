-- AlterTable: tokens de recuperacao de senha para usuarios do sistema (User)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_password_token" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_password_expires" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "users_reset_password_token_idx" ON "users"("reset_password_token");
