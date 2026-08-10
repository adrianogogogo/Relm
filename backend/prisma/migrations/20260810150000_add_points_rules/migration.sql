-- CreateEnum
CREATE TYPE "PointsRuleMode" AS ENUM ('FIXO', 'POR_REAL');

-- CreateTable
CREATE TABLE "points_rules" (
    "id" TEXT NOT NULL,
    "product_id" TEXT,
    "product_type" TEXT,
    "mode" "PointsRuleMode" NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "points_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "points_rules_product_id_key" ON "points_rules"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "points_rules_product_type_key" ON "points_rules"("product_type");

-- AddForeignKey
ALTER TABLE "points_rules" ADD CONSTRAINT "points_rules_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

