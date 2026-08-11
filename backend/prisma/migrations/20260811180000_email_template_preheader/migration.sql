-- Preheader: o segundo texto que a caixa de entrada mostra ao lado do assunto.
-- Nullable e sem default: template criado antes desta coluna nao tem preheader,
-- e string vazia herdada seria pior que ausencia — o cliente de e-mail preenche
-- o espaco com o inicio do corpo quando o campo nao existe.
ALTER TABLE "email_templates" ADD COLUMN "preheader" TEXT;
