-- Onda 3: anexos de uma garantia. Arquivo no disco do servidor (storage_path);
-- metadados no banco. Upgrade path: S3/object storage.
CREATE TABLE "warranty_attachments" (
    "id" TEXT NOT NULL,
    "claim_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storage_path" TEXT NOT NULL,
    "uploaded_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warranty_attachments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "warranty_attachments_claim_id_idx" ON "warranty_attachments"("claim_id");

ALTER TABLE "warranty_attachments" ADD CONSTRAINT "warranty_attachments_claim_id_fkey"
    FOREIGN KEY ("claim_id") REFERENCES "warranty_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;
