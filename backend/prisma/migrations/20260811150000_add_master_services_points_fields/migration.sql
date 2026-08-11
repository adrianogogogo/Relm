-- AlterTable
ALTER TABLE "master_services" ADD COLUMN IF NOT EXISTS "default_points_cost" INTEGER,
ADD COLUMN IF NOT EXISTS "default_plus_discount_percent" INTEGER,
ADD COLUMN IF NOT EXISTS "default_plus_price" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "default_plus_rule" "PlusCoverageRule" NOT NULL DEFAULT 'FREE',
ADD COLUMN IF NOT EXISTS "default_price" DECIMAL(10,2);
