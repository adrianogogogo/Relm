-- AlterTable: segmentação de eventos por perfil (espelha benefits.target_roles)
ALTER TABLE "events" ADD COLUMN "target_roles" TEXT[] NOT NULL DEFAULT '{}';
