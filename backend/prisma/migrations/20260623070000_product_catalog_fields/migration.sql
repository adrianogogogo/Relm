-- Catálogo de produtos por modelo: novos campos e relaxamento das colunas
-- que só fazem sentido para a UNIDADE (série) — coletada na garantia.
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "sku" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "year" INTEGER;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "description" TEXT;

ALTER TABLE "products" ALTER COLUMN "serial_number" DROP NOT NULL;
ALTER TABLE "products" ALTER COLUMN "product_type" DROP NOT NULL;
ALTER TABLE "products" ALTER COLUMN "model" DROP NOT NULL;
