-- CreateEnum
CREATE TYPE "PointsBucket" AS ENUM ('ACUMULAVEL', 'MENSAL');

-- AlterTable
ALTER TABLE "points_ledger" ADD COLUMN     "bucket" "PointsBucket" NOT NULL DEFAULT 'ACUMULAVEL';

