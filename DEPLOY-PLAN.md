# DEPLOY-PLAN — Relm Care+ (Produção)

**Data do plano:** 2026-06-15
**Autor:** Deploy/SRE (planejamento, NÃO execução)
**Alvo:** VPS `177.153.62.248` (Ubuntu 24.04, Node 20.20, PM2 cluster)
**Escopo:** subir as 7 ondas de segurança (~40 commits, branch `main`) com BREAKING CHANGES.

> Este plano foi construído a partir de **inspeção read-only real do servidor** (nada foi alterado). Onde não foi possível confirmar, está marcado **A VERIFICAR**.

---

## 1. Estado atual do servidor (inspeção read-only)

### Infra / processo
| Item | Valor confirmado |
|---|---|
| OS | Ubuntu 24.04.4 LTS, kernel 6.8, uptime 33 dias |
| Node / npm | `v20.20.0` / `10.8.2` (em `/usr/bin`) |
| PM2 app | `relm-careplus-prod-backend` — **2 instâncias, modo `cluster`**, `online` há 4 dias |
| Porta / env do processo | `PORT=3005`, `NODE_ENV=production`, cwd `/var/www/relm-careplus-prod/backend` |
| Ecosystem | `/var/www/relm-careplus-prod/deployment/ecosystem.config.cjs` (instances: 2, cluster, max_memory_restart 500M) |
| Disco | `/` 67G, 19% usado (53G livre) — folga suficiente para backups |

### Diretórios
- Código: `/var/www/relm-careplus-prod/` (backend + frontend + scripts + deployment)
- Web estático (nginx root): `/var/www/relm-careplus-prod-web/` (servido por `www-data`)
- Backup web existente: `/var/www/relm-careplus-prod-web.backup-20260223-231243` (antigo, fev/2026)
- `deploy.sh` **existe** no servidor: `/var/www/relm-careplus-prod/scripts/deploy.sh`

### nginx — `/etc/nginx/sites-enabled/relm-careplus`
- `listen 80;` **`server_name 177.153.62.248;`** — **somente IP, HTTP, SEM domínio, SEM TLS/HTTPS.**
- `root /var/www/relm-careplus-prod-web;` com `try_files ... /index.html` (SPA).
- `location /api` → `proxy_pass http://backend_api` (upstream `localhost:3005`).
  - **JÁ tem** `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;` e `X-Forwarded-Proto $scheme;` → compatível com `trust proxy=1`. **Não precisa mudar para o rate limit funcionar.**
- `location /docs` → também faz proxy para o backend (hoje exposto).
- **NÃO há** headers de segurança (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) no nginx.
- Cache desabilitado em tudo (`no-store`) — bom para garantir que o front novo seja servido sem cache-bust.

### Backend `.env.production` (chaves presentes/ausentes — valores mascarados)
`.env` e `.env.production` são **IDÊNTICOS** (o PM2 lê `.env`, que é cópia de `.env.production`).

| Chave | Estado | Observação |
|---|---|---|
| `NODE_ENV` | PRESENTE | `production` |
| `PORT` | PRESENTE | `3005` |
| `DATABASE_URL` | PRESENTE | user `relm_user`, host `localhost:5432`, db `relm_careplus_prod` |
| `JWT_SECRET` | PRESENTE | rotacionar (está no histórico git) |
| `JWT_EXPIRES_IN` | PRESENTE | **A VERIFICAR valor** (runbook quer `15m`) |
| `JWT_REFRESH_SECRET` | PRESENTE | rotacionar |
| `JWT_REFRESH_EXPIRES_IN` | PRESENTE | — |
| `CORS_ORIGIN` | PRESENTE | **= `http://177.153.62.248`** (já correto p/ o front atual) |
| `APP_NAME` / `APP_URL` / `API_URL` | PRESENTE | metadados |
| **`CUSTOMER_JWT_SECRET`** | **AUSENTE** | **BLOQUEADOR** — ver alerta abaixo |
| `FRONTEND_URL` / `SMTP_HOST` / `EMAIL_HOST` | AUSENTE | não usados nesse formato |

> ⚠️ **ALERTA CRÍTICO (bloqueador):** `customer-auth.module.ts` faz `secret: config.get('CUSTOMER_JWT_SECRET')` **sem fallback**, e `customer-jwt.strategy.ts` passa esse valor a `secretOrKey`. Se `CUSTOMER_JWT_SECRET` estiver ausente quando o **código novo** subir, a `CustomerJwtStrategy` recebe `undefined` e o **backend NÃO inicia (crash no boot)**. Portanto, definir `CUSTOMER_JWT_SECRET` é **pré-requisito obrigatório antes** de publicar o build novo.

> 🔎 **Correção factual sobre a senha do Postgres:** o runbook cita `Brasil@2015` como senha comprometida. A `DATABASE_URL` **viva** usa o usuário `relm_user` com senha de **16 caracteres** no formato `…@2026!Secure` (contém um `@` literal **não** URL-encoded). Ou seja, a senha em produção **NÃO é** `Brasil@2015`. Rotacionar continua recomendado (segredos vazaram no histórico), mas o valor/usuário reais diferem do runbook — **confirmar com o usuário** qual credencial realmente vazou e qual está em uso. O `@` não-encodado na URL é frágil: funciona no Prisma mas quebra o `psql "$URL"` direto (já observado). Ao rotacionar, **URL-encode** caracteres especiais (`@`→`%40`, `!`→`%21`, etc.).

### Banco (Postgres 16, local)
- Migrações aplicadas em `_prisma_migrations`:
  1. `20260601190457_init_helmdesk_bridge` ✅
  2. `20260603000000_add_new_modules_and_target_roles` ✅ (há 2 linhas; uma sem `finished_at` — registro duplicado, **A VERIFICAR** se causa erro no `migrate deploy`; provavelmente uma tentativa antiga registrada — ver Etapa 4 rollback)
- **`20260615000000_add_customer_refresh_token` → NÃO aplicada.** Coluna `customers.refresh_token` **NÃO existe** ainda. ✅ (esperado)
- Dataset minúsculo: **4 customers** → backup/restore são quase instantâneos.
- **Único consumidor do banco:** `relm_user` via `::1` (loopback), 3 conexões = 2 instâncias PM2 + pool. Não há cron/serviço externo usando a senha (crontab sem jobs de pg/dump). `pg_hba`: acesso só por `127.0.0.1`/`::1` (scram-sha-256). Superusuário `postgres` existe.
  - **Risco de rotação baixo**, mas confirmar que nenhum painel/serviço externo (pgAdmin, backup gerenciado) usa `relm_user`. **A VERIFICAR** com o usuário.

### Código no servidor vs. GitHub
- Repo em `/var/www/relm-careplus-prod` está em `main`, mas **3 commits atrás** do `origin` e **NÃO consegue `git pull`**: `fatal: could not read Username for 'https://github.com'` (repo privado, sem credencial salva). → **Deploy de código DEVE ser via SFTP** (upload de artefatos), como nas ondas anteriores (`scripts/deploy_frontend.py` já faz isso).
- `dist/` do backend é **código ANTIGO** (sem helmet/throttler compilados).
- `node_modules` do backend: **`@nestjs/throttler` AUSENTE, `helmet` AUSENTE**, `prisma` (bin) PRESENTE. → **precisa `npm install` das novas deps + rebuild**.

### Comportamento atual (smoke da versão antiga, para comparar no pós-deploy)
- `GET /api/health` → `{"status":"ok","database":"connected","uptime":408467…}` (vaza uptime — versão antiga).
- `/docs` → **HTTP 200** (Swagger EXPOSTO hoje). No código novo deve virar **404** em produção.
- `/health` (sem `/api`) → 404 (prefixo global é `/api`).
- nginx público `GET /api/health` → 200.
- Frontend publicado: `index.html` aponta para `assets/index-Bu3O_kJA.js` (build de 09/jun) — **A VERIFICAR** se já é a versão com o contrato `{data,total,page,pageSize}` (provável que NÃO; o front novo virá no upload).

---

## 2. Decisões pendentes que exigem o usuário (responder ANTES de iniciar)

1. **Janela de manutenção / downtime:** há uma janela aceitável? O reload do PM2 é "zero-downtime" em teoria, mas com troca de secrets **todos os usuários serão deslogados** e tokens de reset pendentes invalidam. Confirmar horário de baixo tráfego. → **Necessário: janela curta acordada.**
2. **`CUSTOMER_JWT_SECRET`:** confirmo que devo **gerar** um valor forte novo (≠ `JWT_SECRET`), ex. `openssl rand -base64 48`. OK? (É bloqueador — sem ele o backend não sobe.)
3. **`CORS_ORIGIN`:** hoje já é `http://177.153.62.248` e o front é acessado por **IP/HTTP, sem domínio**. Confirmo **manter exatamente** `http://177.153.62.248` (sem barra final, sem `https`). **Há plano de domínio/HTTPS?** Se sim, isso muda CORS, HSTS e `VITE_API_URL`.
4. **`JWT_EXPIRES_IN`:** runbook pede `"15m"`. Confirmar — tokens admin passam a expirar em 15 min (mais re-login). Manter o atual ou aplicar `15m`?
5. **Rotação de segredos JWT (`JWT_SECRET`, `JWT_REFRESH_SECRET`):** rotacionar **invalida todas as sessões ativas** (admin e cliente re-logam; refresh tokens existentes morrem). Confirmar que pode ser feito **nesta janela** (recomendo fazer junto, já que a troca de `CUSTOMER_JWT_SECRET` já desloga clientes).
6. **Rotação da senha do Postgres:** confirmar **(a)** se a credencial realmente comprometida é a de `relm_user` em uso (16 chars `…@2026!Secure`) ou a `Brasil@2015` do runbook (que **não** está viva); **(b)** quem executa o `ALTER USER` (você ou eu, fora do escopo read-only); **(c)** se **algum** serviço externo usa `relm_user` (senão a rotação quebra essa conexão). Recomendo rotacionar **por último**, em passo controlado.
7. **Registro duplicado de migração** `20260603000000` em `_prisma_migrations` (uma linha sem `finished_at`): confirmar se foi um retry conhecido. Pode fazer `migrate deploy` reclamar. Plano traz mitigação.

---

## 3. Pré-requisitos e backups (executar ANTES de qualquer mudança)

> Estes comandos **alteram estado** (criam arquivos de backup) — **fora do escopo read-only deste plano**. Executar na janela de deploy, com confirmação humana.

**Variáveis usadas abaixo:**
```bash
TS=$(date +%Y%m%d-%H%M%S)
BE=/var/www/relm-careplus-prod/backend
WEB=/var/www/relm-careplus-prod-web
```

### 3.1 Backup do `.env` (segredos)
```bash
cp -a $BE/.env            /root/relm-backups/$TS/env.bak
cp -a $BE/.env.production /root/relm-backups/$TS/env.production.bak
mkdir -p /root/relm-backups/$TS   # criar antes dos cp acima
chmod 600 /root/relm-backups/$TS/*
```

### 3.2 Backup do banco (dump lógico — dataset pequeno)
```bash
# Extrair credenciais SEM expor no histórico do shell (ler do .env)
# Use as flags discretas para tolerar '@' na senha:
#   export PGPASSWORD=<senha do .env, sem URL-encode>
pg_dump -h localhost -p 5432 -U relm_user -d relm_careplus_prod -Fc \
  -f /root/relm-backups/$TS/relm_careplus_prod.dump
# Verificação:
ls -lh /root/relm-backups/$TS/relm_careplus_prod.dump   # deve existir e > 0 bytes
pg_restore -l /root/relm-backups/$TS/relm_careplus_prod.dump | head   # lista TOC sem restaurar
```

### 3.3 Backup do web estático e do dist atual
```bash
cp -a $WEB /var/www/relm-careplus-prod-web.backup-$TS
cp -a $BE/dist /root/relm-backups/$TS/backend-dist.bak
```

### 3.4 Snapshot do PM2
```bash
pm2 save   # garante dump.pm2 atual (NOTA: pm2 save grava estado; rodar só se autorizado)
pm2 jlist > /root/relm-backups/$TS/pm2-jlist.json
cp -a /etc/nginx/sites-available/relm-careplus /root/relm-backups/$TS/nginx-relm.bak
```

**Gate:** confirmar que **3.1, 3.2 e 3.3 existem e têm tamanho > 0** antes de prosseguir. Sem backup do banco, NÃO avançar para a Etapa 4.

---

## 4. Etapas do deploy (ordem segura, com verificação e rollback)

> **Princípio:** migração é **aditiva** (`ADD COLUMN refresh_token TEXT` nullable) → compatível com o código antigo. Logo pode ir **antes** do deploy de código, sem quebrar a versão em execução. Env novas entram **sem remover** as antigas. Código backend+frontend sobem **juntos** (contrato `/customers` mudou). Rotação de segredos fica **por último**.

---

### Etapa 0 — Build LOCAL dos artefatos (na máquina de trabalho)
**Objetivo:** gerar `backend/dist` e `frontend/dist` com o código novo **localmente** (servidor não consegue `git pull`).
**Comandos (local):**
```bash
# Backend
cd backend && npm ci && npm run build      # gera dist/ com helmet+throttler
cd ../frontend && npm ci && npm run build  # gera dist/ com VITE_API_URL=http://177.153.62.248:3005
```
**Verificação:** `dist/main.js` existe; `grep -r helmet backend/dist/main.js` retorna match; `frontend/dist/index.html` referencia novo hash de asset.
**Rollback:** trivial (nada tocado no servidor ainda).

> **Nota deps:** o `deploy.sh` do servidor usa `npm ci --omit=dev`, que **NÃO instala `prisma`** (devDependency) — porém o servidor já tem o bin do prisma e o Client gerado. Como o deploy será via **upload de artefatos**, vamos enviar `node_modules` de produção OU rodar `npm ci` no servidor. **Decisão recomendada:** rodar `npm ci` (com dev) **no servidor** no diretório backend para instalar throttler/helmet/prisma e poder rodar `prisma generate`/`migrate deploy`. (Ver Etapa 3-código.)

---

### Etapa 1 — Adicionar `CUSTOMER_JWT_SECRET` e demais env (SEM remover as antigas)
**Objetivo:** preparar o ambiente para o código novo **antes** de subir o build (evita crash de boot).
**Comandos (servidor):**
```bash
BE=/var/www/relm-careplus-prod/backend
# Gerar segredo forte e DIFERENTE de JWT_SECRET:
NEW_CUST=$(openssl rand -base64 48)
# Acrescentar (NÃO sobrescrever) ao .env.production e .env:
printf '\nCUSTOMER_JWT_SECRET=%s\n' "$NEW_CUST" >> $BE/.env.production
# (Opcional, se confirmado) ajustar JWT_EXPIRES_IN para 15m:
#   editar a linha existente JWT_EXPIRES_IN="15m"
# Sincronizar .env (o PM2 lê .env):
cp $BE/.env.production $BE/.env
```
**Verificação (read-only):**
```bash
grep -c '^CUSTOMER_JWT_SECRET=' $BE/.env $BE/.env.production   # deve ser 1 em cada
diff $BE/.env $BE/.env.production && echo IDENTICAL
```
> **Importante:** NÃO reiniciar o PM2 ainda — o código antigo ignora `CUSTOMER_JWT_SECRET`, então adicionar a chave agora é **inócuo** para a versão em execução e seguro.
**Rollback:** restaurar `.env`/`.env.production` do backup 3.1.
**Gate:** confirmar que `CORS_ORIGIN` permaneceu `http://177.153.62.248` e que nenhuma chave antiga foi perdida.

---

### Etapa 2 — Aplicar a migração Prisma (aditiva, compatível com código antigo)
**Objetivo:** criar `customers.refresh_token` sem mexer no código rodando.
**Comandos (servidor):**
```bash
cd /var/www/relm-careplus-prod/backend
# Garantir que os arquivos de migração novos foram enviados (Etapa de upload, ver 3-código)
NODE_ENV=production npx prisma migrate deploy
```
**Verificação:**
```bash
# read-only:
psql -h localhost -U relm_user -d relm_careplus_prod -tAc \
 "SELECT column_name FROM information_schema.columns WHERE table_name='customers' AND column_name='refresh_token';"
# deve retornar: refresh_token
psql -h localhost -U relm_user -d relm_careplus_prod -tAc \
 "SELECT migration_name FROM _prisma_migrations WHERE migration_name='20260615000000_add_customer_refresh_token';"
```
**Smoke:** `GET /api/health` ainda 200 (código antigo segue funcionando — coluna nova é nullable e ignorada).
**Rollback:**
- Se `migrate deploy` falhar por causa do **registro duplicado** de `20260603…` (linha sem `finished_at`): NÃO usar `db push --accept-data-loss`. Investigar com `prisma migrate status`. Se necessário, marcar a migração problemática como aplicada via `prisma migrate resolve --applied 20260603000000_add_new_modules_and_target_roles` (passo controlado, com confirmação).
- Se a coluna foi criada mas precisa reverter: `ALTER TABLE customers DROP COLUMN refresh_token;` + remover a linha de `_prisma_migrations`. (Aditiva e nullable → seguro reverter, sem perda de dados de negócio.)
**Gate humano:** confirmar saída de `prisma migrate status` limpa antes do deploy de código.

---

### Etapa 3 — Upload + build do código (backend e frontend JUNTOS) e reload
**Objetivo:** publicar a versão nova de backend e frontend ao mesmo tempo (contrato `/customers` mudou).

**3a. Upload dos fontes/artefatos via SFTP (servidor não faz git pull):**
- Enviar `backend/src`, `backend/package.json`, `backend/package-lock.json`, `backend/prisma/` e `frontend/dist/` (reusar a abordagem do `scripts/deploy_frontend.py`, estendida para o backend).
- Alternativa mais segura: enviar `backend/dist` já compilado localmente (Etapa 0) + `package*.json` + `prisma/`, e rodar só `npm ci` no servidor.

**3b. Instalar deps novas e gerar Prisma Client (servidor):**
```bash
cd /var/www/relm-careplus-prod/backend
npm ci                    # instala @nestjs/throttler, helmet, prisma (dev) etc.
NODE_ENV=production npx prisma generate
# Se NÃO enviou dist pronto, compilar no servidor:
npm run build
# Verificar deps:
ls node_modules/@nestjs/throttler >/dev/null && echo THROTTLER_OK
ls node_modules/helmet >/dev/null && echo HELMET_OK
```

**3c. Publicar frontend estático:**
```bash
WEB=/var/www/relm-careplus-prod-web
rm -rf "$WEB"/*
cp -r /var/www/relm-careplus-prod/frontend/dist/* "$WEB/"
# Preservar o logo se ele não vier no build (hoje há logo-relm.png solto):
chown -R www-data:www-data "$WEB" && chmod -R 755 "$WEB"
```
> **Atenção:** o web atual tem `logo-relm.png` (4MB) solto na raiz, fora de `assets/`. Confirmar se o front novo referencia esse caminho; se sim, **preservá-lo** antes do `rm -rf`.

**3d. Reload do backend (PM2 cluster, zero-downtime):**
```bash
cd /var/www/relm-careplus-prod/backend
cp .env.production .env                       # garantir env sincronizado (já feito na Etapa 1)
pm2 reload relm-careplus-prod-backend         # reload rolling nas 2 instâncias
pm2 save
```

**Verificação / smoke imediato:**
```bash
pm2 list                                      # 2 instâncias online, restart count baixo
pm2 logs relm-careplus-prod-backend --lines 40 --nostream   # SEM "CUSTOMER_JWT_SECRET undefined", SEM crash loop
curl -s http://127.0.0.1:3005/api/health      # health enxuto (sem uptime/erros de banco)
curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3005/docs   # esperado 404 (prod)
```
**Rollback (código):**
1. `pm2 reload` mantém a versão antiga viva até a nova subir; se a nova falhar (crash loop), o PM2 pode ficar com instâncias erradas → restaurar `dist`:
   ```bash
   rm -rf /var/www/relm-careplus-prod/backend/dist
   cp -a /root/relm-backups/$TS/backend-dist.bak /var/www/relm-careplus-prod/backend/dist
   cp -a /root/relm-backups/$TS/env.bak /var/www/relm-careplus-prod/backend/.env
   pm2 reload relm-careplus-prod-backend
   ```
2. Frontend: `rm -rf $WEB/* && cp -a /var/www/relm-careplus-prod-web.backup-$TS/* $WEB/`.
**Gate humano:** só prosseguir para a Etapa 5 se TODOS os smoke tests da seção 5 passarem.

---

### Etapa 4 — nginx: headers de segurança (mudança aditiva e de baixo risco)
**Objetivo:** adicionar HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy.
> **Cuidado HSTS:** o site é **HTTP puro (sem TLS)**. Enviar `Strict-Transport-Security` em HTTP é **inócuo/ignorado** pelos browsers (HSTS só vale sob HTTPS) — porém, se um dia migrar para HTTPS num domínio, o header passa a valer. **Recomendo NÃO adicionar HSTS enquanto for IP/HTTP**, para evitar surpresas; adicionar apenas os outros 3. Confirmar com o usuário (decisão #3).
**Comandos (servidor):** editar `/etc/nginx/sites-available/relm-careplus`, no bloco `server`:
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
# (Só se houver HTTPS) add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```
> **Nota nginx:** `add_header` em um `location` interno **substitui** os do `server`. Como já há `add_header Cache-Control…` nos `location / ` e de assets, os headers de segurança precisam ser **repetidos** nesses blocos ou movidos para o nível `server` com cuidado. Validar com `nginx -T` que aparecem na resposta.
**Verificação:**
```bash
nginx -t                                      # config OK
systemctl reload nginx
curl -sI http://127.0.0.1/ | grep -iE 'x-frame|x-content|referrer'   # headers presentes
```
**Rollback:** `cp -a /root/relm-backups/$TS/nginx-relm.bak /etc/nginx/sites-available/relm-careplus && nginx -t && systemctl reload nginx`.
**`X-Forwarded-For`:** já presente — **nenhuma mudança necessária** para o `trust proxy`.

---

### Etapa 5 — Rotação de segredos (PASSO IRREVERSÍVEL DE SESSÃO — por último)
**Objetivo:** rotacionar `JWT_SECRET`, `JWT_REFRESH_SECRET` e a senha do Postgres.
> **Gate humano OBRIGATÓRIO.** Esta etapa **desloga todos os usuários** e, no caso do Postgres, exige `ALTER USER` + atualizar `DATABASE_URL`. Só executar após o app novo estar **estável** (Etapas 1–4 verificadas).

**5a. JWT (deslogа sessões):**
```bash
BE=/var/www/relm-careplus-prod/backend
# editar .env.production trocando os valores de JWT_SECRET e JWT_REFRESH_SECRET
#   por `openssl rand -base64 48` (cada um único)
cp $BE/.env.production $BE/.env
pm2 reload relm-careplus-prod-backend
```
Verificação: login admin e login cliente funcionam **com novo login** (sessões antigas inválidas — esperado).

**5b. Senha Postgres (passo controlado):**
```bash
# 1) Trocar no banco (URL-encode chars especiais na DATABASE_URL depois!):
psql -h localhost -U postgres -d relm_careplus_prod -c \
  "ALTER USER relm_user WITH PASSWORD '<NOVA_SENHA_FORTE>';"
# 2) Atualizar DATABASE_URL no .env.production (senha URL-encoded: @->%40 ! ->%21 ...):
#    DATABASE_URL="postgresql://relm_user:<SENHA_ENCODED>@localhost:5432/relm_careplus_prod?schema=public"
cp $BE/.env.production $BE/.env
# 3) Reload para reconectar com a nova credencial:
pm2 reload relm-careplus-prod-backend
```
**Verificação:** `curl http://127.0.0.1:3005/api/health` → `"database":"connected"`; `pm2 logs` sem erro de auth Postgres.
**Rollback:**
- JWT: restaurar `.env` do backup 3.1 + `pm2 reload` (usuários voltam às sessões antigas… na prática re-logam de novo).
- Postgres: reverter senha (`ALTER USER … WITH PASSWORD '<senha_antiga>'`) e restaurar `DATABASE_URL` do backup. **Por isso a senha antiga deve estar guardada no backup 3.1 antes de trocar.**
**Risco externo:** confirmado que só `relm_user` (loopback) usa o banco. Se houver consumidor externo desconhecido, ele quebra aqui → manter janela de observação.

---

## 5. Smoke tests pós-deploy (checklist concreto)

Executar após Etapa 3 (e revalidar após Etapa 5). Front é acessado em `http://177.153.62.248`.

| # | Teste | Como | Esperado |
|---|---|---|---|
| 1 | Health enxuto | `curl http://127.0.0.1:3005/api/health` | `status:ok`, **sem** `uptime`/erros de banco |
| 2 | `/docs` fechado | `curl -o /dev/null -w '%{http_code}' .../docs` | **404** (era 200) |
| 3 | Login admin | POST `/api/auth/login` credenciais válidas | 200 + token; token sem `type` aceito |
| 4 | Login cliente | POST `/api/customer-auth/login` (ou rota equiv.) | 200 + token (usa `CUSTOMER_JWT_SECRET`) |
| 5 | Listar clientes paginado | GET `/api/customers?page=1&pageSize=50` com token admin | corpo `{ data, total, page, pageSize }` (total=4) |
| 6 | Garantia pública | POST endpoint público de validação/registro de garantia | 200/201, protocolo único |
| 7 | FSM garantia | aprovar/reprovar exige status `EM_ANALISE` antes | rejeita transição inválida |
| 8 | CORS do front | abrir `http://177.153.62.248`, logar e navegar | sem erro CORS no console (origin liberada) |
| 9 | Rate limit | 6 POSTs seguidos em `/api/auth/login` | 6º retorna **429** (limit 5/min) |
| 10 | Headers segurança (nginx) | `curl -sI http://127.0.0.1/` | `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` presentes |
| 11 | Helmet (backend) | `curl -sI http://127.0.0.1:3005/api/health` | headers do helmet presentes (ex.: `X-DNS-Prefetch-Control`) |
| 12 | Portal loja localStorage | login na loja, recarregar página | sessão mantida (chaves `access_token`/`user` reusadas) |
| 13 | PM2 estável | `pm2 list` | 2 instâncias `online`, restart count não disparando |

**Critério de sucesso:** 1–13 verdes. Qualquer falha em 3/4/5/8 → **rollback imediato** (Seção 6).

---

## 6. Plano de rollback geral (voltar tudo)

Ordem inversa, usando os backups `/root/relm-backups/$TS/` e `…-web.backup-$TS`:

1. **Backend código + env:**
   ```bash
   cp -a /root/relm-backups/$TS/env.bak /var/www/relm-careplus-prod/backend/.env
   cp -a /root/relm-backups/$TS/env.production.bak /var/www/relm-careplus-prod/backend/.env.production
   rm -rf /var/www/relm-careplus-prod/backend/dist
   cp -a /root/relm-backups/$TS/backend-dist.bak /var/www/relm-careplus-prod/backend/dist
   pm2 reload relm-careplus-prod-backend && pm2 save
   ```
2. **Frontend estático:**
   ```bash
   rm -rf /var/www/relm-careplus-prod-web/*
   cp -a /var/www/relm-careplus-prod-web.backup-$TS/* /var/www/relm-careplus-prod-web/
   chown -R www-data:www-data /var/www/relm-careplus-prod-web
   ```
3. **nginx:**
   ```bash
   cp -a /root/relm-backups/$TS/nginx-relm.bak /etc/nginx/sites-available/relm-careplus
   nginx -t && systemctl reload nginx
   ```
4. **Banco (só se necessário — migração é aditiva/nullable, geralmente NÃO precisa reverter):**
   - Reverter coluna: `ALTER TABLE customers DROP COLUMN refresh_token;` + limpar linha em `_prisma_migrations`.
   - Restauração completa (último recurso, perde dados gravados após o dump):
     ```bash
     pg_restore -h localhost -U relm_user -d relm_careplus_prod --clean --if-exists \
       /root/relm-backups/$TS/relm_careplus_prod.dump
     ```
5. **Senha Postgres (se rotacionada):** `ALTER USER relm_user WITH PASSWORD '<senha_antiga_do_backup>';` + restaurar `DATABASE_URL`.

> Como o código antigo é compatível com a coluna nova (nullable), o rollback de código **não** exige rollback de banco. Reverter o banco só se houver corrupção/erro de migração.

---

## 7. Ordem de menor risco (recomendação justificada)

```
0. Build LOCAL dos artefatos (sem tocar no servidor)
1. BACKUPS (env + dump do banco + web + nginx + pm2)          ← rede de segurança
2. Adicionar env NOVAS sem remover as antigas (CUSTOMER_JWT_SECRET, [JWT_EXPIRES_IN])
   → inócuo p/ código antigo; remove o bloqueador de boot do código novo
3. Migração Prisma (ADD COLUMN nullable)                       ← aditiva, compatível c/ código antigo
4. Deploy de código backend+frontend JUNTOS via SFTP + npm ci + prisma generate + pm2 reload
   → contrato /customers muda; precisam subir juntos; reload rolling = quase zero downtime
5. nginx: headers de segurança (aditivo; X-Forwarded-For já existe)
6. SMOKE TESTS completos (seção 5)
7. Rotação de segredos (JWT + senha Postgres) POR ÚLTIMO       ← passo irreversível de sessão
8. Revalidar smoke tests
```

**Justificativa:**
- **Backups primeiro** → todo passo seguinte tem rollback determinístico.
- **Env antes do código** → evita o crash de boot por `CUSTOMER_JWT_SECRET` ausente; adicionar chaves é seguro para a versão antiga.
- **Migração aditiva antes do código** → a coluna nullable não afeta o código antigo, então pode ir cedo e ser validada isoladamente; reduz o tamanho do "big bang" do passo de código.
- **Backend+frontend juntos** → o contrato `{data,total,page,pageSize}` é breaking; subir separados quebraria a tela de clientes. `pm2 reload` (cluster, 2 instâncias) faz rolling restart minimizando downtime.
- **nginx por último antes do smoke** → mudança de baixo risco e reversível em segundos.
- **Rotação de segredos no fim** → é o único passo que **desloga usuários** e mexe em credencial de banco; isolá-lo permite validar que o app novo está saudável **antes** de introduzir a variável "todo mundo re-loga", e mantém a janela de impacto curta e controlada.

---

## Apêndice — Itens "A VERIFICAR" (como verificar)
- **Valor de `JWT_EXPIRES_IN` atual:** `grep '^JWT_EXPIRES_IN=' $BE/.env.production` (read-only).
- **Front novo referencia `logo-relm.png` na raiz?** inspecionar `frontend/dist/index.html` e `assets/` localmente antes do `rm -rf` do web.
- **Build do front atual já tem o contrato novo?** comparar hash `assets/index-*.js` publicado (09/jun) com o build local da Etapa 0.
- **Registro duplicado de `20260603…`:** rodar `npx prisma migrate status` no servidor antes da Etapa 2.
- **Consumidores externos do Postgres:** confirmar com o usuário (nenhum cron/serviço encontrado; só `relm_user` via loopback).
- **Credencial Postgres realmente vazada:** o runbook cita `Brasil@2015`, mas a viva é `relm_user` com senha 16-char `…@2026!Secure`. Confirmar qual rotacionar.
