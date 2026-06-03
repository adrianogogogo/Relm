-- AlterTable
ALTER TABLE "benefits" DROP COLUMN "target_role",
ADD COLUMN     "target_roles" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "reset_password_expires" TIMESTAMP(3),
ADD COLUMN     "reset_password_token" TEXT;

-- AlterTable
ALTER TABLE "store_users" ADD COLUMN     "reset_password_expires" TIMESTAMP(3),
ADD COLUMN     "reset_password_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "customers_reset_password_token_key" ON "customers"("reset_password_token");

-- CreateIndex
CREATE UNIQUE INDEX "store_users_reset_password_token_key" ON "store_users"("reset_password_token");

