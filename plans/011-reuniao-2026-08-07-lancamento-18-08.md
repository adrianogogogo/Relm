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
| Alcance do ponto mensal | **Qualquer resgate**, não só serviço (Adriano, 10/08/2026). Todo débito passa por `redeemPoints`, que gasta o mensal antes do acumulável |
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

**GATE do `plus_monthly_points` (revisado 10/08/2026):** o valor virou editável na tela
`/admin/club-settings`, com o custo em R$ calculado ao lado do campo. Não depende mais de
confirmação do Adriano — quem tiver acesso admin calibra na hora, sem deploy.

Duas coisas mudaram o risco desde a formulação original do gate:

1. **A exposição antecipou.** O gate era do Step 4 porque, sem resgate de serviço, o ponto
   mensal não comprava nada. Depois da decisão de 10/08 (mensal vale para qualquer
   resgate), ele compra prêmio de catálogo — a exposição existe já, não no Step 4.
2. **O default continua `1000`.** `DEFAULT_SETTINGS` deriva de `ENTITLEMENTS[PLUS]`, então
   banco sem a linha `plus_monthly_points` resolve para 1000, não 0. Deploy sem ninguém
   abrir a tela = todo Plus com 1000 pontos/mês (≈R$50 a R$0,05/ponto) gastáveis em prêmio.

**Ação no deploy:** abrir `/admin/club-settings` e fixar o valor — `0` desliga. Para que o
recurso nasça desligado por padrão, trocar `monthlyPoints: 1000` por `0` em
`backend/src/common/entitlements.ts:93`; a escolha do `1000` foi do usuário em 10/08 e não
foi alterada por conta própria.

### Ordem de execução

| | Step | Estado |
|---|---|---|
| 0 | Baseline das 22 migrations (`migrate resolve --applied`) | **DONE** |
| 2a | Resolver de settings (ClubSettings > ENTITLEMENTS); 9 call sites viram `await` | **DONE** |
| 2 | `bucket` no ledger + saldo mensal derivado + `computeState` | **DONE** |
| 3 | Venda → pontos + tabela de regra + ajuste na curadoria + tela admin | **DONE** |
| 4 | Serviço resgatável por pontos | **DONE** |
| 5 | Ator polimórfico + interceptor global | **DONE** |
| 7 | Score por loja | **DONE** |

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

### Como ficou (implementado 10/08/2026)

Model `PointsRule` com alvo exclusivo — `productId` **ou** `productType`, ambos UNIQUE —
e modos `FIXO` (pontos por unidade) / `POR_REAL` (pontos por real do subtotal).
`pointsForSaleItem` resolve na ordem **produto > categoria > multiplicador do tier**; o
fallback é a conta que `addPurchasePoints` já fazia, então item sem regra não mudou de
comportamento. CRUD admin em `/v1/points/admin/rules`.

O crédito é ancorado no `referenceId` do ledger (= id do `SaleItem`), sem coluna nova.
`syncSaleItemPoints` recalcula o devido, soma o já creditado e lança **só a diferença
positiva** — é o que torna a curadoria um complemento e não um segundo crédito, e o que
faz reexecução ser no-op.

**Duas escolhas que precisam de ciente:**

1. **O crédito na venda é fora da transação e o erro é logado, não propagado.** Registrar
   a venda é o caminho crítico do balcão; falhar por causa do ledger seria pior. O preço:
   se o crédito falhar e o item nunca for curado, os pontos daquele item se perdem em
   silêncio (fica no log, com id da venda e do item). Se isso aparecer na prática, o
   conserto é uma fila, não uma transação.
2. **`removePointsRule` apaga de verdade.** Desativar mantinha a chave UNIQUE ocupada e
   bloqueava a criação da regra substituta. Para pausar sem perder, use `active: false`
   pelo PATCH.

**Tela admin (10/08/2026):** `/admin/points-rules` fecha a pendência — CRUD sobre
`/v1/points/admin/rules`, com o alvo escolhido por dropdown (produto do cadastro ou
categoria já existente em algum produto, nunca texto livre, senão a regra nasce com uma
categoria que nunca casa). O custo em R$ de cada regra aparece ao lado, usando o
`point_value_brl` do ClubSettings.

Duas escolhas da tela: o valor salva no `onBlur` (não a cada tecla), e o botão
**Ativa/Pausada** é o caminho recomendado — a lixeira apaga de verdade, porque
`productId`/`productType` são UNIQUE e uma regra só desativada seguiria bloqueando a
substituta.

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

### Como ficou (implementado 10/08/2026)

`AuditInterceptor` registrado como `APP_INTERCEPTOR` global: toda mutação
(POST/PUT/PATCH/DELETE) vira linha, inclusive as que falham — 401/403 são o rastro de
quem tentou o que não podia. `action` usa o **padrão** da rota (`PATCH
/v1/points/admin/rules/:id`), não a URL concreta: id embutido explodiria a cardinalidade
e quebraria o filtro por texto da tela.

Ator polimórfico `actorType`+`actorId` (`USER` | `STORE_USER` | `CUSTOMER` | `ANONIMO`),
padrão do `Notification`. `userId` continua existindo como FK do subconjunto USER — é o
que a tela usa para mostrar nome e papel; para lojista e cliente o e-mail vai no metadata,
que é o suficiente para identificação humana sem join impossível.

**O corpo não é lido em lugar nenhum** — há teste que serializa a linha e falha se a senha
do `req.body` aparecer. Metadata guarda só `{method, route, status, actorEmail?, storeId?}`.

**Duas ressalvas:**

1. **Log duplicado nos 7 módulos com chamada manual.** Mantido de propósito: o automático
   diz "quem chamou o quê", o manual diz "o que mudou" (transição de status, motivo).
2. **`store-jwt` aceita `User` com role LOJA**, e nesse caso o `actorId` aponta para
   `users.id` e não `store_users.id`. Distinguir exigiria mudar o payload do token; o
   e-mail no metadata cobre a identificação.

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

### Como ficou (implementado 10/08/2026)

`GET /reports/stores/score?days=90` devolve o ranking com **score, componentes e métricas
cruas**. Quatro dimensões: receita da janela (soma de `SaleItem.unitPrice × quantity`,
porque `Sale` não guarda total), clientes novos na janela, conversão Plus da base da loja
e serviços concluídos. Pesos default 40/20/25/15, sobrescritos por
`score_weight_revenue|customers|plus|services` no ClubSettings.

Duas propriedades que valem saber:

1. **O score é relativo, não uma meta.** Volume é normalizado pela melhor loja da janela —
   100 quer dizer "a melhor entre as ativas", não "bateu o alvo". Só a conversão Plus é
   absoluta, por já ser taxa. Com uma loja só, ela marca 100 nas três de volume.
2. **A escala é 0–100 independente da soma dos pesos**, e o score é a soma exata dos
   componentes exibidos — quem calibrar 10/10/10/10 não vê o teto cair para 40, e o número
   nunca discorda da barra empilhada do dashboard.

**Sem tela para os pesos:** eles moram no ClubSettings e hoje só mudam por SQL. A tela
`/admin/club-settings` não foi tocada — a calibragem só faz sentido depois de ver o
ranking com dados reais, e o Step 7 não a listava. Sobe junto se o ranking pedir ajuste.

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

---

## Steps 6 e 8 — como ficou (11/08/2026)

Decisões fechadas em duas rodadas de grilling e executadas nos commits `65f98c2`
(backend) e `7f16444` (frontend).

### O que mudou em relação ao que existia

| | Antes | Agora |
|---|---|---|
| Vocabulário de blocos | Dois (`HERO/FEATURES/PRICING/CTA_BANNER` no React, `hero/texto/lista/cta` órfão) | Um só: `hero`/`texto`/`lista`/`cta` + paleta, validado por `PAGINA_SCHEMA` |
| Landing pública | Rota React `/lp/:slug`, sem OG tags | HTML do backend, com `og:title`/`og:description`/`og:image` |
| Escolha de modelo | `<select>` chumbado no JSX, duplicado em duas telas | Configurações > Inteligência Artificial, lista servida pelo backend |
| Imagem | URL do DALL-E (expira ~1h) ou 6 links do Unsplash duplicados | Gerada pela OpenAI e **baixada** para `uploads/marketing/` |
| Tamanho da imagem | Fixo 512x512 | Vem do destino: landing horizontal, e-mail cabe em 600px |
| Envio de e-mail | Laço disparando `sendPasswordResetEmail` para a base inteira | **Removido.** Exporta HTML para a ferramenta de disparo |

### Por que o envio saiu de vez

O transporte é nodemailer sobre `smtp.gmail.com` — teto de ~500 destinatários/dia
e política que proíbe marketing em massa. É a **mesma conta** que manda
redefinição de senha e aprovação de loja. Não faltava só descadastro: nunca teve
como funcionar, e teria derrubado o transacional junto.

### O que a IA decide, de fato

Texto, quais blocos usar, em que ordem, e as 3 cores da paleta. Tipografia,
espaçamento e layout de cada bloco são CSS escrito à mão. É o que garante que
nenhuma página gerada saia quebrada no celular nem no Outlook.

Custo dessa escolha: cada tipo de bloco novo é escrito **duas vezes** — uma no
`landing-renderer` (CSS moderno) e uma no `email-renderer` (tabela, Outlook).

### Pendências que dependem do servidor, não de código

1. **Três migrations não aplicadas:** `20260810190000_add_audit_actor`,
   `20260810210000_add_marketing_and_email_crm`, `20260811120000_email_crm_sem_envio`.
   Sem a segunda, `marketing/` e `email-crm/` dão 500 em produção.
2. **Nginx:** `location /lp/ { proxy_pass ...; }` e `location /uploads/marketing/`
   apontando para o backend. Sem isso o link cai no SPA e a imagem dá 404.
3. **`PUBLIC_BASE_URL`** no `.env` do backend — sem ela o `og:image` e a imagem
   do e-mail saem com caminho relativo, que nenhum crawler nem cliente de e-mail
   resolve.
4. **`OPENAI_API_KEY`** no `.env` (decisão: não vai para o banco, tem cobrança
   atrelada).

### Não entregue

**Botão de trocar a imagem gerada por upload.** Não existe endpoint de upload
para `uploads/marketing/`. Enquanto isso, se a imagem sair errada (bike com
geometria impossível é o risco conhecido), a saída é regerar. É o único item do
escopo acordado que ficou de fora.
