-- AlterTable: add auto_generated column to warranty_tasks
ALTER TABLE "warranty_tasks" ADD COLUMN "auto_generated" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: warranty_task_templates
CREATE TABLE "warranty_task_templates" (
    "id" TEXT NOT NULL,
    "to_status" "WarrantyStatus" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "target_role" "UserRole" NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warranty_task_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "warranty_task_templates_to_status_idx" ON "warranty_task_templates"("to_status");
