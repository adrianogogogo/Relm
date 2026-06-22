-- AlterTable
ALTER TABLE "banners" ADD COLUMN     "audience" TEXT NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN     "page" TEXT;

-- CreateIndex
CREATE INDEX "banners_audience_page_active_idx" ON "banners"("audience", "page", "active");
