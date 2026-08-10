-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "CampaignSegment" AS ENUM ('ALL_CUSTOMERS', 'PLUS_ONLY', 'EXPIRED_POINTS', 'STORES_ONLY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable LandingPage
CREATE TABLE IF NOT EXISTS "landing_pages" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT,
    "blocks_json" JSONB NOT NULL DEFAULT '[]',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "store_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "landing_pages_slug_key" ON "landing_pages"("slug");
CREATE INDEX IF NOT EXISTS "landing_pages_active_idx" ON "landing_pages"("active");
CREATE INDEX IF NOT EXISTS "landing_pages_store_id_idx" ON "landing_pages"("store_id");

-- CreateTable EmailTemplate
CREATE TABLE IF NOT EXISTS "email_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body_html" TEXT NOT NULL,
    "variables_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable EmailCampaign
CREATE TABLE IF NOT EXISTS "email_campaigns" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "target_segment" "CampaignSegment" NOT NULL DEFAULT 'ALL_CUSTOMERS',
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "scheduled_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "email_templates_slug_key" ON "email_templates"("slug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "email_campaigns_template_id_idx" ON "email_campaigns"("template_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "email_campaigns_status_idx" ON "email_campaigns"("status");

-- AddForeignKey
ALTER TABLE "landing_pages" DROP CONSTRAINT IF EXISTS "landing_pages_store_id_fkey";
ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_campaigns" DROP CONSTRAINT IF EXISTS "email_campaigns_template_id_fkey";
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "email_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
