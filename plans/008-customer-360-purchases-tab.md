# Plan 008: Aba "Compras" no cliente 360° — produtos, série e status de garantia

> **Instruções ao executor**: Siga este plano passo a passo. Rode **todos** os
> comandos de verificação e confirme o resultado esperado antes de avançar. Se
> qualquer item de "Condições de PARADA" ocorrer, pare e reporte — não improvise.
> Ao terminar, atualize a linha deste plano em `plans/README.md`.
>
> **Drift check (rode primeiro)**:
> `git diff --stat bc6d86d..HEAD -- frontend/src/pages/CustomerDetailPage.jsx frontend/src/services/api.js`
> Se algum arquivo em escopo mudou desde este plano, compare os trechos da seção
> "Estado atual" com o código vivo antes de prosseguir. Divergência = PARADA.

## Status

- **Prioridade**: P2
- **Esforço**: S
- **Risco**: LOW (uma aba nova numa página existente; nenhuma aba atual muda)
- **Depende de**: `plans/006-sale-and-warranty-coverage.md` (obrigatório) e
  `plans/007-store-pos-and-product-curation.md` (recomendado — é ele que cria
  `salesAPI` no frontend; se 007 não rodou, este plano cria `salesAPI` sozinho)
- **Categoria**: direction
- **Planejado em**: commit `bc6d86d`, 2026-07-22

## Por que isso importa

A call de 22/07/2026 colocou o cliente no centro: a tela 360° deve responder,
numa olhada, "o que essa pessoa comprou, com qual série, e o que ainda está na
garantia". Hoje a tela tem 5 abas (visão geral, garantias, seguros, eventos,
lojas próximas) e **nenhuma delas mostra compras** — porque até o plano 006 não
existia venda no sistema.

"Garantias" na tela atual são *chamados* (`WarrantyClaim`: problemas relatados),
não *cobertura*. Um cliente com 3 produtos na garantia e nenhum defeito aparece
hoje com a aba vazia. Esta aba fecha esse buraco: lista as vendas, cada linha com
nome comercial, série, e um chip **Em garantia até DD/MM/AAAA** / **Expirada em
DD/MM/AAAA** / **Sem garantia**.

## Estado atual

**Arquivo único a modificar: `frontend/src/pages/CustomerDetailPage.jsx`** (360
linhas). Leia inteiro antes de começar.

Estado e fetch (l.9-47) — **note que ele NÃO usa React Query**, usa
`useState` + `useEffect` + `Promise.all`. Siga o padrão do arquivo, não o do
resto do app:

```jsx
export default function CustomerDetailPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [warranties, setWarranties] = useState([]);
  const [insurances, setInsurances] = useState([]);
  const [events, setEvents] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  ...
  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      const [customerRes, warrantiesRes, eventsRes, storesRes, insurancesRes] = await Promise.all([
        api.get(`/customers/${id}`),
        api.get(`/warranty/claims?customerId=${id}`),
        api.get('/public/events'),
        api.get('/stores'),
        insuranceAPI.getAll({ customerId: id }),
      ]);
      setCustomer(customerRes.data);
      ...
    } catch (error) {
      console.error('Erro ao carregar dados do cliente:', error);
    } finally {
      setLoading(false);
    }
  };
```

Abas (l.52-58):

```jsx
  const tabs = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'warranties', label: 'Garantias' },
    { id: 'insurances', label: 'Seguros' },
    { id: 'events', label: 'Eventos' },
    { id: 'stores', label: 'Lojas Próximas' },
  ];
```

Cada aba é renderizada como um bloco condicional
`{activeTab === 'xxx' && ( ... )}` (l.146, 190, 228, 285, 313).

Estilo do conteúdo de aba — exemplar da aba Garantias (l.189-196):

```jsx
            {activeTab === 'warranties' && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-slate-100">Garantias do Cliente</h3>
                {warranties.length === 0 ? (
                  <p className="text-gray-500 dark:text-slate-400">Nenhuma garantia cadastrada</p>
                ) : (
                  <div className="space-y-4">
                    {warranties.map((warranty) => (
                      <div key={warranty.id} className="border border-gray-200 dark:border-slate-800 rounded-lg p-4">
```

Imports no topo (l.1-7): `react`, `react-router-dom`, ícones `react-icons/md`,
`api` + APIs nomeadas de `../services/api`, `useAuthStore`, e as primitivas
`{ Card, StatusChip, StatCard }` de `../components/ui`.

### Convenções

- Tailwind **sempre** com par claro/escuro (`text-gray-900 dark:text-slate-100`,
  `border-gray-200 dark:border-slate-800`). O app tem dark mode; esquecer o
  `dark:` produz texto invisível.
- Datas: `new Date(x).toLocaleDateString('pt-BR')`.
- Textos em português.
- Use `StatusChip` (`frontend/src/components/ui/StatusChip.jsx`) para o chip de
  garantia — **leia esse arquivo primeiro** para descobrir a assinatura real
  (quais props aceita: `status`? `label`? `color`?) e use-a. Não invente props.
- O lint do frontend roda com `--max-warnings 0`.

### O que o plano 006 entrega e este plano consome

`GET /sales?customerId=<uuid>&limit=100` retorna:

```json
{
  "data": [
    {
      "id": "<uuid>",
      "saleDate": "2026-07-22T00:00:00.000Z",
      "invoiceNumber": "NF-000123",
      "items": [
        {
          "id": "<uuid>",
          "commercialName": "Bike Gravel X 2026",
          "serialNumber": "ABC123",
          "quantity": 1,
          "warrantyDays": 90,
          "warrantyEndsAt": "2026-10-20T00:00:00.000Z"
        }
      ]
    }
  ],
  "total": 1, "page": 1, "limit": 100
}
```

`warrantyEndsAt` pode ser `null` (item vendido sem garantia).

## Comandos que você vai precisar

| Objetivo       | Onde        | Comando         | Sucesso                |
|----------------|-------------|-----------------|------------------------|
| Build frontend | `frontend/` | `npm run build` | exit 0                 |
| Lint frontend  | `frontend/` | `npm run lint`  | exit 0, **0 warnings** |

`node_modules` já instalado. Não rode `npm install`. O `frontend/` não tem
script `test` — não crie um.

## Escopo

**Em escopo:**
- `frontend/src/pages/CustomerDetailPage.jsx`
- `frontend/src/services/api.js` — **apenas se** `salesAPI` ainda não existir
  (o plano 007 o cria). Se existir, não toque neste arquivo.

**Fora de escopo** (não toque):
- As 5 abas existentes — não renomeie, não reordene, não refatore. Você está
  **adicionando** uma aba.
- `frontend/src/pages/CustomerWarrantiesPage.jsx` (portal do cliente) — outra
  tela, outro público.
- Backend inteiro. Este plano não cria nem altera endpoint algum.
- **Pontos / saldo do clube**: `GET /v1/points/balance`
  (`backend/src/points/points.controller.ts:8`) usa `CustomerJwtGuard` e só
  responde para o próprio cliente autenticado — um admin **não** consegue
  consultá-lo. Mostrar pontos aqui exigiria endpoint novo; ficou de fora de
  propósito (ver "Notas de manutenção").
- **Histórico de comunicação (WhatsApp/e-mail)**: fora de propósito, mesma razão
  (não há endpoint de timeline por cliente).

## Git workflow

- Branch: `advisor/008-cliente-360-compras`
- Estilo de commit: `feat: aba de compras no cliente 360` (minúsculas, sem acentos).
- Não faça push nem abra PR salvo instrução explícita.

## Passos

### Passo 1: Garantir `salesAPI` no frontend

Rode `grep -n "salesAPI" frontend/src/services/api.js`.

- **Se retornar resultado**: nada a fazer, siga para o Passo 2.
- **Se não retornar nada** (plano 007 não executado): adicione, após o bloco
  `productsAPI` (`api.js:213-222`), no mesmo formato dos demais:
  ```js
  export const salesAPI = {
    getAll: (params) => api.get('/sales', { params }).then((res) => res.data),
    getById: (id) => api.get(`/sales/${id}`).then((res) => res.data),
  };
  ```

**Verificar**: `grep -n "salesAPI" frontend/src/services/api.js` → ≥ 1 ocorrência.

### Passo 2: Helper de status de garantia

No topo de `CustomerDetailPage.jsx`, **fora do componente** (abaixo dos imports),
adicione:

```jsx
// Status de garantia de uma linha de venda, derivado de warrantyEndsAt.
// null = vendido sem garantia; passado = expirada; futuro = vigente.
function warrantyStatus(warrantyEndsAt) {
  if (!warrantyEndsAt) return { label: 'Sem garantia', tone: 'neutral' };
  const end = new Date(warrantyEndsAt);
  if (end.getTime() < Date.now()) {
    return { label: `Expirada em ${end.toLocaleDateString('pt-BR')}`, tone: 'danger' };
  }
  return { label: `Em garantia até ${end.toLocaleDateString('pt-BR')}`, tone: 'success' };
}
```

> `tone` é um valor interno deste arquivo. No Passo 4 você mapeia `tone` para o
> que o `StatusChip` realmente aceita — depois de ler
> `frontend/src/components/ui/StatusChip.jsx`. Se o `StatusChip` não suportar
> variantes, use um `<span>` com classes Tailwind (verde / vermelho / cinza,
> cada uma com par `dark:`) em vez de forçar o componente.

### Passo 3: Buscar as vendas

No componente:

1. Adicione o estado: `const [sales, setSales] = useState([]);` junto dos demais
   (perto de `const [warranties, setWarranties] = useState([]);`, l.12).
2. Em `fetchCustomerData`, acrescente a chamada ao `Promise.all` existente:
   `salesAPI.getAll({ customerId: id, limit: 100 })` — adicione também
   `salesAPI` ao import de `../services/api` (l.4, junto de `insuranceAPI, customersAPI`).
3. Guarde o array de vendas em `sales`. **Atenção ao desembrulho**: as outras
   entradas do `Promise.all` usam `api.get(...)` cru e por isso acessam `.data`
   do axios; `salesAPI.getAll` **já devolve o corpo da resposta**, que por sua
   vez é `{ data, total, page, limit }`. Ou seja, o array está em
   `salesRes?.data`. Confirme lendo a definição de `salesAPI.getAll` antes de
   escrever a linha.

**Verificar**: `cd frontend && npm run lint` → exit 0.

### Passo 4: A aba

1. Adicione ao array `tabs` (l.52-58), **na segunda posição** (logo após
   "Visão Geral" — compras vêm antes de garantias, é a ordem cronológica do
   relacionamento): `{ id: 'purchases', label: 'Compras' },`
2. Adicione o bloco condicional `{activeTab === 'purchases' && ( ... )}`
   imediatamente após o bloco da aba Overview (que termina na l.187), seguindo o
   estilo da aba Garantias:
   - `<h3>` "Compras do Cliente"
   - vazio → `<p className="text-gray-500 dark:text-slate-400">Nenhuma compra registrada</p>`
   - senão, para cada venda: um card `border border-gray-200 dark:border-slate-800 rounded-lg p-4`
     com cabeçalho `Venda de {saleDate pt-BR}` + `NF {invoiceNumber || '—'}`, e
     dentro dele a lista de `items`, cada um em uma linha com:
     - **nome comercial** em destaque (`font-medium text-gray-900 dark:text-slate-100`)
     - série em `font-mono text-sm text-gray-600 dark:text-slate-400`, ou `—`
     - quantidade
     - o chip de `warrantyStatus(item.warrantyEndsAt)`
3. Na aba **Visão Geral**, no grid de `StatCard` (l.149-164), adicione um quarto
   card "Produtos em Garantia" cujo valor é a contagem de itens com
   `warrantyEndsAt` no futuro, somando todas as vendas. Ajuste o grid de
   `md:grid-cols-3` para `md:grid-cols-4`.

**Verificar**:
- `cd frontend && npm run build` → exit 0
- `cd frontend && npm run lint` → exit 0, 0 warnings
- `grep -n "purchases" frontend/src/pages/CustomerDetailPage.jsx` → ≥ 2 ocorrências
- Toda classe de cor nova tem par `dark:` (confira o `git diff` linha a linha)

## Plano de teste

Não há harness de teste no `frontend/` e este plano não cria um. A verificação
automatizada é `build` + `lint` verdes.

Checklist manual, a reportar ao final (abra a tela em
`/admin/customers/<id>` autenticado como `ADMIN_RELM`):

- [ ] A aba "Compras" aparece e é a segunda da lista
- [ ] Cliente sem vendas → "Nenhuma compra registrada" (não quebra, não spinner infinito)
- [ ] Item com `warrantyEndsAt` no futuro → chip verde "Em garantia até DD/MM/AAAA"
- [ ] Item com `warrantyEndsAt` no passado → chip vermelho "Expirada em DD/MM/AAAA"
- [ ] Item com `warrantyEndsAt` nulo → chip neutro "Sem garantia"
- [ ] As 5 abas antigas continuam funcionando exatamente como antes
- [ ] Em dark mode todo texto novo é legível

## Critérios de conclusão

- [ ] `cd frontend && npm run build` → exit 0
- [ ] `cd frontend && npm run lint` → exit 0 (0 warnings)
- [ ] `grep -n "warrantyStatus" frontend/src/pages/CustomerDetailPage.jsx` → ≥ 2 ocorrências
- [ ] `grep -n "id: 'purchases'" frontend/src/pages/CustomerDetailPage.jsx` → 1 ocorrência
- [ ] `git status --short` mostra no máximo 2 arquivos, ambos da lista "Em escopo"
- [ ] `git diff` não remove nenhuma das 5 abas existentes
- [ ] checklist manual acima reportado
- [ ] linha do plano 008 atualizada em `plans/README.md`

## Condições de PARADA

- `GET /sales` não existir no backend (`ls backend/src/sales/`) → plano 006 não
  foi executado. Pare.
- O array `tabs` ou o padrão de blocos `{activeTab === 'xxx' && ...}` não
  existirem mais em `CustomerDetailPage.jsx` — a página foi refatorada desde o
  planejamento. Pare e reporte.
- `StatusChip` não aceitar nenhuma forma de variação de cor **e** você não
  conseguir um `<span>` estilizado que passe no lint. Pare e reporte.
- O lint falhar duas vezes após tentativa razoável de correção.
- Você concluir que precisa de um endpoint novo — este plano é estritamente
  frontend. Pare e reporte qual endpoint e por quê.

## Notas de manutenção

- **A aba "Garantias" e a aba "Compras" mostram coisas diferentes** e podem
  confundir o usuário: uma é chamado/defeito, outra é cobertura. Se um dia a
  nomenclatura for revista, renomear "Garantias" para "Chamados de Garantia"
  resolve — mas isso é mudança de vocabulário de produto, não de código, e
  precisa ser acordada com o cliente antes.
- **Pontos, benefícios e histórico de comunicação ficaram de fora** de propósito:
  não existe endpoint que um admin possa chamar para o saldo de pontos de outro
  cliente (`points.controller.ts` é `CustomerJwtGuard`, só o próprio cliente).
  Completar o 360° nessa direção exige um endpoint novo — planeje separadamente.
- O fetch usa `limit: 100` sem paginação na UI. Clientes com mais de 100 vendas
  vão truncar silenciosamente. Aceitável hoje (o modelo de venda acabou de
  nascer); quando deixar de ser, adicione "carregar mais" — o backend já é
  paginado.
- Um reviewer deve olhar: (a) que nenhuma aba existente foi tocada, (b) que todo
  Tailwind novo tem par `dark:`, (c) o desembrulho correto da resposta paginada.
