# Deploy — Especialista de campanhas

Release dos commits `fcd2486..7297c7b`, já em `origin/main`.
Escrito para ser executado em outra IDE, do zero, sem contexto da conversa.

---

## 1. O que vai subir

| Commit | Mudança |
|---|---|
| `fcd2486` | Redesenho do renderizador público da landing (`/lp/:slug`) |
| `911e527` | Dois especialistas de IA (landing e e-mail), blocos `faq` e `prova`, revisão em duas passadas |
| `9a53047` | **Migração**: coluna `preheader` em `email_templates` |
| `7297c7b` | Telas: Preview dos blocos novos, seletor de assunto, preheader, tom da IA |

Dois defeitos que este release corrige e que valem saber, porque mudam o que
você vai ver em produção depois:

- **Nenhuma landing tinha imagem.** O catálogo pedia `dall-e-3`, que não existe
  mais na conta. Falha de imagem é não-fatal por design, então a página saía sem
  imagem em silêncio, com log só em `warn`. Passou a ser `gpt-image-1`.
- **Landing podia sair sem CTA.** O schema aceitava um array livre de blocos; o
  "feche por um cta" era só uma frase no prompt. `hero` e `cta` viraram campos
  obrigatórios do schema.

---

## 2. Pré-voo

```bash
git pull origin main
```

**a) O `dist` do frontend é buildado localmente e enviado pelo script.** Se
estiver velho, o deploy sobe frontend desatualizado sem avisar.

```bash
cd frontend && npm ci && npm run build
```

**b) Confira o estado das migrations.** Este é o ponto de maior risco do release.

```bash
cd backend && npx prisma migrate status
```

A migração `20260811180000_email_template_preheader` **nunca foi aplicada em
lugar nenhum**. Se o backend novo subir sem ela, salvar campanha de e-mail
quebra em produção — o código grava `email_templates.preheader`.

O script roda `prisma migrate deploy` sozinho e **aborta se falhar**, com o
backup já feito. Mas vale saber quantas migrations estão pendentes lá antes de
começar, não durante.

**c) A senha do VPS** precisa estar em `RELM_VPS_PASS`. Ela vive no `.env` da
raiz (fora do git). O script lê da variável de ambiente, não do arquivo:

```bash
export $(grep '^RELM_VPS_PASS=' .env | xargs)
```

---

## 3. Staging primeiro

```bash
py -3 scripts/deploy_staging_club.py
```

---

## 4. Validação em staging

Quatro pontos. São exatamente onde este pacote pode quebrar:

1. **A migração aplicou.** O passo 3 do script imprime `migrate status` antes e
   `migrate deploy` depois. `preheader` tem que aparecer como aplicada.
2. **Gerar uma landing traz imagem.** Em Landing Pages, descreva qualquer
   campanha e clique em Gerar. Se vier sem imagem, o log do backend diz o
   motivo (`Imagem não gerada`) — provavelmente o modelo de imagem.
3. **Gerar um e-mail traz 4 assuntos e preheader.** Em Campanhas de E-mail. Os
   quatro aparecem como opções clicáveis com contagem de caracteres.
4. **Salvar a campanha conclui.** É o que exercita a coluna nova.

Bônus: se a geração criar um bloco de depoimento, aparece uma tarja âmbar
avisando que é gerado por IA. Ela existe só no admin e não vai para a página
pública nem para o e-mail.

---

## 5. Produção

```bash
py -3 scripts/deploy_prod_club.py
```

O script já faz, nesta ordem: backup do banco + `dist` + `.env` → upload →
`migrate status` → `migrate deploy` (aborta se falhar) → `npm install` →
`prisma generate` → `seed-services` → `npm run build` → `pm2 reload` →
`migrate:base-to-care` (dry-run e real) → upload do `dist` → `reload nginx`.

---

## 6. Rollback

O script imprime o comando de restauração quando aborta no `migrate deploy`, com
o caminho do dump daquele deploy. A forma é:

```bash
pg_restore --clean --if-exists --no-owner <caminho-do-backup>/prod-db.dump
```

O `dist` antigo do backend fica preservado em `backend-dist.bak` dentro da mesma
pasta de backup.

---

## 7. Pendências que este deploy NÃO resolve

**`PUBLIC_BASE_URL` continua vazia, e este deploy aumenta a urgência disso.**
Até agora nenhuma landing tinha imagem; a partir deste release elas têm. É
exatamente aí que a `og:image` relativa passa a doer: o card do WhatsApp vai
sair sem imagem tendo imagem para mostrar.

O problema é maior que uma variável faltando. Em
`deployment/prod/relm-careplus-prod.conf` o server block da API (linhas 55–79)
está inteiramente comentado, e o único bloco ativo serve o SPA com
`try_files $uri $uri/ /index.html`. Ou seja:
`https://careplus.relmbikes.com.br/lp/<slug>` devolve o `index.html` do React,
não a landing page. Ela só existe hoje em
`http://177.153.62.248:3005/lp/<slug>`.

Conserto: adicionar `location /lp/` e `location /uploads/marketing/` com
`proxy_pass http://127.0.0.1:3005;` no server block do domínio, e então definir
`PUBLIC_BASE_URL="https://careplus.relmbikes.com.br"` no `.env.production`.

**Trocar a senha de root do VPS.** Ela foi exposta em texto plano num chat. Vale
aproveitar para migrar o deploy de senha para chave SSH.

---

## 8. Estado do que está sendo entregue

- 26 testes verdes (`ai-design`, `ai-assistant`, `marketing`, `email-crm`).
- `npx tsc --noEmit` sem erro em `src/`. Os erros que aparecem em `prisma/*.ts`
  (seed, clean) são anteriores a este release e não bloqueiam o build.
- Build do frontend limpo.
- Aceitação da IA rodada em três briefings (primavera/landing, revisão/e-mail e
  um briefing magro de propósito): estrutura, nomenclatura de plano, CTA único,
  ausência de URL inventada e as regras de assunto passaram nos três.
