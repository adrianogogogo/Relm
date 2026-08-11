-- O modulo email-crm deixa de enviar: ele gera, guarda e exporta HTML.
-- O disparo passa a ser feito na ferramenta de e-mail marketing, que ja traz
-- consentimento, descadastro, bounce e supressao.

-- Conteudo em blocos vira a fonte de verdade do template (variables_json nunca
-- chegou a ser usado para outra coisa).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_templates' AND column_name = 'variables_json'
  ) THEN
    ALTER TABLE "email_templates" RENAME COLUMN "variables_json" TO "blocks_json";
  END IF;
END $$;

ALTER TABLE "email_templates" ADD COLUMN IF NOT EXISTS "blocks_json" JSONB;

-- Colunas de envio: sem disparo dentro da plataforma, nenhuma delas seria
-- preenchida. Deixa-las no banco faria alguem, daqui a seis meses, concluir que
-- o envio existe e esta quebrado.
ALTER TABLE "email_campaigns"
  DROP COLUMN IF EXISTS "target_segment",
  DROP COLUMN IF EXISTS "status",
  DROP COLUMN IF EXISTS "sent_count",
  DROP COLUMN IF EXISTS "error_count",
  DROP COLUMN IF EXISTS "scheduled_at",
  DROP COLUMN IF EXISTS "sent_at";

DROP TYPE IF EXISTS "CampaignStatus";
DROP TYPE IF EXISTS "CampaignSegment";
