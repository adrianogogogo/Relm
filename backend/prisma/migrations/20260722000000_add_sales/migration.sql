-- Plan 006: registrar vendas (Sale/SaleItem) com vigencia de garantia por serie.
-- Idempotente: pode ser executada mais de uma vez sem falhar.

-- 1. Tabela de vendas
CREATE TABLE IF NOT EXISTS "sales" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "store_id" TEXT,
    "sold_by_user_id" TEXT,
    "sale_date" TIMESTAMP(3) NOT NULL,
    "invoice_number" TEXT,
    "invoice_storage_path" TEXT,
    "invoice_file_name" TEXT,
    "invoice_mime_type" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- 2. Tabela de itens da venda
CREATE TABLE IF NOT EXISTS "sale_items" (
    "id" TEXT NOT NULL,
    "sale_id" TEXT NOT NULL,
    "commercial_name" TEXT NOT NULL,
    "product_id" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "serial_number" TEXT,
    "unit_price" DECIMAL(10,2),
    "warranty_days" INTEGER,
    "warranty_ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- 3. Indices
CREATE INDEX IF NOT EXISTS "sales_customer_id_idx" ON "sales"("customer_id");
CREATE INDEX IF NOT EXISTS "sales_store_id_idx" ON "sales"("store_id");
CREATE INDEX IF NOT EXISTS "sales_sale_date_idx" ON "sales"("sale_date");

CREATE INDEX IF NOT EXISTS "sale_items_sale_id_idx" ON "sale_items"("sale_id");
CREATE INDEX IF NOT EXISTS "sale_items_serial_number_idx" ON "sale_items"("serial_number");
CREATE INDEX IF NOT EXISTS "sale_items_product_id_idx" ON "sale_items"("product_id");
CREATE INDEX IF NOT EXISTS "sale_items_warranty_ends_at_idx" ON "sale_items"("warranty_ends_at");

-- 4. Chaves estrangeiras (envolvidas em DO $$ para idempotencia)
DO $$ BEGIN
  ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_fkey"
    FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_id_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "sales" ADD CONSTRAINT "sales_store_id_fkey"
    FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "sales" ADD CONSTRAINT "sales_sold_by_user_id_fkey"
    FOREIGN KEY ("sold_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
