# Plan 007: Tela de lançamento de venda na loja (PDV) + fila de curadoria de produtos no admin

> **Instruções ao executor**: Siga este plano passo a passo. Rode **todos** os
> comandos de verificação e confirme o resultado esperado antes de avançar. Se
> qualquer item de "Condições de PARADA" ocorrer, pare e reporte — não improvise.
> Ao terminar, atualize a linha deste plano em `plans/README.md`.
>
> **Drift check (rode primeiro)**:
> `git diff --stat bc6d86d..HEAD -- backend/src/sales frontend/src/App.jsx frontend/src/services/api.js frontend/src/components/StoreLayout.jsx frontend/src/components/AdminLayout.jsx`
> Se algum arquivo em escopo mudou desde este plano, compare os trechos da seção
> "Estado atual" com o código vivo antes de prosseguir. Divergência = PARADA.

## Status

- **Prioridade**: P1
- **Esforço**: M
- **Risco**: LOW (tudo é tela nova + 2 endpoints novos; nada existente muda de comportamento)
- **Depende de**: `plans/006-sale-and-warranty-coverage.md` — **bloqueante e obrigatório**
- **Categoria**: direction
- **Planejado em**: commit `bc6d86d`, 2026-07-22

## Por que isso importa

O plano 006 cria o modelo de venda no backend, mas ninguém consegue lançar uma
venda: não existe tela. A call de 22/07/2026 definiu que o ponto de venda é onde
o dado nasce, e que a adoção do lojista morre se o cadastro for rígido — por isso
o campo de produto é **texto livre** ("nome comercial"), e a normalização vem
depois, por curadoria da equipe Relm.

As duas metades precisam existir juntas, senão o texto livre vira uma base
inconsistente sem caminho de saída: a loja digita livremente **e** o admin tem
uma fila para vincular cada descrição ao produto do catálogo.

Quando este plano fechar: um usuário `LOJA` seleciona o cliente, lança as linhas
da venda com série e prazo de garantia, anexa a NF; e um `ADMIN_RELM` /
`GERENTE_RELM` vê a fila de linhas sem produto vinculado e resolve cada uma.

## Estado atual

### O que o plano 006 deixou pronto (confirme antes de começar)

- `backend/src/sales/sales.service.ts`, `sales.controller.ts`, `sales.module.ts`
- `SaleItem.productId` é **nulo** até a curadoria; `SaleItem.commercialName` é o
  texto livre digitado pelo lojista.
- Endpoints existentes: `POST /sales`, `GET /sales`, `GET /sales/:id`,
  `POST /sales/:id/invoice`.

Se `backend/src/sales/` não existir, **PARE** — execute o plano 006 primeiro.

### Frontend: convenções a seguir

Não invente padrões. Copie os que já existem.

**Página de loja — exemplar `frontend/src/pages/StoreProductsPage.jsx`** (104
linhas, leia inteiro antes de começar). Padrão observado:

```jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { MdInventory2, MdSearch } from 'react-icons/md';
import { useAuthStore } from '../store/authStore';
import { Card, PageHeader } from '../components/ui';

export default function StoreProductsPage() {
  const storeId = useAuthStore((state) => state.user?.storeId);
  const { data: products, isLoading } = useQuery({
    queryKey: ['store-products', storeId],
    queryFn: () => api.get('/products', { params: { storeId } }).then((res) => res.data),
    enabled: !!storeId,
  });
  return (
    <div className="py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <PageHeader title="Produtos da Loja" subtitle={...} />
        ...
```

Portanto: **React Query** para dados (`useQuery` / `useMutation`), `api` de
`../services/api`, primitivas de `../components/ui`
(`Card`, `PageHeader`, `StatusChip`, `StatCard`, `Button` — ver
`frontend/src/components/ui/index.js`), ícones de `react-icons/md`, Tailwind com
variantes `dark:` **sempre** (o app tem dark mode), classe utilitária `input`
para campos de formulário, textos em português, datas com
`toLocaleDateString('pt-BR')` e dinheiro com
`new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.

**Camada de API — `frontend/src/services/api.js`.** Cada módulo exporta um objeto
nomeado. Exemplar (`api.js:213-222`):

```js
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }).then((res) => res.data),
  getById: (id) => api.get(`/products/${id}`).then((res) => res.data),
  create: (data) => api.post('/products', data).then((res) => res.data),
  ...
};
```

**Menu da loja — `frontend/src/components/StoreLayout.jsx:23-31`**, array `MENU`:

```js
  { path: '/loja/garantias', label: 'Garantias', icon: MdVerifiedUser },
  { path: '/loja/produtos', label: 'Produtos', icon: MdInventory2 },
```

**Menu do admin — `frontend/src/components/AdminLayout.jsx:30-48`**, array
`MENU_ITEMS`, com `roles` por item:

```js
  {
    path: '/admin/catalogo',
    label: 'Catálogo Prêmios',
    icon: MdStars,
    roles: ['ADMIN_RELM', 'GERENTE_RELM'],
  },
```

**Rotas — `frontend/src/App.jsx`.** Rotas de loja ficam sob `/loja`
(l.152-168); rotas de admin sob `/admin` (l.173+) e são envelopadas em
`<ProtectedRoute allowedRoles={[...]}>` quando restritas (exemplar l.210-214):

```jsx
            <Route path="produtos" element={
              <ProtectedRoute allowedRoles={['ADMIN_RELM', 'GERENTE_RELM']}>
                <AdminProductsPage />
              </ProtectedRoute>
            } />
```

### Backend: convenções

Idênticas às do plano 006 — controllers com `@UseGuards(JwtAuthGuard)` na classe
e `@UseGuards(RolesGuard)` + `@Roles(...)` por rota; mensagens de erro em
português; `PrismaService` injetado; DTOs com `class-validator`.

## Comandos que você vai precisar

| Objetivo          | Onde        | Comando           | Sucesso                    |
|-------------------|-------------|-------------------|----------------------------|
| Build backend     | `backend/`  | `npm run build`   | exit 0                     |
| Lint backend      | `backend/`  | `npm run lint`    | exit 0                     |
| Testes backend    | `backend/`  | `npm test`        | todos passam               |
| Build frontend    | `frontend/` | `npm run build`   | exit 0, bundle gerado      |
| Lint frontend     | `frontend/` | `npm run lint`    | exit 0, **0 warnings**     |

> O lint do frontend roda com `--max-warnings 0`. Variável não usada = falha.
> `node_modules` já está instalado nos dois lados; não rode `npm install`.

## Escopo

**Em escopo:**

Backend:
- `backend/src/sales/sales.controller.ts` (adicionar 2 rotas)
- `backend/src/sales/sales.service.ts` (adicionar 2 métodos)
- `backend/src/sales/dto/link-sale-item.dto.ts` (criar)

Frontend:
- `frontend/src/pages/StoreSalesPage.jsx` (criar)
- `frontend/src/pages/AdminCurationPage.jsx` (criar)
- `frontend/src/services/api.js` (adicionar `salesAPI`)
- `frontend/src/App.jsx` (2 imports + 2 rotas)
- `frontend/src/components/StoreLayout.jsx` (1 item de menu)
- `frontend/src/components/AdminLayout.jsx` (1 item de menu)

**Fora de escopo** (não toque):

- `backend/prisma/schema.prisma` — **nenhuma mudança de schema neste plano.** A
  curadoria acontece preenchendo `SaleItem.productId`, que o plano 006 já criou.
  Se você sentir necessidade de adicionar um campo tipo `pendingCuration`,
  **não adicione**: `productId IS NULL` já é o estado "pendente". Uma flag
  duplicada dessincroniza.
- `frontend/src/pages/StoreProductsPage.jsx` e `AdminProductsPage.jsx` — o
  catálogo continua como está.
- `frontend/src/pages/CustomerDetailPage.jsx` — é o plano 008.
- Qualquer alteração no fluxo de garantia (`warranty*`).

## Git workflow

- Branch: `advisor/007-pdv-curadoria`
- Um commit por passo; estilo: `feat: tela de lancamento de venda na loja`
  (minúsculas, sem acentos na mensagem).
- Não faça push nem abra PR salvo instrução explícita.

## Passos

### Passo 1: Endpoints de curadoria no backend

Crie `backend/src/sales/dto/link-sale-item.dto.ts`:

```ts
import { IsUUID } from 'class-validator';

export class LinkSaleItemDto {
  // Produto do catálogo ao qual a descrição livre será vinculada.
  @IsUUID()
  productId: string;
}
```

Em `sales.service.ts`, adicione:

**`findPendingCuration(query)`** — lista `saleItem` com `productId: null`,
paginado (default `page=1`, `limit=20`, teto 100), retornando
`{ data, total, page, limit }`. Inclua
`sale: { select: { id: true, saleDate: true, customer: { select: { id: true, fullName: true } }, store: { select: { id: true, tradeName: true } } } }`.
Ordene por `createdAt: 'asc'` (mais antigo primeiro — é uma fila).

**`linkItemToProduct(itemId, productId)`** —
1. `NotFoundException('Item de venda não encontrado')` se o item não existir.
2. `NotFoundException('Produto não encontrado')` se o produto não existir.
3. `prisma.saleItem.update({ where: { id: itemId }, data: { productId } })`.

Em `sales.controller.ts`, adicione as rotas — **atenção à ordem**: a rota
literal `items/pending-curation` deve ser declarada **antes** de qualquer rota
`:id` do controller, senão o Nest casa `items` como `:id`.

| Método | Rota                            | `@Roles`                    |
|--------|---------------------------------|-----------------------------|
| GET    | `/sales/items/pending-curation` | `ADMIN_RELM`, `GERENTE_RELM` |
| PATCH  | `/sales/items/:itemId/link`     | `ADMIN_RELM`, `GERENTE_RELM` |

`LOJA` **não** tem acesso à curadoria.

**Verificar**:
- `cd backend && npm run build` → exit 0
- `cd backend && npm run lint` → exit 0
- `grep -n "pending-curation" backend/src/sales/sales.controller.ts` → 1 ocorrência
- No arquivo do controller, a linha de `pending-curation` tem número **menor**
  que a de qualquer `@Get(':id')` / `@Patch(':id')`.

### Passo 2: `salesAPI` no frontend

Em `frontend/src/services/api.js`, após o bloco `productsAPI` (l.213-222),
adicione, no mesmo formato:

```js
export const salesAPI = {
  getAll: (params) => api.get('/sales', { params }).then((res) => res.data),
  getById: (id) => api.get(`/sales/${id}`).then((res) => res.data),
  create: (data) => api.post('/sales', data).then((res) => res.data),
  // NF: multipart.
  uploadInvoice: (id, file) => {
    const form = new FormData();
    form.append('file', file);
    return api
      .post(`/sales/${id}/invoice`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((res) => res.data);
  },
  getPendingCuration: (params) =>
    api.get('/sales/items/pending-curation', { params }).then((res) => res.data),
  linkItem: (itemId, productId) =>
    api.patch(`/sales/items/${itemId}/link`, { productId }).then((res) => res.data),
};
```

**Verificar**: `cd frontend && npm run lint` → exit 0.

### Passo 3: Tela de lançamento de venda na loja

Crie `frontend/src/pages/StoreSalesPage.jsx`. Estrutura, em uma única página
(sem wizard — o lojista precisa de velocidade):

1. **`PageHeader`** título "Lançar Venda".
2. **Bloco Cliente**: campo de busca que consulta `GET /customers` com debounce
   simples (`useState` + `setTimeout` de ~400ms em `useEffect`; **não** adicione
   dependência nova de debounce). Mostra os resultados numa lista clicável e
   guarda `selectedCustomer` em estado. Ao lado, um link
   `<Link to="/loja/clientes">` para cadastrar cliente novo — **não** reimplemente
   o cadastro de cliente aqui.
   > `GET /customers` já aceita papel `LOJA`
   > (`backend/src/customers/customers.controller.ts:40-41`). **Antes de usar**,
   > abra `backend/src/customers/customers.service.ts` e confirme o nome real do
   > parâmetro de busca (`search`, `q`, ou outro) — use o nome real, não chute.
3. **Bloco Venda**: `saleDate` (`<input type="date">`, default hoje),
   `invoiceNumber` (texto), `notes` (textarea).
4. **Bloco Itens** — array em estado, com botão "Adicionar item". Cada linha:
   - `commercialName` — texto livre, **obrigatório**, placeholder
     "Ex.: Bike Gravel X 2026 / Capacete Y tam. M"
   - `quantity` — número, default 1
   - `serialNumber` — texto, opcional
   - `unitPrice` — número, opcional
   - `warrantyDays` — `<select>` com as opções **60, 90, 180, 360 dias** e
     "Sem garantia" (valor vazio → envia `undefined`). Nada de campo livre aqui;
     a call fixou esses prazos.
   - botão remover linha (desabilitado quando só há 1 linha)
5. **Bloco NF**: `<input type="file" accept="application/pdf,image/*">`,
   opcional por ora. Texto de ajuda: "Recomendado — será obrigatório em breve."
6. **Submit** com `useMutation`:
   - `salesAPI.create({ customerId, saleDate, invoiceNumber, notes, items })`
   - se houver arquivo, em seguida `salesAPI.uploadInvoice(sale.id, file)`
   - **`storeId` não é enviado** — o backend força a loja do usuário (plano 006,
     Passo 4). Enviar daqui seria ignorado; não envie.
   - em sucesso: limpa o formulário e mostra confirmação com o total de itens.
   - em erro: exibe `error.response?.data?.message` ao usuário.
   - o botão fica desabilitado enquanto `isPending`, e também quando não há
     cliente selecionado ou algum `commercialName` está vazio.

Registre em `frontend/src/App.jsx`: import da página e
`<Route path="vendas" element={<StoreSalesPage />} />` dentro do bloco `/loja`
(junto de `<Route path="garantias" ... />`, l.162).

Adicione ao `MENU` de `frontend/src/components/StoreLayout.jsx`, logo após
Clientes: `{ path: '/loja/vendas', label: 'Lançar Venda', icon: MdPointOfSale },`
— importe `MdPointOfSale` no bloco de import de `react-icons/md` já existente
(l.1-20).

**Verificar**:
- `cd frontend && npm run build` → exit 0
- `cd frontend && npm run lint` → exit 0, 0 warnings
- `grep -n "vendas" frontend/src/App.jsx` → a rota existe e está dentro do bloco
  `path="/loja"`
- `grep -n "loja/vendas" frontend/src/components/StoreLayout.jsx` → 1 ocorrência

### Passo 4: Tela de curadoria no admin

Crie `frontend/src/pages/AdminCurationPage.jsx`:

1. `PageHeader` título "Curadoria de Produtos", subtítulo com o total pendente.
2. `useQuery(['sales-pending-curation', page], () => salesAPI.getPendingCuration({ page, limit: 20 }))`.
3. Tabela com colunas: Data da venda, Cliente, Loja, **Nome comercial**
   (destacado), Série, Qtd, e a coluna de ação.
4. Ação: um `<select>` com os produtos do catálogo
   (`useQuery(['products'], () => productsAPI.getAll())` — reutilize
   `productsAPI`, já exportado) e um botão "Vincular" que chama
   `useMutation(({ itemId, productId }) => salesAPI.linkItem(itemId, productId))`
   e, em sucesso, invalida a query `['sales-pending-curation']`.
5. Estado vazio: "Nenhum item pendente de curadoria." dentro de um `Card`,
   seguindo o padrão de estado vazio de `StoreProductsPage.jsx:54-62`.
6. Paginação simples (botões Anterior/Próxima usando `total`/`limit` da resposta).

Registre em `frontend/src/App.jsx`, dentro do bloco `/admin`:

```jsx
            <Route path="curadoria" element={
              <ProtectedRoute allowedRoles={['ADMIN_RELM', 'GERENTE_RELM']}>
                <AdminCurationPage />
              </ProtectedRoute>
            } />
```

Adicione ao `MENU_ITEMS` de `frontend/src/components/AdminLayout.jsx`, logo após
o item `/admin/produtos`:

```js
  {
    path: '/admin/curadoria',
    label: 'Curadoria de Produtos',
    icon: MdRule,
    roles: ['ADMIN_RELM', 'GERENTE_RELM'],
  },
```

Importe `MdRule` no bloco de imports de `react-icons/md` já existente.

**Verificar**:
- `cd frontend && npm run build` → exit 0
- `cd frontend && npm run lint` → exit 0, 0 warnings
- `grep -n "admin/curadoria" frontend/src/components/AdminLayout.jsx` → 1 ocorrência

## Plano de teste

Backend — adicione ao spec criado no plano 006
(`backend/src/sales/sales.service.spec.ts`), seguindo a mesma estrutura já
usada lá. Como `linkItemToProduct` toca o banco, teste-o com um `PrismaService`
mockado (objeto simples com `saleItem.findUnique` / `product.findUnique` /
`saleItem.update` como `jest.fn()`):

1. `linkItemToProduct` com item inexistente → rejeita com `NotFoundException` e
   mensagem `'Item de venda não encontrado'`.
2. `linkItemToProduct` com produto inexistente → rejeita com `NotFoundException`
   e mensagem `'Produto não encontrado'`.
3. Caminho feliz → chama `saleItem.update` uma vez com
   `{ where: { id: itemId }, data: { productId } }`.

Se o plano 006 tiver registrado PARADA por ausência de harness de teste, pule
esta seção e registre o mesmo motivo.

Frontend — **não** há harness de teste no `frontend/` (`package.json` não tem
script `test`). Não instale um. A verificação do frontend é `build` + `lint`
verdes, mais o checklist manual abaixo, que você deve reportar ao final:

- [ ] `/loja/vendas` renderiza e o menu da loja mostra "Lançar Venda"
- [ ] enviar sem cliente selecionado mantém o botão desabilitado
- [ ] `/admin/curadoria` aparece no menu apenas para `ADMIN_RELM` / `GERENTE_RELM`

## Critérios de conclusão

- [ ] `cd backend && npm run build` → exit 0
- [ ] `cd backend && npm run lint` → exit 0
- [ ] `cd backend && npm test -- sales` → passa (ou PARADA documentada)
- [ ] `cd frontend && npm run build` → exit 0
- [ ] `cd frontend && npm run lint` → exit 0 (0 warnings)
- [ ] `grep -rn "salesAPI" frontend/src/ | wc -l` → ≥ 3
- [ ] `grep -rn "pendingCuration" backend/prisma/schema.prisma` → **0 ocorrências**
      (nenhuma flag nova de schema foi adicionada)
- [ ] `git status --short` não mostra arquivo fora da lista "Em escopo"
- [ ] linha do plano 007 atualizada em `plans/README.md`

## Condições de PARADA

- `backend/src/sales/` não existe → o plano 006 não foi executado. Pare.
- `GET /customers` não aceitar o papel `LOJA` no código vivo (confira
  `backend/src/customers/customers.controller.ts:40-41`) — a busca de cliente
  no PDV depende disso e a correção é fora do escopo deste plano.
- O lint do frontend falhar duas vezes após tentativa razoável de correção.
- Você concluir que precisa alterar `schema.prisma` para completar a curadoria —
  releia "Fora de escopo"; se ainda assim parecer necessário, pare e reporte.
- `npm install` parecer necessário (nova dependência) — pare e reporte qual e
  por quê. Nada neste plano exige biblioteca nova.

## Notas de manutenção

- **`productId IS NULL` é o estado "pendente de curadoria".** Não crie uma flag
  paralela. Se algum dia a curadoria precisar de estados intermediários
  ("descartado", "produto não existe no catálogo"), aí sim vale um campo — e a
  fila precisa passar a filtrar por ele.
- A NF é opcional neste plano. A call previu torná-la obrigatória depois; quando
  isso acontecer, o ponto de mudança é o DTO `CreateSaleDto` (backend) **e** o
  submit em `StoreSalesPage.jsx` — os dois, senão a UI deixa o usuário montar
  uma venda que o backend rejeita.
- Os prazos 60/90/180/360 estão hardcoded no `<select>`. Se virarem
  configuráveis, o lugar natural é o `ClubSettings` (`schema.prisma:923`), não
  uma constante nova.
- Um reviewer deve olhar: (a) a ordem das rotas no controller
  (`items/pending-curation` antes de `:id`), (b) que o front não envia `storeId`,
  (c) que a fila de curadoria é paginada.
