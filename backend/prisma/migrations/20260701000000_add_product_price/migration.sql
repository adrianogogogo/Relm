-- Preço do produto no catálogo (opcional).
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "price" DECIMAL(10,2);
