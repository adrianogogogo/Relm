# Plan 010: `GET /warranty/claims` vaza os chamados (e a PII) de todas as lojas para qualquer lojista

> **Instruções ao executor**: Siga este plano passo a passo. Rode **todos** os
> comandos de verificação e confirme o resultado esperado antes de avançar. Se
> qualquer item de "Condições de PARADA" ocorrer, pare e reporte — não improvise.
> Pule qualquer atualização de `plans/README.md` — o revisor mantém o índice.
>
> **Drift check (rode primeiro)**:
> `git diff --stat 3512ef6..HEAD -- backend/src/warranty frontend/src/pages/StoreWarrantiesPage.jsx`
> Divergência com os trechos de "Estado atual" = PARADA.

## Status

- **Prioridade**: P0 (exposição de PII entre lojas concorrentes, ativa agora)
- **Esforço**: S
- **Risco**: MED — mexer no `findAll` afeta a tela de garantias do admin também
- **Depende de**: nenhum
- **Categoria**: security
- **Planejado em**: commit `3512ef6`, 2026-07-22

## Por que isso importa

O commit `8e83e5e` liberou `GET /warranty/claims` para o papel `LOJA`, para
consertar um 403 legítimo: a tela `/loja/garantias` não carregava.

Só que `StoreWarrantiesPage.jsx:35` chama `warrantyAPI.getAll({ storeId })`
passando a loja como **query param**, e `warrantyService.findAll` **ignora esse
parâmetro** — o `where` só entende `statusId`, `protocol_number` e `search`.

Resultado atual: o lojista não toma mais 403, mas recebe **todos os chamados de
garantia do sistema**, de todas as lojas, com `fullName`, `email` e `phone` dos
clientes **sem mascaramento**. Um lojista enxerga os clientes dos concorrentes.

Isso reabre, por outra porta, exatamente o que o plano 002 fechou (mascarar
CPF/telefone para `LOJA`): o `warranty.service.ts` tem mascaramento, mas só na
linha 1223, dentro de outro método — `findAll` não passa por ele.

Quando este plano fechar: o lojista verá **apenas os chamados da própria loja**,
com PII de contato mascarada, e o filtro virá do token — nunca do query param.

## Estado atual

`backend/src/warranty/warranty.controller.ts:70-77` — a rota, hoje sem repassar
o usuário ao service:

```ts
  @Get('warranty/claims')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar garantias' })
  async findAll(@Query() query: any) {
    return this.warrantyService.findAll(query);
  }
```

`backend/src/warranty/warranty.service.ts` — o `findAll`. Note que **não há
`storeId` no `where`** e que `phone` sai cru:

```ts
  async findAll(filters: any) {
    const where: any = {
      ...(filters.statusId && { statusId: Number(filters.statusId) }),
      ...(filters.protocol_number && {
        protocolNumber: { contains: filters.protocol_number },
      }),
    };

    if (filters.search && String(filters.search).trim() !== '') {
      const search = String(filters.search).trim();
      where.OR = [ /* protocolo, nome, email, serial */ ];
    }

    return this.prisma.warrantyClaim.findMany({
      where,
      include: {
        customer: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        ...
```

`frontend/src/pages/StoreWarrantiesPage.jsx:29-36` — o chamador que motivou tudo:

```jsx
  const storeId = useAuthStore((state) => state.user?.storeId);
  const { data: warranties, isLoading } = useQuery({
    queryKey: ['store-warranties', storeId],
    queryFn: () => warrantyAPI.getAll({ storeId }),
    enabled: !!storeId,
  });
```

### O exemplar a seguir: `customers.service.ts`

Este módulo **já resolve exatamente este problema** — copie o padrão dele.

`backend/src/common/utils/mask.ts` (util existente, use como está):

```ts
const ROLES_THAT_SEE_MASKED = ['LOJA', 'DISTRIBUIDOR'];
export function shouldMaskFor(role?: string | null): boolean {
  return !!role && ROLES_THAT_SEE_MASKED.includes(role);
}
export function maskCpf(cpf?: string | null): string | null { /* 123.***.**-01 */ }
export function maskPhone(phone?: string | null): string | null { /* (11) 9****-4321 */ }
```

`backend/src/customers/customers.service.ts` — importa na l.11, escopa por loja
na l.135 (`findAll`) e na l.250 (`findOne`), e mascara na l.441-446:

```ts
  private formatCustomer(customer: any, requesterRole?: string) {
    const mask = shouldMaskFor(requesterRole);
    return {
      ...customer,
      cpf: mask ? maskCpf(customer.cpf) : customer.cpf,
      phone: mask ? maskPhone(customer.phone) : customer.phone,
    };
  }
```

E `warranty.service.ts:1141` já tem um `maskEmail` privado — **reutilize-o**,
não escreva outro:

```ts
  private maskEmail(email?: string | null): string | null { ... }
```

### Convenções
- Comentários e mensagens de erro em português.
- `PrismaService` injetado; `// ponytail:` para simplificações deliberadas.
- Papéis: `ADMIN_RELM`, `GERENTE_RELM`, `SUPORTE_RELM`, `LOJA`, `DISTRIBUIDOR`, `CLIENTE`.
- O token admin (`jwt.strategy.ts:23`) traz `{ userId, email, role }` — **não traz
  `storeId`**. O `storeId` de um usuário `LOJA` vive em `User.storeId` e precisa
  ser buscado no banco. Exemplar já em produção: `backend/src/sales/sales.service.ts`,
  método `findAll`.

## Comandos

Rodam de `backend/`. `npm run lint` está quebrado no repo inteiro (não existe
config de ESLint) — **pré-existente, ignore**. Não há `.env` no worktree:
passe `DATABASE_URL` inline por comando (nenhum comando conecta de fato).

| Objetivo | Comando | Sucesso |
|---|---|---|
| Build | `npm run build` | exit 0 |
| Testes | `npm test` | todos passam |

## Escopo

**Em escopo:**
- `backend/src/warranty/warranty.controller.ts` (só a rota `GET warranty/claims`)
- `backend/src/warranty/warranty.service.ts` (só o método `findAll`)
- `backend/src/warranty/warranty.service.spec.ts` (adicionar testes)

**Fora de escopo** (não toque):
- **Paginação do `findAll`** — é o plano 004, ainda TODO. Tentador fazer junto,
  mas muda o formato da resposta e quebraria `WarrantiesPage.jsx` e
  `StoreWarrantiesPage.jsx`. Não faça aqui.
- Os outros ~20 métodos de `warranty.service.ts`.
- Os `@Roles` das **outras** rotas do controller.
- Todo o `frontend/` — a correção é backend-only de propósito: o frontend já
  manda `storeId` e passará a ser ignorado, sem quebrar.
- `backend/src/stores/stores.controller.ts` — o `GET /stores` liberado para
  `LOJA` no mesmo commit é um achado separado (ver "Notas de manutenção").

## Git workflow
- Branch nova a partir do `HEAD` atual: `advisor/010-warranty-scope`.
- Commit: `fix: escopa listagem de garantias por loja e mascara pii do lojista`
- Não faça push nem abra PR.

## Passos

### Passo 1: Repassar o usuário autenticado ao service

Em `warranty.controller.ts`, na rota `GET warranty/claims` (l.70-77), adicione
`@Request() req: any` (o decorator `Request` já está importado no arquivo) e
repasse o usuário:

```ts
  async findAll(@Query() query: any, @Request() req: any) {
    return this.warrantyService.findAll(query, {
      requesterUserId: req.user?.userId,
      requesterRole: req.user?.role,
    });
  }
```

O formato `{ requesterUserId, requesterRole }` é o mesmo já usado por
`customers.service.ts:188` — mantenha-o para o código ficar uniforme.

**Verificar**: `npm run build` → exit 0.

### Passo 2: Escopar por loja e mascarar no `findAll`

Em `warranty.service.ts`, mude a assinatura para
`async findAll(filters: any, requester?: { requesterUserId?: string; requesterRole?: string })`
e implemente, **nesta ordem**:

1. **Escopo por loja (o coração da correção).** Se
   `requester?.requesterRole === 'LOJA'`:
   - busque o usuário: `const user = await this.prisma.user.findUnique({ where: { id: requester.requesterUserId } });`
   - se `!user?.storeId`, lance
     `new BadRequestException('Usuário de loja sem loja vinculada.')`
     (mesma mensagem já usada em `sales.service.ts` — não invente outra);
   - force `where.storeId = user.storeId;`
   - **ignore `filters.storeId`** neste caminho. Comente o porquê:
     ```ts
     // storeId vem do usuário autenticado, nunca do query param — senão o
     // lojista lista os chamados de qualquer loja trocando a URL.
     ```
2. **Para os demais papéis**, aceite `filters.storeId` como filtro opcional
   (`...(filters.storeId && { storeId: filters.storeId })`) — o admin usa isso.
3. **Mascaramento.** Guarde o resultado do `findMany` numa variável e retorne-o
   mapeado, aplicando máscara quando `shouldMaskFor(requester?.requesterRole)`
   for verdadeiro:
   - `customer.phone` → `maskPhone(...)`
   - `customer.email` → o `this.maskEmail(...)` **já existente** na l.1141
   - `customer.fullName` **não** é mascarado (o lojista precisa identificar o
     cliente da própria loja).
   Importe o necessário de `../common/utils/mask` (o arquivo já exporta
   `shouldMaskFor` e `maskPhone`).

**Verificar**:
- `npm run build` → exit 0
- `grep -n "where.storeId" src/warranty/warranty.service.ts` → ≥ 1 ocorrência
- `grep -n "shouldMaskFor" src/warranty/warranty.service.ts` → ≥ 1 ocorrência

### Passo 3: Testes

Adicione a `backend/src/warranty/warranty.service.spec.ts` (já existe — leia e
siga a estrutura). Use um `PrismaService` mockado (objeto simples com
`user.findUnique` e `warrantyClaim.findMany` como `jest.fn()`).

Casos obrigatórios:

1. **Escopo**: papel `LOJA` com `user.storeId = 'loja-A'` → o `where` passado a
   `warrantyClaim.findMany` contém `storeId: 'loja-A'`.
2. **Não confia no query param**: papel `LOJA` (`storeId` real `'loja-A'`)
   chamando com `filters = { storeId: 'loja-B' }` → o `where` **continua**
   `storeId: 'loja-A'`. Este é o teste que trava a vulnerabilidade.
3. **Loja sem vínculo**: papel `LOJA` com `user.storeId = null` → rejeita com
   `BadRequestException`.
4. **Admin não é escopado**: papel `ADMIN_RELM` sem `filters.storeId` → o `where`
   **não** contém `storeId`.
5. **Máscara**: papel `LOJA`, com o mock do `findMany` devolvendo um claim com
   `customer.phone = '11912345678'` → o telefone retornado **não** é igual ao
   original (veio mascarado).

**Verificar**: `npm test -- warranty` → passa, com 5 testes novos.

## Critérios de conclusão

- [ ] `cd backend && npm run build` → exit 0
- [ ] `cd backend && npm test` → todos passam, incluindo os 5 novos
- [ ] `grep -n "where.storeId" backend/src/warranty/warranty.service.ts` → ≥ 1
- [ ] `grep -n "shouldMaskFor" backend/src/warranty/warranty.service.ts` → ≥ 1
- [ ] `git status --short` → nenhum arquivo em `frontend/`
- [ ] `git diff --stat` → no máximo 3 arquivos, todos em `backend/src/warranty/`
- [ ] a resposta do `findAll` continua sendo um **array** (não um objeto
      paginado) — o formato não pode mudar neste plano

## Condições de PARADA

- `findAll` já escopar por `storeId` no código vivo — alguém corrigiu em
  paralelo. Pare e reporte.
- Você concluir que precisa mudar o formato de retorno (paginação) para fazer o
  mascaramento funcionar. Pare — isso é o plano 004.
- Você concluir que precisa alterar **qualquer** arquivo do `frontend/`. Pare.
- `npm test` quebrar em suíte **não relacionada** a warranty.
- O método `maskEmail` privado não existir mais em `warranty.service.ts`.

## Notas de manutenção

- **A regra geral**: nenhum filtro de tenant (`storeId`) pode vir do cliente.
  Sempre do token. Os dois casos já corrigidos assim são `sales.service.ts` e
  agora `warranty.service.ts`.
- **`GET /stores` liberado para `LOJA`** (mesmo commit `8e83e5e`,
  `stores.controller.ts:39`) é um achado **separado e ainda aberto**: hoje um
  lojista lista todas as lojas com CNPJ, e-mail, telefone e endereço. Se o
  objetivo era popular um seletor, o certo é um endpoint enxuto (id + nome).
  Merece plano próprio.
- **Falta confirmar** se `customers.findOne` impede um lojista de abrir um
  cliente de outra loja pelo id — a rota `/loja/clientes/:id` passou a existir
  no commit `8e83e5e`. O service recebe `requester` e escopa na l.250, mas isso
  não foi verificado com teste.
- O plano 004 (paginar este mesmo `findAll`) continua TODO e ficou **mais**
  urgente: o endpoint agora tem mais perfis batendo nele.
- Um reviewer deve olhar: (a) que `filters.storeId` é ignorado para `LOJA`,
  (b) que `fullName` segue legível e só o contato é mascarado, (c) que o retorno
  continua array.
