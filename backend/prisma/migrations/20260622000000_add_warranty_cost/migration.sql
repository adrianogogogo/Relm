-- Adiciona o campo de custo da garantia (valor para a empresa).
-- Informado por ADMIN_RELM/GERENTE_RELM via PATCH /warranty/claims/:id/cost.
ALTER TABLE "warranty_claims" ADD COLUMN "cost" DECIMAL(10,2);
