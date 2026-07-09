# RELM Care — Runbook de Deploy (Ondas 1–7)

Procedimento de deploy das migrations do clube de assinatura em **produção**.
Comandos concretos. Rodar a partir de `backend/` com `DATABASE_URL` apontando
para produção. **NÃO** rodar `prisma db push` em produção.

Migrations das ondas (aplicadas em ordem):

| Migration | Onda | Cria |
|---|---|---|
| `20260708000000_add_payments_club_settings` | 1 | `payments`, `club_settings`, enums `PaymentMethod`/`PaymentStatus` |
| `20260708010000_add_insurance_policy` | 2 | `insurance_policies`, enum `PolicyStatus` |
| `20260708020000_add_engagement_wave3` | 3 | `referrals`; colunas `customers.referral_code`, `customers.referred_by_id`; `event_attendances.attended*` |
| `20260708030000_add_gamification_wave4` | 4 | `achievements`, `customer_achievements`; colunas `customers.leaderboard_opt_in`, `customers.nickname` |
| `20260708040000_add_presale_partners_wave5` | 5 | `partners`; colunas `catalog_items.presale_until`, `catalog_items.presale_tier` |
| `20260708050000_add_workshop_wave6` | 6 | colunas de logística: `service_orders.pickup_address`, `service_orders.logistics_status`, enum `LogisticsStatus` |

> As migrations das ondas usam `IF NOT EXISTS` / `CREATE TYPE` idempotentes na
> maior parte, mas o fluxo canônico abaixo (`migrate deploy`) é o suportado.

---

## 0. Pré-requisitos

```bash
cd backend
node -v            # >= 20
export DATABASE_URL="postgresql://USER:PASS@HOST:5432/relm?schema=public"
npx prisma --version
```

---

## 1. Backup do banco (OBRIGATÓRIO antes de qualquer migration)

```bash
# Dump completo (schema + dados), comprimido, com timestamp.
pg_dump "$DATABASE_URL" -Fc -f "relm_pre_ondas_$(date +%Y%m%d_%H%M%S).dump"

# Verifique o tamanho do arquivo (não pode ser 0 bytes).
ls -lh relm_pre_ondas_*.dump
```

Guarde o caminho do dump — é o ponto de rollback (seção 6).

---

## 2. Reconciliação do histórico de migrations (baseline)

O schema base do RELM foi originalmente aplicado via `db push` em alguns
ambientes. Antes de aplicar as migrations das ondas, o `_prisma_migrations`
precisa refletir o estado atual. **Escolha UM dos cenários:**

### Cenário A — o ambiente já usa `prisma migrate` (tem `_prisma_migrations` populada)

Nada a reconciliar. Verifique quais migrations estão pendentes:

```bash
npx prisma migrate status
```

Se as 6 migrations das ondas aparecerem como *pending*, siga para a seção 3.

### Cenário B — o schema base existe mas veio de `db push` (sem histórico)

Marque **todas** as migrations anteriores às ondas (18 pastas, de
`20260601190457_init_helmdesk_bridge` até `20260701000000_add_product_price`)
como já aplicadas (`resolve --applied`), sem reexecutá-las, para não recriar
tabelas existentes. Um loop resolve todas de uma vez:

```bash
for m in $(ls prisma/migrations | grep -vE '^20260708|^README|^migration_lock'); do
  npx prisma migrate resolve --applied "$m"
done
```

Alternativa (baseline por diff, se preferir gerar a baseline a partir do banco vivo):

```bash
npx prisma migrate diff \
  --from-empty \
  --to-url "$DATABASE_URL" \
  --script > /tmp/baseline.sql
# Inspecione /tmp/baseline.sql; use apenas se for reconstruir a baseline formal.
```

Confirme que só as 6 migrations das ondas ficaram pendentes:

```bash
npx prisma migrate status
```

---

## 3. Aplicar as migrations das ondas

```bash
npx prisma migrate deploy
npx prisma generate
```

`migrate deploy` aplica apenas as migrations pendentes (as 6 das ondas), em ordem.

### 3.1. Seeds de produção (ClubSettings da Onda 1)

> ⚠️ **NÃO rode `npx prisma db seed` em produção** — o `seed.ts` cria dados
> demo (lojas, usuários e clientes fictícios via upsert).

As migrations já semeiam: chaves de engajamento (Onda 3) e os 5 badges (Onda 4).
Faltam apenas as duas chaves da Onda 1, que vivem só no seed demo. Insira via SQL
idempotente (ajuste os valores à precificação real antes de rodar):

```sql
INSERT INTO club_settings (id, key, value, updated_at) VALUES
  (gen_random_uuid(), 'plus_annual_fee', '299.00', NOW()),
  (gen_random_uuid(), 'point_value_brl', '0.05',   NOW())
ON CONFLICT (key) DO NOTHING;
```

---

## 4. Migração da base atual para CARE (assinaturas)

Cria uma `Subscription` CARE ACTIVE para todo `Customer` sem assinatura.
Idempotente (`Subscription.customer_id` é `@unique`). Rode o **dry-run** primeiro:

```bash
npm run migrate:base-to-care -- --dry-run   # só reporta contagens
npm run migrate:base-to-care                # aplica em lotes de 500
```

---

## 5. Verificação pós-deploy

Uma linha de cada tabela nova + checagem das colunas novas:

```sql
-- Tabelas novas (esperado: retorna 0+ linhas, SEM erro de "relation does not exist")
SELECT * FROM payments               LIMIT 1;
SELECT * FROM club_settings          LIMIT 1;
SELECT * FROM insurance_policies     LIMIT 1;
SELECT * FROM referrals              LIMIT 1;
SELECT * FROM achievements           LIMIT 1;
SELECT * FROM customer_achievements  LIMIT 1;
SELECT * FROM partners               LIMIT 1;

-- Colunas novas (esperado: executa sem erro)
SELECT referral_code, referred_by_id, leaderboard_opt_in, nickname
  FROM customers LIMIT 1;
SELECT presale_until, presale_tier FROM catalog_items LIMIT 1;
SELECT pickup_address, logistics_status FROM service_orders LIMIT 1;

-- Migration history: as 6 das ondas devem estar em _prisma_migrations sem falha
SELECT migration_name, finished_at, rolled_back_at
  FROM _prisma_migrations
 WHERE migration_name LIKE '20260708%'
 ORDER BY migration_name;

-- Base migrada: nenhum cliente sem assinatura
SELECT COUNT(*) AS clientes_sem_assinatura
  FROM customers c
  LEFT JOIN subscriptions s ON s.customer_id = c.id
 WHERE s.id IS NULL;   -- esperado: 0

-- ClubSettings calibráveis presentes (seed)
SELECT key, value FROM club_settings ORDER BY key;
```

Verificação de app (após restart do backend):

```bash
# prod: api-careplus.relmbikes.com.br (porta local 3001)
# staging: staging-api-careplus.relmbikes.com.br (porta local 3002)
curl -sf https://API_HOST/health        # {"status":"ok"}
curl -sf https://API_HOST/health/crons  # lista os 4 crons e último status
```

> **Deploy do código da aplicação** (upload, `npm run build`, `pm2 reload`) não
> está coberto aqui — use os scripts `scripts/deploy_*.py` (staging:
> `scripts/deploy_staging_club.py`, que executa este runbook automatizado,
> incluindo backup e baseline). Este documento é a referência do procedimento
> de banco/migrations.

---

## 6. Rollback

Se a verificação falhar, **restaure o dump** da seção 1:

```bash
# Encerre o backend (para não escrever durante a restauração).
# Drop + recreate do schema e restore completo:
psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
pg_restore --clean --if-exists --no-owner -d "$DATABASE_URL" relm_pre_ondas_<TIMESTAMP>.dump

# Confirme que as tabelas das ondas NÃO existem mais:
psql "$DATABASE_URL" -c "\dt payments"   # deve retornar 'Did not find any relation'
```

> Como o dump da seção 1 é anterior a todas as migrations das ondas, o restore
> reverte schema **e** os dados criados no deploy (inclusive as assinaturas CARE
> da seção 4). A migração da base (seção 4) é idempotente e pode ser reexecutada
> após um novo deploy bem-sucedido.

---

## 7. Checklist de lançamento (pendências e itens manuais)

- [ ] Backup (seção 1) gerado e validado (> 0 bytes).
- [ ] `prisma migrate status` mostra apenas as 6 migrations das ondas como aplicadas.
- [ ] `migrate:base-to-care` rodado (dry-run + aplicação); query de verificação = 0 órfãos.
- [ ] `GET /health` e `GET /health/crons` respondendo.
- [ ] **Rate limiting**: `@nestjs/throttler` **está instalado e configurado**
      (guard global 100 req/min por IP + limites rígidos por rota). Rotas com
      `@Throttle` aplicado: `customer-auth` (register/login/change/forgot/reset,
      5/min; forgot/reset 3/min) e `POST /public/insurance-quote` (5/min).
      → **Sem pendência** neste item.
- [ ] Variáveis de ambiente de produção (`DATABASE_URL`, JWT secrets, SMTP) setadas.
- [ ] `club_settings` populado via SQL da seção 3.1 (⚠️ NUNCA `prisma db seed`
      em produção — cria dados demo) e valores de anuidade/ponto calibrados.

---

## 8. LGPD — dados pessoais das novas features

| Dado | Onde | Tabela/coluna | Base legal / consentimento |
|---|---|---|---|
| Data de nascimento (`birth_date`) | Bônus de aniversário (Onda 3) | `customers.birth_date` | Coletada no cadastro; usada só para creditar bônus na data. |
| Apelido (`nickname`) | Ranking/leaderboard (Onda 4) | `customers.nickname` | Opcional; exibido apenas se o cliente optar pelo ranking. |
| Opt-in de ranking | Leaderboard (Onda 4) | `customers.leaderboard_opt_in` (default `false`) | **Consentimento explícito**: default é `false`; leaderboard só exibe quem ativou (`PATCH` no portal do cliente via `gamification.controller`). |
| Grafo de indicações | Programa de indicação (Onda 3) | `customers.referral_code`, `customers.referred_by_id`, `referrals` | Relaciona quem indicou quem; dado de relacionamento entre clientes. |
| Endereço de coleta/entrega | Logística leva-e-traz (Onda 6) | `service_orders.pickup_address` | Fornecido pelo cliente ao solicitar o serviço; usado só para a logística daquela OS. |

**Consentimento**: o único dado que exige opt-in explícito é a participação no
ranking — `leaderboard_opt_in` nasce `false` e o cliente ativa conscientemente.
Os demais são dados operacionais necessários para prestar o serviço solicitado.

**Retenção / direito ao esquecimento**: ao remover um cliente, considerar também
`referrals` (grafo), `customer_achievements`, `payments`, `insurance_policies` e
`vouchers` associados. `leaderboard_opt_in`/`nickname` podem ser revertidos a
qualquer momento pelo próprio cliente (opt-out) sem apagar a conta.
