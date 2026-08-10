-- DropForeignKey
ALTER TABLE "vouchers" DROP CONSTRAINT "vouchers_catalog_item_id_fkey";

-- AlterTable
ALTER TABLE "store_services" ADD COLUMN     "points_cost" INTEGER;

-- AlterTable
ALTER TABLE "vouchers" ADD COLUMN     "brl_value" DECIMAL(10,2),
ADD COLUMN     "points_spent" INTEGER,
ADD COLUMN     "store_service_id" TEXT,
ALTER COLUMN "catalog_item_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "vouchers_store_service_id_idx" ON "vouchers"("store_service_id");

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_catalog_item_id_fkey" FOREIGN KEY ("catalog_item_id") REFERENCES "catalog_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_store_service_id_fkey" FOREIGN KEY ("store_service_id") REFERENCES "store_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

