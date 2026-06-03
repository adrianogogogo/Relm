# Integração Nativa CRM (Relm Care+) ↔ HelmDesk

## Goal
Conectar o Relm Care+ ao HelmDesk de forma que garantias, seguros e atendimentos fluam entre os dois sistemas sem retrabalho manual — cliente unificado, ticket criado automaticamente, status sincronizado.

## Contexto — O que cada sistema faz hoje

| Aspecto | Relm Care+ (CRM) | HelmDesk |
|---------|------------------|----------|
| **Stack** | NestJS + Prisma + PostgreSQL | Express + pg raw SQL + PostgreSQL |
| **Banco** | `relm_careplus_*` (Prisma) | `relmdesk` (raw SQL) |
| **Auth** | JWT 15min + refresh 7d (NestJS) | JWT 7d (Express) |
| **Perfis** | 6 (ADMIN, GERENTE, SUPORTE, LOJA, DISTRIBUIDOR, CLIENTE) | 5 (diretor, gestor, atendente, loja, cliente) |
| **Clientes** | tabela `customers` (Prisma UUID) | tabela `users` (role=cliente, UUID) |
| **Lojas** | tabela `stores` (Prisma UUID) | tabela `stores` (UUID) |
| **Produtos** | tabela `products` (serial_number) | tabela `products` (sku, brand_id) |
| **Garantia** | FSM 7 estados (RECEBIDO→FINALIZADO) | issue_type "Garantia" + workflow 10 status |
| **Porta** | 3001 (prod) / 3003 (dev) | 5000 |
| **VPS** | careplus.relmbikes.com.br | 177.153.39.134:3000/5000 |

## Sobreposições Identificadas

1. **Clientes** — ambos cadastram o mesmo cliente (e-mail, CPF, telefone) em tabelas separadas
2. **Lojas** — ambos mantêm cadastro de lojas com CNPJ
3. **Produtos** — Care+ usa `serial_number`, HelmDesk usa `sku` + `brand_id`
4. **Garantia ↔ Ticket** — Garantia no Care+ vira ticket do tipo "Garantia" no HelmDesk, mas sem vínculo

## Tasks

- [x] **Task 1: Criar módulo `helmdesk-bridge` no backend do CRM** → Novo módulo NestJS em `backend/src/helmdesk-bridge/` com service + controller + DTOs. O service usa `axios` para chamar a API do HelmDesk (`http://177.153.39.134:5000/api`). Adicionar `HELMDESK_API_URL` and `HELMDESK_API_TOKEN` ao `.env`. → Verify: `npm run build` compila sem erros, módulo listado no Swagger em `/docs`

- [x] **Task 2: Sincronizar clientes (CRM → HelmDesk)** → No `helmdesk-bridge.service.ts`, criar método `syncCustomer(customerId)` que: (1) busca o customer no Prisma, (2) faz `POST /api/clients` no HelmDesk se não existir (match por email), (3) salva o `helmdesk_user_id` no customer. Adicionar campo `helmdeskUserId` na tabela `customers` via migration Prisma. → Verify: Criar um customer no CRM, chamar sync, confirmar que aparece em `GET /api/clients?search=email` do HelmDesk

- [x] **Task 3: Criar ticket no HelmDesk ao abrir garantia no CRM** → No `warranty.service.ts`, após criar `WarrantyClaim`, chamar `helmdesk-bridge.service.createTicket()` que faz `POST /api/tickets` no HelmDesk com: `issue_type_id=1` (Garantia), dados do cliente, produto (serial_number → product_name), número do protocolo CRM no título. Salvar `helmdesk_ticket_id` na tabela `warranty_claims` (nova coluna). → Verify: Abrir garantia via API do CRM → ticket aparece no HelmDesk com issue_type "Garantia"

- [x] **Task 4: Sincronizar status de garantia ↔ ticket** → Criar mapeamento bidirecional entre os 7 status do CRM e os 10 do HelmDesk. Quando o status da garantia muda no CRM, chamar `PATCH /api/tickets/:id/status` no HelmDesk. Adicionar endpoint webhook `POST /api/helmdesk-bridge/webhook/ticket-status` no CRM para receber updates do HelmDesk. → Verify: Mudar status da garantia no CRM → status do ticket no HelmDesk reflete a mudança (e vice-versa)

- [x] **Task 5: Criar cotação de seguro como ticket no HelmDesk** → Quando `InsuranceQuote` é criada no CRM, chamar `helmdesk-bridge.service.createInsuranceTicket()` que cria ticket no HelmDesk com issue_type "Assistência Técnica" (ou criar novo issue_type "Seguro" via seed). → Verify: Criar cotação via `/api/public/insurance-quote` → ticket visível no HelmDesk

- [x] **Task 6: Widget de tickets HelmDesk no frontend do CRM** → Na `CustomerDetailPage.jsx`, adicionar seção "Tickets de Suporte" que chama `GET /api/helmdesk-bridge/customer/:id/tickets` (proxy no backend do CRM que busca tickets do HelmDesk por `client_email`). Exibir: nº ticket, status, data, link direto para o HelmDesk. → Verify: Abrir detalhe de um cliente no CRM → ver lista de tickets do HelmDesk relacionados

- [x] **Task 7: Sincronizar lojas entre os dois sistemas** → Criar endpoint `POST /api/helmdesk-bridge/sync-stores` que percorre lojas do CRM e faz upsert (match por CNPJ) no HelmDesk via `POST /api/stores`. Adicionar `helmdeskStoreId` ao model `Store` do Prisma. → Verify: Rodar sync → lojas do CRM aparecem no HelmDesk com mesmo CNPJ

- [x] **Task 8: Verificação end-to-end** → Testar fluxo completo: (1) Cliente preenche formulário de garantia no CRM, (2) garantia + ticket criados, (3) atendente muda status no HelmDesk, (4) status reflete no CRM, (5) detalhe do cliente no CRM mostra os tickets. → Verify: Fluxo funciona sem erros 500 em ambos os sistemas

## Mapeamento de Status (Garantia CRM ↔ Ticket HelmDesk)

| CRM (WarrantyStatus) | HelmDesk (ticket_statuses.id) | HelmDesk Status |
|----------------------|-------------------------------|-----------------|
| RECEBIDO | 1 | Novo |
| EM_ANALISE | 4 | Em Análise |
| AGUARDANDO_CLIENTE | 3 | Aguardando Informações |
| APROVADO | 5 | Solução Proposta |
| REPROVADO | 9 | Resolvido |
| FINALIZADO | 10 | Fechado/Arquivado |
| CANCELADO | 10 | Fechado/Arquivado |

## Notas

- **Ambos os sistemas rodam na mesma VPS (177.153.39.134)** → comunicação é `localhost`, latência zero
- **HelmDesk não tem token de API (service-to-service)** → Task 1 inclui criar um JWT de serviço no HelmDesk ou usar credenciais de um user "sistema"
- **Ambos usam PostgreSQL no mesmo servidor** → alternativa futura: Foreign Data Wrapper para acesso direto entre bancos, sem HTTP
- **Não mexer no código do HelmDesk nesta fase** — toda integração é feita pelo lado do CRM chamando a API do HelmDesk
- **Exceção**: Pode ser necessário adicionar uma rota de webhook no HelmDesk para notificar o CRM de mudanças de status (Task 4)

## Done When

- [x] Garantia criada no CRM gera ticket automaticamente no HelmDesk
- [x] Status sincroniza em pelo menos uma direção (CRM → HelmDesk)
- [x] Frontend do CRM exibe tickets do HelmDesk na página do cliente
- [x] Lojas sincronizadas entre os dois sistemas
