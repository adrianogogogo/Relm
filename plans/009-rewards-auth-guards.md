# Plan 009: Fechar o `RewardsController` — resgate, catálogo de prêmios e vouchers estão abertos sem autenticação

> **Instruções ao executor**: Siga este plano passo a passo. Rode **todos** os
> comandos de verificação e confirme o resultado esperado antes de avançar. Se
> qualquer item de "Condições de PARADA" ocorrer, pare e reporte — não improvise.
>
> **Drift check (rode primeiro)**:
> `git diff --stat bc6d86d..HEAD -- backend/src/rewards frontend/src/pages/CustomerCatalogPage.jsx`
> Divergência com os trechos de "Estado atual" = PARADA.

## Status

- **Prioridade**: P0 (vulnerabilidade explorável em produção agora)
- **Esforço**: S
- **Risco**: MED — errar aqui derruba o resgate de prêmios do cliente em produção
- **Depende de**: nenhum. **Independente dos planos 006–008** — deve ir para uma
  branch própria, para poder ser mergeada sozinha e rápido.
- **Categoria**: security
- **Planejado em**: commit `bc6d86d`, 2026-07-22

## Por que isso importa

`backend/src/rewards/rewards.controller.ts` **não tem `@UseGuards` na classe**, e
o único guard global registrado é o `ThrottlerGuard`
(`backend/src/app.module.ts:88-92` — o comentário na l.88 diz explicitamente
"não há outro APP_GUARD global registrado"). Das 10 rotas do controller, **9
estão acessíveis sem nenhum login**. Só `POST vouchers/manual` (l.79-81) foi
protegida.

O que qualquer pessoa na internet consegue fazer hoje, sabendo a URL:

| Rota | Linha | Impacto |
|---|---|---|
| `POST /v1/rewards/redeem` | 14 | Recebe `customerId` **no body** — queima os pontos de qualquer cliente, gerando voucher |
| `POST /v1/rewards/catalog` | 27 | Cria prêmio |
| `PATCH /v1/rewards/catalog/:id` | 45 | Altera preço em pontos / estoque de qualquer prêmio |
| `DELETE /v1/rewards/catalog/:id` | 67 | Inativa prêmio |
| `GET /v1/rewards/vouchers` | 73 | Lista **todos** os vouchers de todos os clientes |
| `PATCH /v1/rewards/vouchers/:code/use` | 98 | Queima voucher alheio |
| `GET /v1/rewards/vouchers/:customerId` | 104 | Vaza vouchers de qualquer cliente (IDOR) |
| `POST /v1/rewards/seed` | 110 | Repopula o catálogo |

Quando este plano fechar, cada rota exigirá o token certo, e as rotas do cliente
derivarão o `customerId` **do token**, não do body/URL — o que fecha o IDOR
junto.

## Estado atual

### Por que o guard admin sozinho quebraria produção

`backend/src/auth/jwt.strategy.ts:16-24` **rejeita tokens de cliente**:

```ts
  async validate(payload: any) {
    // Defesa em profundidade: tokens de cliente (type: 'CUSTOMER') e de loja
    // (type: 'STORE') nunca devem ser aceitos numa rota admin.
    if (payload.type) {
      throw new UnauthorizedException();
    }
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
```

E o portal do cliente **usa** três dessas rotas
(`frontend/src/pages/CustomerCatalogPage.jsx:36,42,48`):

```jsx
    queryFn: () => rewardsAPI.getCatalog(user?.currentTier),   // l.36
    queryFn: () => rewardsAPI.getVouchers(user?.id),           // l.42
    mutationFn: rewardsAPI.redeem,                             // l.48
```

Logo, `@UseGuards(JwtAuthGuard)` na classe inteira **derrubaria o resgate**.

O guard certo para o cliente já existe —
`backend/src/customer-auth/customer-jwt.guard.ts`:

```ts
@Injectable()
export class CustomerJwtGuard extends AuthGuard('customer-jwt') {}
```

e sua strategy (`backend/src/customer-auth/customer-jwt.strategy.ts:17-20`)
entrega `customerId`:

```ts
    if (payload.type !== 'CUSTOMER') {
      throw new UnauthorizedException();
    }
    return { customerId: payload.sub, email: payload.email, type: 'CUSTOMER' };
```

Exemplar de uso: `backend/src/points/points.controller.ts:8,17` — guard na
classe, e o service recebe `req.user.customerId`.

### Quem chama cada rota (levantado por grep, use como verdade)

`frontend/src/services/api.js:323-333` define `rewardsAPI`. Os chamadores:

| Método | Chamado em | Papel |
|---|---|---|
| `getCatalog` | `CustomerCatalogPage.jsx:36` **e** `AdminCatalogPage.jsx:31`, `AdminVouchersPage.jsx:33` | cliente **e** admin |
| `getVouchers(customerId)` | `CustomerCatalogPage.jsx:42` | só cliente |
| `redeem` | `CustomerCatalogPage.jsx:48` | só cliente |
| `createCatalogItem` / `updateCatalogItem` / `deleteCatalogItem` / `seedCatalog` | `AdminCatalogPage.jsx:64,76,88` | só admin |
| `getAllVouchers` / `useVoucher` | `AdminVouchersPage.jsx:110,115` | só admin |
| `createManualVoucher` | `AdminVouchersPage.jsx:85` | só admin (já protegido) |

`getCatalog` é o único consumido pelos dois lados — por isso permanece público
(ver Passo 1).

### Convenções
- Mensagens de erro em português; comentários em português.
- `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)` para rotas admin.
- Papéis: `ADMIN_RELM`, `GERENTE_RELM`, `SUPORTE_RELM`, `LOJA`, `DISTRIBUIDOR`, `CLIENTE`.
- Simplificações deliberadas levam `// ponytail:`.

## Comandos

Rodam de `backend/`. NOTA: `npm run lint` do backend está quebrado no repo
inteiro (não existe arquivo de config do ESLint) — **pré-existente, ignore, não
tente consertar**. Não existe `.env` no worktree: forneça `DATABASE_URL` inline
por comando (qualquer string de conexão válida serve; nenhum comando conecta de
fato ao banco).

| Objetivo | Comando | Sucesso |
|---|---|---|
| Build | `npm run build` | exit 0 |
| Testes | `npm test` | todos passam |

## Escopo

**Em escopo:**
- `backend/src/rewards/rewards.controller.ts`
- `backend/src/rewards/rewards.service.ts` — **somente se** a assinatura de
  `redeemReward` / `getVouchers` precisar mudar. Prefira não mexer.
- `backend/src/rewards/rewards.service.spec.ts` (adicionar testes)

**Fora de escopo** (não toque):
- **Todo o `frontend/`.** Este plano é desenhado para **zero mudanças no
  frontend**: as rotas do cliente continuam aceitando o mesmo body e a mesma
  URL de hoje, apenas ignorando o `customerId` que vem neles. Se você concluir
  que precisa editar o frontend, **PARE** — significa que o desenho está errado.
- `backend/src/auth/jwt.strategy.ts` e `backend/src/customer-auth/**` — os
  guards já existem e funcionam; use-os, não os altere.
- `backend/src/app.module.ts` — não registre guard global. Trocar o
  `ThrottlerGuard` global ou somar outro `APP_GUARD` afeta o app inteiro.
- Qualquer outro controller.

## Git workflow

- **Branch nova a partir de `bc6d86d`**: `advisor/009-rewards-guards`.
  Não construa em cima da branch dos planos 006–008 — este fix precisa poder ser
  mergeado sozinho, antes deles.
- Commit: `fix: exige autenticacao nas rotas de premios e vouchers`
- Não faça push nem abra PR.

## Passos

### Passo 1: Aplicar os guards rota a rota

Em `backend/src/rewards/rewards.controller.ts`, **sem** adicionar guard na
classe (as rotas têm públicos diferentes), aplique:

**A. Rotas do cliente** — `@UseGuards(CustomerJwtGuard)`, importando
`import { CustomerJwtGuard } from '../customer-auth/customer-jwt.guard';`

- `POST redeem` (l.14): o `customerId` passa a vir de `req.user.customerId`.
  Adicione `@Request() req: any` e **ignore `dto.customerId`**:
  ```ts
  // customerId vem do token, nunca do body — senão qualquer um resgata em nome
  // de qualquer cliente. dto.customerId é aceito e descartado por compatibilidade
  // com o frontend atual.
  return this.rewardsService.redeemReward({
    customerId: req.user.customerId,
    catalogItemId: dto.catalogItemId,
  });
  ```
- `GET vouchers/:customerId` (l.104): idem — mantenha o `:customerId` na rota
  (o frontend monta a URL com ele), mas **use `req.user.customerId`**:
  ```ts
  // O :customerId da URL é ignorado — o cliente só enxerga os próprios vouchers.
  // ponytail: parâmetro mantido na rota só para não quebrar o frontend atual.
  return this.rewardsService.getVouchers(req.user.customerId);
  ```

**B. Rotas admin** — `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)`
(ambos já importados no arquivo):

| Rota | Linha | `@Roles` |
|---|---|---|
| `POST catalog` | 27 | `ADMIN_RELM`, `GERENTE_RELM` |
| `PATCH catalog/:id` | 45 | `ADMIN_RELM`, `GERENTE_RELM` |
| `DELETE catalog/:id` | 67 | `ADMIN_RELM`, `GERENTE_RELM` |
| `POST seed` | 110 | `ADMIN_RELM` |
| `GET vouchers` | 73 | `ADMIN_RELM`, `GERENTE_RELM`, `SUPORTE_RELM` |
| `PATCH vouchers/:code/use` | 98 | `ADMIN_RELM`, `GERENTE_RELM`, `SUPORTE_RELM` |

**C. `GET catalog` (l.21) fica público, sem guard.** É a única rota consumida
pelo portal do cliente **e** pelas telas de admin, que usam tokens de tipos
incompatíveis; e o conteúdo é catálogo de prêmios — sem PII, sem escrita.
Registre isso no código, acima da rota:
```ts
// ponytail: catálogo permanece público — é lido pelo portal do cliente e pelo
// admin, que usam tokens de tipos diferentes. Sem PII e somente leitura.
// Se um dia precisar fechar, exigirá um guard que aceite ambos os tipos.
```

**D. Ordem das rotas — atenção.** `GET vouchers` (l.73) e
`GET vouchers/:customerId` (l.104) coexistem; `POST vouchers/manual` (l.79)
precisa continuar **antes** de qualquer `vouchers/:param`. **Não reordene
nada** — a ordem atual já está correta. Só adicione decorators.

**Verificar**:
- `npm run build` → exit 0
- `grep -c "@UseGuards" src/rewards/rewards.controller.ts` → **9**
  (8 novas + a de `vouchers/manual` que já existia)
- `grep -n "dto.customerId" src/rewards/rewards.controller.ts` → **0 ocorrências**
  (o body não pode mais decidir de quem são os pontos)

### Passo 2: Testes

Adicione a `backend/src/rewards/rewards.service.spec.ts` (o arquivo já existe —
siga a estrutura dele; **leia antes de escrever**).

O alvo aqui é o controller, não o service, então instancie o controller
diretamente com um `RewardsService` mockado (`{ redeemReward: jest.fn(), getVouchers: jest.fn() }`)
e chame os métodos passando um `req` falso:

1. `redeemReward` usa o `customerId` do token, **não** o do body: chame o método
   do controller com `req = { user: { customerId: 'cli-token' } }` e
   `dto = { customerId: 'cli-VITIMA', catalogItemId: 'item1' }`; espere que o
   service tenha sido chamado com `customerId: 'cli-token'`.
2. `getVouchers` ignora o `:customerId` da URL: chame com param
   `'cli-VITIMA'` e `req.user.customerId = 'cli-token'`; espere a chamada ao
   service com `'cli-token'`.

Estes dois testes são o coração do plano — eles travam o IDOR. Se algum passar
com a implementação **antiga**, o teste está errado.

**Verificar**: `npm test -- rewards` → passa, com 2 testes novos.

### Passo 3: Conferir que nenhuma rota ficou descoberta

**Verificar** (leitura manual, reporte o resultado): abra o arquivo e liste as
10 rotas com o guard de cada uma. O resultado esperado:
- 1 pública (`GET catalog`, com o comentário justificando)
- 2 com `CustomerJwtGuard` (`redeem`, `vouchers/:customerId`)
- 7 com `JwtAuthGuard + RolesGuard` (as 6 da tabela B + `vouchers/manual`)

Total: 10. Se a soma não fechar, alguma rota ficou descoberta.

## Critérios de conclusão

- [ ] `cd backend && npm run build` → exit 0
- [ ] `cd backend && npm test` → todos passam, incluindo os 2 novos
- [ ] `grep -c "@UseGuards" backend/src/rewards/rewards.controller.ts` → 9
- [ ] `grep -n "dto.customerId" backend/src/rewards/rewards.controller.ts` → 0 ocorrências
- [ ] `git status --short` → nenhum arquivo em `frontend/`
- [ ] `git diff --stat` → no máximo 3 arquivos, todos em `backend/src/rewards/`
- [ ] a contagem 1 + 2 + 7 = 10 do Passo 3 confere

## Condições de PARADA

- Você concluir que precisa alterar **qualquer** arquivo do `frontend/` — o
  desenho deste plano é "backend-only, frontend não percebe". Pare e reporte.
- `CustomerJwtGuard` ou `customer-jwt.strategy.ts` não existirem, ou a strategy
  não devolver `customerId`. Pare e reporte.
- Você descobrir **outro** chamador de qualquer rota de rewards além dos
  listados em "Quem chama cada rota" (rode
  `grep -rn "v1/rewards" frontend/src backend/src` para confirmar antes de
  começar). Um chamador não previsto muda a matriz de papéis. Pare e reporte.
- `redeemReward` no service já derivar o `customerId` de outra fonte, tornando a
  mudança redundante. Pare e reporte.
- `npm test` quebrar em suíte **não relacionada** a rewards após sua mudança.

## Notas de manutenção

- **Rotas do cliente ignoram `customerId` de body/URL de propósito.** Estão
  marcadas com `ponytail:`. Se um dia o admin precisar resgatar em nome de um
  cliente, isso é uma rota **separada** com guard admin — não relaxe estas.
- `GET /v1/rewards/catalog` segue público. Se o requisito mudar, será preciso um
  guard que aceite token de admin **ou** de cliente; não existe hoje no repo.
- **Este controller era o único sem guard de classe.** Vale uma varredura
  `grep -L "UseGuards" backend/src/**/*.controller.ts` num plano futuro para ver
  se há outros — fora do escopo deste.
- Um reviewer deve olhar: (a) que `req.user.customerId` é a **única** fonte de
  identidade nas duas rotas do cliente, (b) que nenhuma rota admin ficou com
  `CustomerJwtGuard` por engano, (c) que o frontend não foi tocado.
