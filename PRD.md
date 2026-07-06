# 🚴 Product Requirements Document (PRD) — Relm Care+

> **Centro de Serviços ao Cliente Relm Bikes**  
> **Versão:** 1.1.0 (V2 Expansão)  
> **Status:** Aprovado  
> **Autor:** Antigravity AI  

---

## 1. Visão Geral do Produto

O **Relm Care+** é a plataforma unificada de CRM (Customer Relationship Management) e pós-venda da **Relm Bikes**. O sistema foi concebido para centralizar a jornada pós-compra do cliente final, conectar revendedores oficiais (lojas), suportar a operação B2B com distribuidores e prover uma central administrativa completa para a equipe da Relm Bikes gerenciar garantias, eventos, campanhas e relacionamento.

### 🎯 Objetivos de Negócio
- **Modernização do Pós-venda:** Substituir processos manuais de acionamento de garantia por um workflow automatizado, auditável e transparente.
- **Engajamento e Retenção:** Criar valor contínuo para proprietários de bicicletas Relm através do Clube de Vantagens e convites para eventos oficiais.
- **Estreitamento da Rede de Canais:** Integrar lojas revendedoras no fluxo de garantia e fornecer um portal de comunicação oficial direto da marca.
- **Conformidade Legal:** Estar 100% alinhado com as exigências da Lei Geral de Proteção de Dados (LGPD) no Brasil.

---

## 2. Stack Tecnológica e Arquitetura

O sistema adota uma arquitetura desacoplada baseada em API (Backend) e aplicação Web SPA (Frontend).

- **Backend:** 
  - NestJS 10.x (TypeScript)
  - Prisma ORM 5.x
  - Banco de dados PostgreSQL 15.x
  - Swagger (OpenAPI) para documentação automática de endpoints.
- **Frontend:** 
  - Flutter Web 3.x
  - Gerenciamento de estado com Provider/Riverpod.
  - Roteamento com `go_router` e formulários construídos sobre `flutter_form_builder`.
- **Infraestrutura e Deploy:**
  - Multi-tenant no mesmo VPS (ambientes de Produção e Staging isolados a nível de banco e porta).
  - Servidor Web Nginx como proxy reverso e servidor de arquivos estáticos.
  - PM2 para gerenciamento de processos Node.js do backend.
  - SSL automatizado via Let's Encrypt (Certbot).

---

## 3. Matriz de Perfis e Permissões (RBAC)

O acesso às funcionalidades é regulado por um controle de acesso baseado em papéis (RBAC). O sistema possui 6 perfis definidos:

| Papel | Código | Descrição | Escopo de Visualização / Ação |
| :--- | :--- | :--- | :--- |
| **Admin Relm** | `ADMIN_RELM` | Usuário com controle total do sistema e infraestrutura. | Global. Acesso irrestrito a configurações, usuários e dados. |
| **Gerente Relm** | `GERENTE_RELM` | Gestor operacional da Relm Bikes. | Global. Opera tudo, mas não pode gerenciar ou excluir administradores. |
| **Suporte Relm** | `SUPORTE_RELM` | Agente de atendimento e suporte técnico da Relm. | Operacional. Analisa garantias e atende chamados. Sem acesso a configurações. |
| **Loja** | `LOJA` | Proprietário ou funcionário de uma loja autorizada Relm. | Local. Vê apenas conteúdos, vantagens e garantias vinculados à sua loja. |
| **Distribuidor** | `DISTRIBUIDOR` | Parceiro B2B da marca (distribuição regional). | B2B. Acessa conteúdos B2B e relatórios estatísticos com dados mascarados. |
| **Cliente** | `CLIENTE` | Consumidor final e proprietário de uma Relm. | Pessoal. Visualiza apenas seus próprios dados, garantias e vantagens. |

---

## 4. Escopos de Módulos (V1 MVP vs. V2 Expansão)

### 4.1 Cadastro e Acompanhamento de Garantia
- **V1 (MVP):** 
  - Formulário público de solicitação de garantia com vinculação de dados do cliente, nota fiscal e número de série da bicicleta.
  - Máquina de estados (FSM) controlando o ciclo de vida do ticket.
  - Vinculação de tickets com lojas cadastradas no sistema.
- **V2 (Futuro):**
  - Chat direto e centralizado no protocolo de garantia entre Cliente ↔ Suporte Relm.
  - Upload direto de imagens de defeitos e nota fiscal para serviço de armazenamento de nuvem.

### 4.2 Clube de Vantagens
- **V1 (MVP):** 
  - Vitrine estática de vantagens e benefícios categorizados por perfil.
  - Cadastro de membros integrado à ativação de garantias.
- **V2 (Futuro):**
  - Divisão de membros em categorias/tiers (Ex: *Standard, Prime, VIP*) baseadas em compras ou tempo de fidelidade.
  - Módulo de resgate (*Redemption*) com geração de cupom/voucher único de desconto.

### 4.3 Cotação de Seguro
- **V1 (MVP):** 
  - Captura de leads de cotação de seguros integrada com o formulário de garantia ou tela avulsa. Envio manual/automático de e-mails para corretoras parceiras.
- **V2 (Futuro):**
  - Integração por API com seguradoras homologadas para cálculo de prêmio de seguro em tempo real e contratação assistida na própria plataforma.

### 4.4 Gestão de Eventos
- **V1 (MVP):** 
  - Cadastro de eventos (passeios, treinos coletivos, lançamentos) pela equipe administrativa.
  - Formulário de inscrição rápida para clientes finais, gerando confirmação de presença.
- **V2 (Futuro):**
  - Controle de check-in via QR Code no local do evento.
  - Emissão automática de certificados de participação e fotos do evento na galeria do portal.

### 4.5 Portais e Canais de Conteúdo
- **V1 (MVP):** 
  - **Portal Lojas & Distribuidores:** Espaço para publicação de avisos, manuais técnicos de produtos, e vantagens corporativas.
  - **Newsletter:** Cadastro de opt-in/opt-out simples.
- **V2 (Futuro):**
  - Dashboard analítico avançado para Lojas e Distribuidores acompanharem vendas regionais e taxas de defeitos.

---

## 5. Máquina de Estados da Garantia (FSM)

O módulo de garantia utiliza uma **Máquina de Estados de Transição Unidirecional (Forward-only)** para garantir consistência processual.

### 5.1 Estados do Fluxo de Garantia

1. `RECEBIDO`: A solicitação foi submetida pelo cliente e aguarda triagem do suporte.
2. `EM_ANALISE`: O suporte técnico está avaliando as fotos, serial e NF do produto.
3. `AGUARDANDO_CLIENTE`: Há falta de informações. Aguardando envio de dados/documentos pelo cliente.
4. `APROVADO`: Garantia autorizada. Fatura de substituição emitida ou reparo autorizado.
5. `REPROVADO`: Garantia negada por falta de enquadramento nas políticas da marca.
6. `FINALIZADO`: Processo encerrado de forma bem-sucedida (Terminal).
7. `CANCELADO`: Processo invalidado ou duplicado (Terminal - Apenas alcançável via override).

### 5.2 Regras de Transições Autorizadas

```
RECEBIDO ──(Iniciar Análise)──▶ EM_ANALISE ──(Aprovar)────▶ APROVADO ────(Finalizar)──▶ FINALIZADO
                                 │    ▲
                  (Falta Info)   │    │ (Cliente Respondeu)
                                 ▼    │
                           AGUARDANDO_CLIENTE
                                 │
                             (Reprovar)
                                 ▼
                             REPROVADO ────────────────────────(Finalizar)─────────────▶ FINALIZADO
```

As transições são protegidas com base no perfil de usuário e exigem o preenchimento de campos específicos:

| Estado Origem | Estado Destino | Papel Autorizado | Campos Obrigatórios na Transição |
| :--- | :--- | :--- | :--- |
| `RECEBIDO` | `EM_ANALISE` | `SUPORTE_RELM`, `GERENTE_RELM`, `ADMIN_RELM` | Nenhum. |
| `EM_ANALISE` | `AGUARDANDO_CLIENTE` | `SUPORTE_RELM`, `GERENTE_RELM`, `ADMIN_RELM` | `comment` (Explicar o que o cliente precisa anexar/enviar). |
| `AGUARDANDO_CLIENTE` | `EM_ANALISE` | `SUPORTE_RELM`, `GERENTE_RELM`, `ADMIN_RELM` | Nenhum. |
| `EM_ANALISE` | `APROVADO` | `GERENTE_RELM`, `ADMIN_RELM` | `comment` (Nota técnica interna). |
| `EM_ANALISE` | `REPROVADO` | `GERENTE_RELM`, `ADMIN_RELM` | `comment` + `rejection_reason` (Motivo formal enviado ao cliente). |
| `APROVADO` | `FINALIZADO` | `GERENTE_RELM`, `ADMIN_RELM` | `resolution` (Detalhamento do desfecho/entrega do item novo). |
| `REPROVADO` | `FINALIZADO` | `GERENTE_RELM`, `ADMIN_RELM` | `resolution` (Indicação de fechamento após negativa). |
| *Qualquer* | `CANCELADO` | `ADMIN_RELM` (Apenas via Override) | `comment` (Justificativa de cancelamento). |

### 5.3 Histórico e Auditoria da Garantia
Toda mudança de status da garantia grava um evento correspondente na tabela `warranty_events`. O evento registra obrigatoriamente:
- ID da garantia vinculada.
- Status de origem e status de destino.
- Comentário fornecido.
- Identificador do usuário executor.
- Data e hora exatas do evento (timestamp).

---

## 6. Privacidade e Proteção de Dados (LGPD)

O Relm Care+ foi concebido sob o princípio de **Privacy by Design**, garantindo conformidade com a LGPD:

### 6.1 Consentimento Versionado
- O banco de dados rastreia ativamente a política de privacidade aceita pelo usuário. No primeiro acesso de um cliente, o aceite é obrigatório.
- Registra-se o IP do usuário, o *User-Agent* do navegador e o *timestamp* exato da concordância.
- O consentimento para fins de marketing/comunicações é **separado** (opt-in explícito) e nunca pré-selecionado por padrão.

### 6.2 Minimização e Mascaramento de Dados
- Os portais de `LOJA` e `DISTRIBUIDOR` possuem visualização restrita de dados sensíveis dos clientes.
- CPF e número de telefone são mascarados nas interfaces de relatórios e tabelas do portal do lojista:
  - **CPF original:** `12345678901` ──▶ **Mascarado:** `123.***.**-01`
  - **Telefone original:** `11987654321` ──▶ **Mascarado:** `(11) 9****-4321`
- Qualquer exportação de relatório contendo dados sensíveis ou ações de visualização desmascarada gera uma linha na tabela `audit_logs` para fins de controle interno da empresa.

---

## 7. Estrutura do Banco de Dados (Esquema Resumido)

O banco de dados PostgreSQL modelado via Prisma segue as seguintes relações de negócio:

### 7.1 Customers (`customers`)
Identificado unicamente pelo e-mail de acesso. CPF é opcional na criação da conta, mas obrigatório ao acionar garantias de produtos.
- Relaciona-se com Garantias (`WarrantyClaim`), Matrículas em Eventos (`EventRegistration`), Assinatura de Newsletter e Solicitações de Seguros.

### 7.2 Products (`products`)
Contém o número de série único do quadro/componente da bike. Composto por Marca, Tipo de Produto, Modelo e número de série (`serial_number`).
- Relaciona-se com a Loja de Origem (`Store`), e Garantias (`WarrantyClaim`).

### 7.3 Stores e Distributors
Entidades que delimitam o escopo de visualização dos usuários representantes que acessam os respectivos portais corporativos.

---

## 8. Interfaces e Identidade Visual (UI/UX)

O visual do aplicativo deve seguir a paleta corporativa da Relm Bikes, garantindo sofisticação e legibilidade técnica:

- **Cor Primária (Teal):** `#00BCD4` (Utilizada em headers principais, ícones de foco, e botões de chamada primários).
- **Cor Secundária (Verde Relm):** `#4CAF50` (Badges de sucesso, indicadores de aprovação de garantia e ações positivas).
- **Fundo:** `#FFFFFF` e tons de cinza claro para delimitação de seções.
- **Responsividade:** O Flutter Web deve servir uma interface adaptável, permitindo ao lojista acionar o sistema via tablet ou celular, e ao administrador operar confortavelmente em telas widescreen.

---

## 9. Aditivos de Especificação Técnica — V2 (Expansão)

### 9.1 Módulo de Lógica de Negócios: Subsistema de Planos (Tiers)

#### 9.1.1 Modelo de Dados (Camada Prisma ORM / PostgreSQL)
Atualmente, o PRD trata o usuário consumidor como um perfil genérico `CLIENTE`. É mandatário injetar uma nova entidade de controle de assinaturas e planos.

* **Alteração na Tabela `customers`:** Inserir o campo do tipo Enum denominado `current_tier` mapeado para o `TierLevel`.
* **Criação do Enum `TierLevel`:** Valores estritos: `CARE` (Base/Gratuito) e `PLUS` (Premium/Anuidade).
* **Criação do Enum `SubStatus`:** Valores: `ACTIVE`, `EXPIRED`, `DOWNGRADED`.
* **Criação da Tabela `subscriptions`:**
```prisma
model Subscription {
  id                String      @id @default(uuid())
  customerId        String      @unique
  customer          Customer    @relation(fields: [customerId], references: [id])
  tier              TierLevel   @default(CARE)
  status            SubStatus   // Enum: ACTIVE, EXPIRED, DOWNGRADED
  activatedAt       DateTime    @default(now())
  expiresAt         DateTime?   // Null se o tier for CARE
  updatedAt         DateTime    @updatedAt
  autoRenew         Boolean     @default(false)

  @@index([customerId, status])
}
```

#### 9.1.2 Regras de Transição de Estado de Planos (Backend - NestJS)
* **Gatilho de Ativação Automática (Venda de Bike):** Endpoint privado e autenticado via `ApiKey` (`POST /v1/integration/sales-trigger`) para comunicação do ERP/PDV das lojas físicas.
  * *Payload requerido:*
    ```json
    {
      "customer_email": "string",
      "product_serial_number": "string",
      "invoice_type": "BIKE" | "ACCESSORY"
    }
    ```
  * *Lógica Interna:* Se `invoice_type == BIKE`, o sistema deve criar/atualizar a `Subscription` do usuário para `tier: PLUS`, definindo `expiresAt = now() + 365 dias` e status `ACTIVE` com geração de log de auditoria. Se `invoice_type == ACCESSORY`, ativa o `tier: CARE` com `expiresAt = null` e status `ACTIVE`.
* **Rotina Automática de Expiração (Cron Job):** Implementar um job diário (`@Cron('0 1 * * *')` no NestJS) executado às 01:00 AM para varrer a tabela `subscriptions`.
  * *Condicional:* Se `status == ACTIVE` E `expiresAt < now()` E `autoRenew == false`:
    1. Alterar `tier` para `CARE`.
    2. Alterar `status` para `DOWNGRADED`.
    3. Definir `expiresAt = null`.
    4. Disparar evento no barramento de notificações.

---

### 9.2 Módulo de Gamificação: Mecânica de Pontos e Cashback

#### 9.2.1 Modelo de Dados de Pontuação
Para evitar vulnerabilidades de concorrência de saldo (ex: double-spending de pontos), o saldo do cliente **nunca** deve ser um campo incremental estático na tabela do usuário. O saldo deve ser calculado através da soma histórica de um livro-razão (*ledger*).

* **Criação da Tabela `points_ledger`:**
```prisma
enum PointTxType {
  EARN
  REDEEM
  EXPIRE
}

model PointsLedger {
  id              String        @id @default(uuid())
  customerId      String
  customer        Customer      @relation(fields: [customerId], references: [id])
  transactionType PointTxType   // Enum: EARN, REDEEM, EXPIRE
  amount          Int           // Inteiro Positivo para EARN, Negativo para REDEEM/EXPIRE
  description     String        // Ex: "Compra de Pneu — NF 1234" ou "Resgate Selim"
  referenceId     String?       // ID do pedido ou do cupom gerado
  createdAt       DateTime      @default(now())
  expiresAt       DateTime?     // Regra de validade dos pontos (Ex: createdAt + 12 meses)
  isExpired       Boolean       @default(false)

  @@index([customerId])
}
```

#### 9.2.2 Motor de Cálculo de Pontos (Engine de Acúmulo)
No service de criação de transações financeiras/integração do ERP, injetar a regra de multiplicador com base no plano ativo consultado na tabela `subscriptions`:
* Se o cliente for `tier == CARE`: Multiplicador = `1.0` (R$ 1,00 gasto = 1 ponto inserido no `PointsLedger`).
* Se o cliente for `tier == PLUS`: Multiplicador = `2.0` (R$ 1,00 gasto = 2 pontos inseridos no `PointsLedger`).
* **Tratamento de Arredondamento:** O valor decimal da compra deve passar por truncamento matemático para baixo (`Math.floor()`) antes da multiplicação por inteiros.

---

### 9.3 Módulo de Oficina, Logística e Agendamento Prioritário

#### 9.3.1 Modelo de Dados para Atendimento na Oficina
* **Criação da Tabela `service_orders` (Ordens de Serviço):**
```prisma
enum ServiceType {
  REVISION_BASIC
  REVISION_COMPLETE
  DIAGNOSTIC
}

enum PriorityLevel {
  STANDARD
  HIGH_PRIORITY
}

enum ServiceStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model ServiceOrder {
  id              String        @id @default(uuid())
  customerId      String
  customer        Customer      @relation(fields: [customerId], references: [id])
  storeId         String
  store           Store         @relation(fields: [storeId], references: [id])
  bikeModel       String
  serviceType     ServiceType   // Enum: REVISION_BASIC, REVISION_COMPLETE, DIAGNOSTIC
  priority        PriorityLevel // Enum: STANDARD, HIGH_PRIORITY
  deliveryRequest Boolean       @default(false) // Solicitação de busca/entrega
  scheduledFor    DateTime
  status          ServiceStatus // Enum: SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
  createdAt       DateTime      @default(now())
}
```

#### 9.3.2 Lógica de Alocação de Slots e Regras de Negócio de Oficina
* **Fila Prioritária de Agendamento:** No service de busca de horários disponíveis (`GET /v1/services/available-slots`), se o parâmetro identificador do cliente apontar um usuário ativo no plano `PLUS`, a API deve expor *slots bloqueados de contingência* (horários reservados exclusivamente para alta prioridade na oficina), mudando a flag `priority` da `ServiceOrder` criada automaticamente para `HIGH_PRIORITY`.
* **Validação de Gratuidade (Cota de Revisões):** O sistema deve limitar a criação de ordens de serviço com custo zero.
  * Se `tier == CARE`: Permitir apenas 1 transação por ano do tipo `REVISION_BASIC`. Bloquear se houver registro no intervalo `< 365 dias`.
  * Se `tier == PLUS`: Permitir `REVISION_COMPLETE` e liberar a flag `deliveryRequest` (logística de busca e entrega sem custos adicionais no faturamento do chamado).

---

### 9.4 Módulo de Resgate de Recompensas (Redemption Catálogo)

#### 9.4.1 Modelo de Dados para Recompensas (Camada Prisma ORM)
Adição de tabelas explícitas no Prisma para gerenciar o inventário físico de recompensas e a entrega de vouchers:

```prisma
model CatalogItem {
  id          String    @id @default(uuid())
  title       String
  description String    @db.Text
  pointsCost  Int       @map("points_cost")
  stock       Int       @default(0)
  active      Boolean   @default(true)
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  
  vouchers    Voucher[]
  
  @@map("catalog_items")
}

enum VoucherStatus {
  UNUSED
  USED
  EXPIRED
}

model Voucher {
  id            String        @id @default(uuid())
  code          String        @unique // Hash único de 8 caracteres (Ex: RLM-X89J2)
  status        VoucherStatus @default(UNUSED)
  customerId    String        @map("customer_id")
  catalogItemId String        @map("catalog_item_id")
  expiresAt     DateTime      @map("expires_at")
  createdAt     DateTime      @default(now()) @map("created_at")
  usedAt        DateTime?     @map("used_at")
  
  customer    Customer    @relation(fields: [customerId], references: [id])
  catalogItem CatalogItem @relation(fields: [catalogItemId], references: [id])
  
  @@map("vouchers")
}
```

#### 9.4.2 Workflow Transacional de Resgate
Para evitar estouro de estoque físico e fraude de pontos, o endpoint `POST /v1/rewards/redeem` deve rodar sob uma **Transação de Banco de Dados Isolada (Serializable Transaction)** no Prisma, executando estritamente os 4 passos abaixo na mesma operação:
1. **Verificação de Saldo Atual:** Executar um `SUM(amount)` na tabela `points_ledger` filtrando pelo `customerId`. O resultado deve ser rigorosamente maior ou igual ao custo em pontos do produto exigido pelo catálogo (`pointsCost`). Se menor, abortar com `HTTP 400 - Insufficient Points`.
2. **Verificação de Estoque:** Consultar a tabela de itens do catálogo (`CatalogItem`). Se o estoque for igual a zero, abortar com `HTTP 422 - Out of Stock`.
3. **Dedução do Saldo:** Inserir uma linha na tabela `points_ledger` com `amount` negativo correspondente ao valor do resgate, anotando o `transactionType = REDEEM`.
4. **Geração de Voucher Alfanumérico:** Inserir uma linha na tabela `vouchers` gerando um código criptográfico hash único de 8 caracteres em caixa alta (Ex: `RLM-X89J2`). Este código deve possuir status `UNUSED` e data de expiração fixa para 60 dias.
5. **Tecnologia Utilizada:** Prisma `$transaction` com nível de isolamento explícito `Prisma.TransactionIsolationLevel.Serializable` para proteção contra *race conditions*.

---

### 9.5 Módulo de Integração de Canais: WhatsApp Concierge API

#### 9.5.1 Requisitos de Infraestrutura e Webhooks
* O backend NestJS deve disponibilizar uma rota pública e protegida por validação de token da Meta: `POST /v1/webhooks/whatsapp` (e correspondente `GET` para o handshake de validação).
* O token do handshake será configurado como variável de ambiente no arquivo `.env` como `WHATSAPP_VERIFY_TOKEN` e validado de forma nativa na aplicação NestJS.
* **Mapeamento de Comandos via Processamento de Linguagem/Regex Simples:**
  * Quando o webhook receber um payload de mensagem contendo o texto exatamente igual a `"/saldo"` ou `"/revisao"`, o manipulador da API deve:
    1. Capturar o número de telefone de origem do payload do WhatsApp.
    2. Buscar o usuário correspondente mascarando o número no banco de dados.
    3. Consultar a `Subscription` do usuário. Se o usuário **não** for `tier == PLUS`, retornar mensagem padrão informando que o canal Concierge é exclusivo para membros Premium e encerrar a sessão de chat.
    4. Caso seja `PLUS`, buscar o saldo consolidado no `PointsLedger` ou o status da próxima revisão e disparar uma requisição `POST` para a API da Meta consumindo um *Template Message* homologado, respondendo o usuário em tempo real.

#### 9.5.2 Eventos Assíncronos no Backend
* Mudanças críticas de plano disparadas por rotinas cron ou ações do ERP emitem eventos assíncronos no barramento em memória através do módulo `@nestjs/event-emitter` do NestJS (Ex: evento `subscription.downgraded`).
* Os serviços listeners (Email, WhatsApp/Meta, Push) se inscrevem nos eventos de forma totalmente desacoplada.

---

### 9.6 Arquitetura de Frontend (Instruções Flutter Web)

#### 9.6.1 Adaptação de UI Baseada em Estados de Assinatura
O layout do sistema deve se adaptar visualmente injetando dinamicamente estilos CSS/Flutter com base no valor reativo do enum `TierLevel` do usuário logado:
* **Gerenciador de Estado:** Utilizar o Riverpod com `StateNotifierProvider` ou `NotifierProvider` para expor o estado do usuário logado reativamente para toda a árvore de widgets.
* Se o estado do Provider retornar `Customer.tier == CARE`:
  * Aplicar a identidade visual padrão do PRD V1 (Primária Teal `#00BCD4` e Verde `#4CAF50`).
  * Exibir banners nativos bloqueados (Widgets com opacidade reduzida e ícone de cadeado) convidando o usuário a fazer o upgrade para o plano Care Plus.
* Se o estado do Provider retornar `Customer.tier == PLUS`:
  * Modificar dinamicamente os componentes de borda, badges e acentos de botões para a cor **Gold / Ouro Corporativo** (`#D4AF37`) conforme preconizado no PPT da marca.
  * Habilitar o botão flutuante e a seção "Falar com meu Concierge no WhatsApp" redirecionando via URL Scheme (`https://wa.me/...`) diretamente para a conta corporativa integrada.
