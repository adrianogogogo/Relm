# 011 — Reunião 07/08/2026: ajustes para o lançamento de 18/08

**Fonte:** transcrição da reunião Adriano Gouveia × Murilo Fernandes, 07/08/2026 (41 min).
**Data-alvo:** 18/08/2026 (lançamento parcial).
**Premissa:** MVP evolutivo — o sistema já é usado como ferramenta de marketing enquanto evolui.

---

## Gap analysis (o que já existe × o que falta)

Boa parte do que foi pedido **já está implementado**. O plano abaixo só ataca o que
realmente falta.

| # | Pedido na reunião | Estado atual | Ação |
|---|---|---|---|
| 1 | Menu lateral some ao abrir catálogo de serviços [03:15] | `StoreLayout.jsx:36` aponta para `/admin/master-services` — rota do `AdminLayout` | **Bug real.** Rota espelhada em `/loja` |
| 2 | Vincular venda a produto cadastrado [04:20] | `SaleItem.productId` + `AdminCurationPage` já existem | Nada — validar em teste |
| 3 | Auditoria de tudo que é feito na página [40:10] | `AuditLog` existe, mas chamadas **manuais** em só 7 módulos | **Gap.** Interceptor global |
| 4 | Confirmar/cancelar anuidade [18:00] | `payments.service.ts` `confirm()` / `cancel()` | Nada |
| 5 | Cada loja só vê seus clientes [09:10] | `customers.service.ts` força `requesterStoreId` | Nada — validar em teste |
| 6 | Catálogos, banners, parcerias, benefícios | `CatalogItem`, `Banner`, `Partner`, `Benefit` | Nada |
| 7 | WhatsApp via Meta [30:40] | `whatsapp.service.ts` já usa Cloud API + broadcast | Nada — falta só configurar o número |
| 8 | Relatórios bonitos + score [25:50] [41:00] | `reports.service.ts` tem 5 relatórios; **sem score** | **Gap parcial.** Score por loja |
| 9 | **Pontos: 2 tipos** [15:05] | `PointsLedger` tem **um só** bucket (acumulável, 365d, FIFO) | **Gap maior.** Bucket mensal |
| 10 | **Pontos por produto/serviço** [13:09] | `addPurchasePoints` = valor × multiplicador de tier | **Gap.** Tabela de regras |
| 11 | **Resgatar serviço com pontos** [11:41] | `CatalogItem` só cobre produto/prêmio | **Gap.** Serviço resgatável |
| 12 | **Landing pages / campanhas** [27:30] | Nenhum model. `ContentItem` é markdown interno | **Gap maior.** Módulo novo |
| 13 | Provedor de e-mail / CRM [44:55] | `email.service.ts` = nodemailer SMTP puro | **Bloqueado** — Adriano define o provedor |
| 14 | "Transformar em mim" (super-admin) [29:20] | `admin-users` + `UserRole` | Validar a regra: `de mim` não cria `de mim` |

**Bloqueio externo:** o item 13 depende de o Adriano escolher o provedor (ficou de "ir
atrás do CS"). Sem isso, o disparo em massa não sai do SMTP transacional atual.

---

## Decisões fechadas (sessão de grilling, 10/08/2026)

Escopo desta rodada: **steps 2, 3, 4, 5 e 7**. Os steps 6 e 8 saem — dependem de
insumo do Adriano (templates da "Marina" e provedor de e-mail).

Três descobertas mudaram o desenho original:

1. **O Step 2 encolheu.** Sem cron, sem linhas de concessão, sem job de reset. O saldo
   mensal é **derivado** (cota do tier menos o consumido no mês corrente), mesmo padrão
   do `serviceAllowancePerYear` que já existe. "Uso-ou-perde" sai de graça.
2. **O Step 3 cresceu.** `sales.service.ts` não tem uma linha de pontos — **venda não
   credita ponto nenhum hoje**. `addPurchasePoints` só é chamado por
   `subscriptions.service.ts:79` (anuidade). Não é adicionar regra a um fluxo existente,
   é criar o fluxo.
3. **Apareceu um Step 2a.** `plus_points_multiplier` e `care_quota_annual_revisions` são
   editáveis na tela admin e **ninguém os lê** — e já divergem do ENTITLEMENTS (2 vs 1).

| Tema | Decisão |
|---|---|
| Natureza do saldo mensal | Moeda fungível, não cota por serviço |
| Cota × pontos | Cota = incluso (preserva a revisão do Care); pontos = extra. **Consome a cota primeiro** |
| Modelagem | Derivada: só resgates viram linha (`bucket=MENSAL`); saldo = cota do tier − consumido no mês |
| Fonte da verdade dos knobs | ClubSettings sobrescreve, ENTITLEMENTS vira default. Resolver único, async |
| Crédito da venda | No registro, por valor. Curadoria credita a diferença **só para cima**, nunca estorna |
| Granularidade da regra | Categoria (`productType`) + override por produto. Precedência: produto > categoria > multiplicador |
| Resgate de serviço | Só registra (loja, serviço, pontos, R$ via `point_value_brl`). Acerto financeiro offline |
| Ator do audit log | Polimórfico `actorType`+`actorId`, seguindo o padrão do `Notification` |
| Corpo no audit log | **Não grava.** Só método, rota, ator, entidade, entityId, status HTTP |
| Score | Composto **decomponível** (score + métricas que o formam), pesos no ClubSettings |
| Execução | Branch `feat/011`, commit por step, parada de validação após o Step 2 |

Defaults assumidos sem consulta: o resolver só sobrescreve knobs com chave já existente
mais o novo `plus_monthly_points`; a regra de pontuação suporta `FIXO` e `POR_REAL`;
score sobre janela móvel de 90 dias; specs existentes estendidas, sem framework novo.

**Aviso pendente ao Adriano:** ele escolheu pontos sobre cota por serviço [14:45] sem
saber que `serviceAllowancePerYear` já existia e já era enforced. A escolha segue
defensável pela fungibilidade, mas foi tomada com informação incompleta.

**Risco concentrado:** `computeState` em `points.service.ts` é a fonte da verdade de todo
saldo do clube. Testes do bucket mensal antes de tocar na função.

**GATE do Step 4:** `plus_monthly_points` está em `1000` — valor ilustrativo escolhido
pelo dev (≈R$50 a R$0,05/ponto, cobrindo ~1 lavagem/mês), **não aprovado pelo Adriano**.
Enquanto o resgate não estiver ligado não há exposição. O Step 4 **não sobe para produção**
sem o Adriano confirmar o valor. Em staging pode.

### Ordem de execução

| | Step | Estado |
|---|---|---|
| 0 | Baseline das 22 migrations (`migrate resolve --applied`) | **DONE** |
| 2a | Resolver de settings (ClubSettings > ENTITLEMENTS); 9 call sites viram `await` | TODO |
| 2 | `bucket` no ledger + saldo mensal derivado + `computeState` | TODO → **parada de validação** |
| 3 | Venda → pontos + tabela de regra + ajuste na curadoria | TODO |
| 4 | Serviço resgatável por pontos | TODO |
| 5 | Ator polimórfico + interceptor global | TODO |
| 7 | Score por loja | TODO |

---

## Step 1 — Corrigir o menu lateral que some no catálogo de serviços

**Intent:** O item "Catálogo de Conveniências & Serviços" do portal da loja aponta para
`/admin/master-services`, que vive na árvore do `AdminLayout`. Navegar para lá troca o
layout inteiro e a sidebar da loja desaparece. Espelhar a rota dentro de `/loja` e
apontar o menu para ela.

**Arquivos:** `frontend/src/App.jsx`, `frontend/src/components/StoreLayout.jsx`
**Tags:** impl
**Aceite:** clicar no item mantém a sidebar da loja; a página continua acessível pelo
admin em `/admin/master-services`.

---

## Step 2 — Pontos: bucket mensal renovável + bucket acumulável

**Intent:** Hoje `PointsLedger` tem um único tipo de saldo (acumula, expira em 365 dias,
consumo FIFO). A reunião definiu **dois**: pontos mensais que renovam e **não acumulam**
(uso-ou-perde, exclusivo Plus, para bancar um serviço/mês tipo lavagem) e pontos
acumuláveis com validade prolongada (o atual). Adicionar `bucket` ao ledger, cron mensal
de concessão/zeragem para assinantes Plus, e ajustar o FIFO para consumir o bucket mensal
primeiro — senão o mensal vence sem uso enquanto o acumulável é gasto.

**Arquivos:** `backend/prisma/schema.prisma`, `backend/src/points/points.service.ts`,
`backend/src/points/points.service.spec.ts`
**Tags:** impl, db
**Risco:** mexe em `computeState`, que é a fonte da verdade do saldo. Cobertura de teste
antes de tocar é obrigatória.

---

## Step 3 — Sistemática de pontos por produto e serviço

**Intent:** "comprou uma roda a gente já sabe quantos pontos a gente vai dar" [13:09].
Hoje o crédito é `valor da compra × multiplicador do tier` — não há regra por item.
Criar tabela de regra de pontuação (pontos fixos ou por real, por produto e por
`MasterService`), com fallback para a regra atual quando não houver regra específica.

**Arquivos:** `backend/prisma/schema.prisma`, `backend/src/points/`, `backend/src/sales/`
**Tags:** impl, db
**Depende de:** Step 2 (o bucket precisa existir antes de decidir em qual creditar).

---

## Step 4 — Resgate de serviço com pontos

**Intent:** Adriano perguntou se o Plus dá direito a usar serviço de graça [11:41]; Murilo
confirmou que só tinha pensado em produto. Permitir que um `MasterService`/`StoreService`
seja resgatável por pontos, gerando `Voucher` como já acontece com `CatalogItem`, e que a
loja consiga baixar o voucher no atendimento.

**Arquivos:** `backend/prisma/schema.prisma`, `backend/src/rewards/`,
`frontend/src/pages/CustomerCatalogPage.jsx`, `frontend/src/pages/StoreWorkshopPage.jsx`
**Tags:** impl, db
**Depende de:** Step 2.

---

## Step 5 — Auditoria global por interceptor

**Intent:** "tudo que faz aqui da página foi gravado" [40:10]. O `AuditLog` existe mas é
chamado à mão em 7 módulos — qualquer módulo novo nasce sem auditoria. Trocar por um
interceptor NestJS global que registra toda mutação (POST/PATCH/PUT/DELETE) com ator,
rota, alvo e resultado, mantendo as chamadas manuais só onde há contexto de negócio extra.

**Arquivos:** `backend/src/common/`, `backend/src/app.module.ts`, `backend/src/audit-logs/`
**Tags:** impl, security
**Cuidado:** não logar corpo de requisição com senha, token ou PII bruta.

---

## Step 6 — Landing pages e campanhas

**Intent:** O maior bloco novo [27:30] [38:05]. Landing page por evento / linha / produto,
montada em blocos reutilizáveis, com URL pública compartilhável pelas lojas e logo da loja
no rodapé. Modelar `LandingPage` (slug, blocos em JSON, segmentação, publicação) + a
renderização pública. O padrão visual de referência ("Marina") ainda será enviado pelo
Adriano — modelar os blocos genéricos primeiro, o conteúdo entra depois.

**Arquivos:** `backend/prisma/schema.prisma`, `backend/src/` (módulo novo),
`frontend/src/pages/` (editor + página pública), `frontend/src/App.jsx`
**Tags:** design, impl, db
**Depende de:** insumo do Adriano (blocos/templates). A modelagem pode começar antes.

---

## Step 7 — Score de performance por loja

**Intent:** "eu também tô fazendo ele de score" [38:27] e indicadores de quem está
performando [41:00]. Derivar um score por loja a partir do que já está no banco (vendas
registradas, clientes cadastrados, conversão para Plus, serviços concluídos) e expor no
dashboard admin. Sem tabela nova — é agregação sobre dados existentes.

**Arquivos:** `backend/src/reports/reports.service.ts`, `frontend/src/pages/AdminDashboard.jsx`
**Tags:** impl

---

## Step 8 — Disparo de e-mail em massa (CRM)

**Intent:** Prioridade do Adriano por custo, acima do WhatsApp [44:55]. O `EmailService`
atual é nodemailer/SMTP transacional — não serve para campanha (sem template, sem
segmentação, sem descadastro, sem métrica). Adaptar para um provedor de envio em massa,
reaproveitando a segmentação que o broadcast de WhatsApp já implementa.

**Arquivos:** `backend/src/email/`, `backend/src/newsletter/`
**Tags:** impl
**BLOQUEADO:** aguarda o Adriano definir o provedor. Não iniciar antes.

---

## Ordem sugerida até 18/08

1. **Step 1** — 30 min, destrava a demo.
2. **Step 2 → 3 → 4** — o núcleo de pontos, que o Adriano marcou como pré-requisito do
   lançamento [24:08].
3. **Step 5** — barato e elimina uma classe inteira de dívida.
4. **Step 6** — começar a modelagem em paralelo, sem esperar o insumo.
5. **Steps 7 e 8** — pós-18/08, ou antes se o Step 8 destravar.

**Fora de escopo desta rodada:** gateway de pagamento (`PaymentMethod.GATEWAY` segue
reservado), integração de apólice com a Police [10:05], geração de banner/imagem por IA
[36:40].
