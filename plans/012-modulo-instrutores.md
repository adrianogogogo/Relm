# Plan 012: Módulo de Instrutores — credenciamento com desconto por tier

> **Instruções ao executor**: Siga este plano passo a passo. Rode **todos** os
> comandos de verificação e confirme o resultado esperado antes de avançar. Se
> qualquer item de "Condições de PARADA" ocorrer, pare e reporte — não improvise.
> Pule qualquer atualização de `plans/README.md` — o revisor mantém o índice.
>
> **Drift check (rode primeiro)**:
> `git diff --stat eace166..HEAD -- backend/prisma/schema.prisma backend/src/auth backend/src/rewards backend/src/partners frontend/src/components/CustomerLayout.jsx`
> Divergência com os trechos de "Estado atual" = PARADA.

## Status

- **Prioridade**: P1 (alavanca de conversão do Plus; não corrige bug)
- **Esforço**: L — model novo + N:N + role/login novos + 3 superfícies de tela
- **Risco**: MED — mexe no `UserRole`, no `Voucher` e cria uma role nova que passa
  pelos guards existentes
- **Depende de**: nenhum
- **Categoria**: feature
- **Planejado em**: commit `eace166`, 2026-08-17
- **Decidido em**: sessão de grilling 2026-08-17 (19 decisões, todas travadas abaixo)

## Por que isso importa

O objetivo do módulo **não** é vender o serviço do instrutor: é dar ao Plus um
benefício que se enxerga com número na tela, e dar ao instrutor exposição na base
Relm. Rodrigo recusou explicitamente **repasse e comissão** — a Relm não
intermedia pagamento, não fatura, não fica no meio da transação.

O que faz o módulo funcionar de verdade é uma coisa só: **o contato do instrutor
só aparece depois que o cliente gera a credencial**. Sem isso, o cliente liga
direto, o desconto é combinado por fora, ninguém mede nada, e a credencial (e o
login do instrutor, e o painel) viram código morto.

## O que este plano NÃO é

Três coisas do entendimento inicial foram derrubadas na sessão de decisão. Se
você "corrigir" alguma delas de volta, está errando de propósito:

| Entendimento inicial | Decisão final |
|---|---|
| Área exclusiva de assinantes Plus | **Visível a todos** os clientes; Care e Plus com descontos **diferentes** |
| Campos `valor normal` e `valor com desconto Plus` | **Nenhum campo de preço.** Dois textos de benefício (todos / Plus) |
| Esboço primeiro, regra depois | Onda completa de uma vez (decisão 19) |

Motivo do "sem campo de preço": a Relm não controla o preço do instrutor, não tem
contrato com ele, e "valor" de assessoria não é um número (mensalidade, plano,
avulso, pacote). Preço desatualizado na tela vira reclamação contra a Relm numa
transação onde ela não ganha nada. Percentual em texto sobrevive a reajuste.

## Decisões travadas

1. **Model `Instructor` próprio** (não é categoria de `Partner`), com item próprio
   no menu lateral do cliente. Instrutor **não** aparece em `/cliente/parcerias`.
2. Dois benefícios em texto: `benefit` (vale pra todos) + `benefitPlus`.
3. Card de atalho no `CustomerDashboard` apontando pra `/cliente/instrutores`.
4. Localização: `city` + `state` (UF) estruturados + flag `remote` (atende online).
   O filtro pré-seleciona a UF do cliente quando `Customer.state` existe.
5. Especialidades: tabela `InstructorSpecialty` + CRUD admin + relação N:N.
6. **Contato revelado só após gerar a credencial.** Na listagem, `phone` e `link`
   não saem do backend — nem escondidos no JSON.
7. Credencial **gratuita** (não toca em pontos), **1 ativa por (cliente, instrutor)**,
   reaproveitando o model `Voucher` com FK nova `instructorId`. **Nunca vira `USED`**
   — é vínculo, não cupom.
8. Instrutor loga: role `INSTRUTOR` no `User` existente + `User.instructorId`,
   pelo `/auth/login` que já existe. **Sem** quarta superfície de autenticação.
9. Painel do instrutor: nome do cliente + tier + status atual, **CPF/telefone
   mascarados** por `common/utils/mask.ts` — mesma regra de `LOJA`/`DISTRIBUIDOR`
   (plano 002). Mais o contador de clientes vinculados.
10. **Só a Relm cadastra e edita** instrutor (`ADMIN_RELM`, `GERENTE_RELM`). O
    instrutor loga apenas para consultar credenciais — não edita o próprio perfil.
11. Termo de aceite no primeiro login (`termsAcceptedAt`) + disclaimer de
    responsabilidade na tela do cliente.
12. Sem comissão, sem repasse, sem custo em pontos. **A loja não participa** deste
    módulo em nenhum ponto.

### Defaults assumidos (aprovados)

- **Validade da credencial**: Plus → `Subscription.expiresAt`. Care → `now + 12 meses`
  (o tier CARE tem `expiresAt` nulo por definição do schema, e `Voucher.expiresAt`
  é obrigatório).
- **Contato**: `phone` (WhatsApp/telefone) **obrigatório**; `link` (site/Instagram)
  opcional.

## Estado atual

O que já existe e **deve** ser reaproveitado — não reimplemente nada disto:

- `backend/prisma/schema.prisma:193` — `enum UserRole { ADMIN_RELM, GERENTE_RELM,
  SUPORTE_RELM, LOJA, DISTRIBUIDOR, CLIENTE }`. Falta `INSTRUTOR`.
- `backend/prisma/schema.prisma:1190` — `model Voucher`: aponta hoje para
  `catalogItemId` **ou** `storeServiceId`, tem `code` único, `status`
  (`UNUSED`/`USED`), `expiresAt` **não-nulo**, `pointsSpent`/`brlValue` nulláveis.
- `backend/src/rewards/rewards.service.ts:436` — `useVoucher(code, requester)` exige
  requester autenticado (`LOJA` só do próprio serviço, ou time Relm). **Não é usado
  por este plano** — a credencial de instrutor nunca é baixada.
- `backend/src/auth/auth.service.ts:22` — login contra `User`; payload
  `{ sub, email, role }`.
- `backend/src/auth/jwt.strategy.ts:16` — rejeita qualquer payload com `type`
  (tokens de cliente/loja). Token de instrutor entra por aqui sem alteração.
- **`jwt.strategy` não devolve `instructorId`** — mesmo caso do `storeId` do `LOJA`
  (ver plano 010): o service precisa buscar no banco a partir do `userId`.
  Exemplar: `backend/src/sales/sales.service.ts`, `findAll`.
- `backend/src/common/utils/mask.ts` — mascaramento de CPF/telefone (plano 002).
- `backend/src/common/entitlements.ts:13` — `tierAtLeast(customerTier, requiredTier)`.
  **Fonte única de comparação de tier — não escreva `=== 'PLUS'` solto.**
- `backend/prisma/schema.prisma:25-29` — `Customer` tem `city`, `state`, `zipCode`
  (todos nulláveis). Usados só para pré-selecionar o filtro.
- `String[]` já é usado no schema (`schema.prisma:136` `aliases`) — mas **não** use
  array aqui: especialidade é tabela (decisão 5).
- `frontend/src/components/CustomerLayout.jsx:26` — `MENU` do cliente, 12 itens hoje.
- `frontend/src/pages/AdminPartnersPage.jsx` — **exemplar de form/tabela admin** a
  copiar. `frontend/src/pages/CustomerPartnersPage.jsx` — exemplar de card/filtro
  do cliente (mas **sem** o blur: aqui nada é escondido por tier).
- `frontend/src/services/api.js:383` — padrão `partnersAPI` a espelhar.

### Convenções
- Comentários, labels e mensagens de erro em **português**.
- `PrismaService` injetado; `// ponytail:` para simplificações deliberadas.
- Nunca aceitar filtro de tenant vindo do cliente: `instructorId` do painel sai do
  token → banco, jamais de query param (regra geral do plano 010).

## Comandos

Rodam de `backend/` (backend) e `frontend/` (front). `npm run lint` está quebrado
no repo inteiro (não existe config de ESLint) — **pré-existente, ignore**.

| Objetivo | Comando | Sucesso |
|---|---|---|
| Migration | `npx prisma migrate dev --name instructors` | migration criada |
| Build backend | `npm run build` | exit 0 |
| Testes backend | `npm test` | todos passam |
| Build frontend | `npm run build` | exit 0 |

## Escopo

**Em escopo:**
- `backend/prisma/schema.prisma` — `Instructor`, `InstructorSpecialty`, N:N,
  `UserRole.INSTRUTOR`, `User.instructorId`, `Voucher.instructorId`
- `backend/src/instructors/` (novo módulo completo + spec)
- `backend/src/app.module.ts` (registrar o módulo)
- `frontend/src/pages/CustomerInstructorsPage.jsx` (nova)
- `frontend/src/pages/AdminInstructorsPage.jsx` (nova, com aba/modal de especialidades)
- `frontend/src/pages/InstructorCredentialsPage.jsx` + `InstructorTermsPage.jsx` (novas)
- `frontend/src/components/InstructorLayout.jsx` (novo)
- `frontend/src/components/CustomerLayout.jsx` (1 item no `MENU`)
- `frontend/src/components/AdminLayout.jsx` (1 item no menu)
- `frontend/src/pages/CustomerDashboard.jsx` (1 card de atalho)
- `frontend/src/App.jsx` (rotas) e `frontend/src/services/api.js` (`instructorsAPI`)

**Fora de escopo** (não toque):
- `backend/src/partners/**` e as duas telas de Parcerias. Tentador reaproveitar o
  `Partner`; a decisão 1 é model próprio. Não mexa lá.
- `useVoucher` / baixa de voucher (`rewards.service.ts:436`). A credencial de
  instrutor **nunca** vira `USED`. Não altere o método nem seus guards.
- `pointsService` e qualquer coisa de pontos — credencial é grátis (decisão 7).
- `store-auth`, `customer-auth`, `StoreUser` — a loja não participa (decisão 12).
- Repasse, comissão, split, fatura, cobrança — **não existe** neste módulo.
- Campos de preço em qualquer forma (`price`, `priceFrom`, `pricePlus`, `Decimal`).

## Git workflow
- Branch nova a partir do `HEAD`: `feat/012-instrutores`.
- Commits atômicos por passo, mensagem em português, prefixo `feat(instrutores):`.
- Ao concluir a onda: commit + push (padrão do projeto).

## Passos

### Passo 1: Schema

```prisma
enum UserRole { ...existentes, INSTRUTOR }

model InstructorSpecialty {
  id          String       @id @default(uuid())
  name        String       @unique
  active      Boolean      @default(true)
  instructors Instructor[]
  @@map("instructor_specialties")
}

model Instructor {
  id              String    @id @default(uuid())
  name            String
  description     String?   @db.Text
  benefit         String                         // desconto válido para todos
  benefitPlus     String?   @map("benefit_plus") // desconto adicional do Plus
  phone           String                         // obrigatório — só sai após credencial
  link            String?
  logoUrl         String?   @map("logo_url")
  city            String?
  state           String?                        // UF
  remote          Boolean   @default(false)      // atende online
  active          Boolean   @default(true)
  termsAcceptedAt DateTime? @map("terms_accepted_at")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  specialties InstructorSpecialty[]
  users       User[]
  vouchers    Voucher[]

  @@index([active, state])
  @@map("instructors")
}
```

Em `User`: `instructorId String? @map("instructor_id")` + relação (espelha
`storeId`). Em `Voucher`: `instructorId String? @map("instructor_id")` + relação +
`@@index([instructorId])`.

N:N **implícito** do Prisma (sem model de junção escrito à mão) — ponytail: a join
table não tem coluna própria pra carregar.

Verificação: `npx prisma migrate dev --name instructors` cria a migration e
`npx prisma generate` passa.

### Passo 2: `instructors.service.ts` — leitura do cliente

`findForCustomer(customerId, filters { state?, specialtyId?, remote? })`:
- `where: { active: true }`, filtro por `state` e/ou `remote: true`,
  `specialties: { some: { id } }`
- `select` **sem `phone` e sem `link`** (decisão 6 — não é para o front esconder,
  é para o backend não enviar)
- devolve `benefit`, `benefitPlus`, `specialties`, cidade/UF, `remote`, `logoUrl`
- devolve também o `tier` do cliente (via `Customer.currentTier`) para a tela
  destacar qual das duas linhas é a dele — comparação por `tierAtLeast`, nunca
  `=== 'PLUS'`

### Passo 3: `createCredential(customerId, instructorId)`

1. Instrutor precisa existir e estar `active` — senão `NotFoundException`.
2. Procura vínculo ativo: `voucher` com esse `customerId` + `instructorId`,
   `status = UNUSED`, `expiresAt > now`. **Se existir, devolve o existente** (não
   cria segundo — decisão 7). Idempotente por natureza.
3. Se não existir, cria com:
   - `code` único (mesmo gerador já usado no `rewards.service`)
   - `status: UNUSED` — e **nada** no código deste plano muda esse status
   - `expiresAt`: Plus → `Subscription.expiresAt`; Care → `now + 12 meses`
   - `pointsSpent: null`, `brlValue: null` (grátis)
4. Resposta: `{ code, expiresAt, tier, benefit, benefitPlus, contact: { phone, link } }`
   — **este é o único endpoint que devolve contato.**
5. `AuditLog` da criação, no padrão do `rewards.service`.

`findMyCredentials(customerId)` — o cliente precisa rever o código depois.

### Passo 4: Painel do instrutor

`resolveInstructorId(userId)`: busca `User.instructorId` no banco (o token não
traz — ver "Estado atual"). Sem `instructorId` → `BadRequestException`
("Usuário instrutor sem instrutor vinculado", espelhando `useVoucher`).

- `acceptTerms(userId)` → grava `termsAcceptedAt` no `Instructor`.
- **Gate**: enquanto `termsAcceptedAt` for nulo, os endpoints de credencial
  respondem `403` com código identificável, e o front redireciona pro aceite.
- `listCredentials(userId)` → vínculos **do próprio instrutor**, com: nome do
  cliente, **tier e status calculados AGORA** (do `Customer.currentTier` +
  `Subscription`, não do voucher congelado — é isso que pega o cliente que
  cancelou), `code`, `expiresAt`, telefone/CPF **mascarados** por `mask.ts`.
- `checkCredential(userId, code)` → consulta pontual do mesmo dado. Se o code for
  de outro instrutor → `ForbiddenException` (escopo, regra do plano 010).

### Passo 5: Controller + guards

- Cliente (guard de cliente, padrão dos controllers de `/cliente`):
  `GET /instructors/for-customer`, `POST /instructors/:id/credential`,
  `GET /instructors/credentials`
- Admin (`@Roles('ADMIN_RELM','GERENTE_RELM')` — decisão 10):
  CRUD `/instructors` e CRUD `/instructor-specialties`
- Instrutor (`@Roles('INSTRUTOR')`): `POST /instructors/me/accept-terms`,
  `GET /instructors/me/credentials`, `GET /instructors/me/credentials/:code`

Registrar `InstructorsModule` em `app.module.ts`.

### Passo 6: Testes (`instructors.service.spec.ts`)

Mínimo — cada um trava uma decisão desta lista:
1. `findForCustomer` **não** devolve `phone` nem `link`.
2. `createCredential` chamado 2x devolve o **mesmo** `code`.
3. `expiresAt` = `Subscription.expiresAt` para Plus; `now+12m` para Care.
4. Credencial nasce e permanece `UNUSED`; nada no fluxo grava `USED`.
5. Painel do instrutor devolve telefone/CPF **mascarados**.
6. Instrutor A recebe `Forbidden` ao consultar `code` de vínculo do instrutor B.
7. `termsAcceptedAt` nulo → `403` nos endpoints de credencial.
8. Nenhuma chamada a `pointsService` no fluxo de credencial.

### Passo 7: Tela do cliente

`CustomerInstructorsPage.jsx` em `/cliente/instrutores`, copiando a estrutura de
`CustomerPartnersPage.jsx` — **sem o blur/lock**, porque aqui ninguém é bloqueado:

- Filtros: UF (pré-selecionada por `Customer.state` quando existir), especialidade,
  toggle "atende online". Vazio na UF do cliente **não pode** virar tela vazia: se
  não houver presencial na UF, mostrar os remotos com um aviso.
- Card: nome, logo, cidade/UF ou selo "Online", especialidades, e **duas linhas de
  desconto** — `Todos: <benefit>` / `Plus: <benefitPlus>`, com a linha do tier do
  cliente destacada e a outra visível (o Care **vê** o que está perdendo — é o
  argumento de venda, com link pra `/cliente/assinatura`).
- Botão **"Quero esse desconto"** → modal com o código, validade, o contato
  (WhatsApp/link) e o **disclaimer**: profissionais independentes; contratação,
  pagamento e execução são de responsabilidade exclusiva do profissional.
- Item no `MENU` de `CustomerLayout.jsx` e card de atalho no `CustomerDashboard`.

### Passo 8: Telas admin e do instrutor

- `AdminInstructorsPage.jsx` — tabela + form no padrão `AdminPartnersPage.jsx`,
  com multi-select de especialidades e uma aba/modal para o CRUD de
  `InstructorSpecialty` (ponytail: não gaste um item de menu com 8 registros).
- `InstructorLayout.jsx` + `InstructorCredentialsPage.jsx` + `InstructorTermsPage.jsx`
  em `/instrutor/*`, usando o login `/auth/login` existente com redirect por role.
  Primeiro acesso com `termsAcceptedAt` nulo cai no aceite e não sai de lá.

## Critérios de conclusão

- [ ] `cd backend && npm run build` → exit 0
- [ ] `cd backend && npm test` → todos passam, incluindo os 8 novos
- [ ] `cd frontend && npm run build` → exit 0
- [ ] `grep -rniE "price|preco|valor" backend/src/instructors` → **nenhum campo de preço**
- [ ] `grep -rn "pointsService" backend/src/instructors` → **zero ocorrências**
- [ ] `grep -rn "VoucherStatus.USED" backend/src/instructors` → **zero ocorrências**
- [ ] `grep -rnE "=== '?\"?PLUS" backend/src/instructors` → **zero** (usar `tierAtLeast`)
- [ ] `grep -n "phone" backend/src/instructors/instructors.service.ts` → só no
      `createCredential`/painel, **nunca** no `findForCustomer`
- [ ] `git status --short` → nada em `backend/src/partners/` nem em `backend/src/rewards/`
- [ ] Fluxo manual: cliente Care e cliente Plus veem o mesmo instrutor com
      descontos diferentes; contato só aparece após "Quero esse desconto"

## Condições de PARADA

- Você concluir que precisa alterar `useVoucher` ou qualquer guard de
  `rewards.controller.ts`. Pare — a credencial não é baixada por ninguém.
- Você concluir que precisa de campo de preço para a tela fazer sentido. Pare e
  reporte: a decisão 2 é explícita e foi tomada com o motivo registrado.
- Você concluir que precisa de um quarto módulo de autenticação
  (`instructor-auth`). Pare — decisão 8 é role no `User`.
- Alguém já ter adicionado `INSTRUTOR` ao `UserRole` no código vivo. Pare e reporte.
- `npm test` quebrar em suíte **não relacionada** a instrutores.
- Precisar expor telefone/CPF **não mascarado** do cliente ao instrutor. Pare —
  contraria o plano 002 (LGPD) para uma role externa nova.

## Notas de manutenção

- **O `Voucher` passa a ter três alvos possíveis** (`catalogItemId`,
  `storeServiceId`, `instructorId`) e dois ciclos de vida diferentes: cupom
  queimável (catálogo/serviço) e vínculo permanente (instrutor). Se aparecer um
  quarto alvo, é hora de separar o model — não de somar um quarto FK nulável.
- **Menu do cliente chega a 13 itens** com `Vantagens`, `Parcerias Exclusivas` e
  `Instrutores` disputando o mesmo espaço mental. Sobreposição pré-existente
  (`Vantagens` × `Parcerias`), agravada aqui. Vale uma consolidação de navegação
  em plano próprio.
- **Nome duplicado de especialidade** ("Triatlo" × "Triathlon") é impedido pelo
  `@unique` em `InstructorSpecialty.name`, mas a normalização (case/acento) não
  está — se virar problema, normalizar na criação.
- **O login do instrutor só é exercitado quando existir instrutor real cadastrado.**
  Foi decisão explícita entregar tudo junto (decisão 19) em vez de fatiar; se o
  formato mudar após o Rodrigo ver, o painel e a role são o que se perde.
