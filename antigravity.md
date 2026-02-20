# 🚀 Relm Care+ — Source of Truth (antigravity.md)

> **Documento Definitivo do Projeto**  
> Última atualização: 2026-02-20  
> Versão: 1.0.0

---

## 📋 Índice

1. [Visão do Produto](#visão-do-produto)
2. [Identificadores Principais](#identificadores-principais)
3. [Perfis e Permissões (RBAC)](#perfis-e-permissões-rbac)
4. [Módulos (V1 vs V2)](#módulos-v1-vs-v2)
5. [Modelo de Dados](#modelo-de-dados)
6. [Máquina de Estados (FSM)](#máquina-de-estados-fsm)
7. [Stack Tecnológica](#stack-tecnológica)
8. [Arquitetura e Infraestrutura](#arquitetura-e-infraestrutura)
9. [LGPD e Segurança](#lgpd-e-segurança)
10. [Endpoints da API](#endpoints-da-api)
11. [UI/UX Guidelines](#uiux-guidelines)
12. [Deploy e Operação](#deploy-e-operação)

---

## 1. Visão do Produto

**Relm Care+** é um Centro de Serviços ao Cliente (CRM) completo da Relm Bikes que oferece:

### 🎯 Funcionalidades Principais

1. **Cadastro de Garantia**
   - Cliente registra produto Relm com nota fiscal
   - Sistema cria protocolo e gerencia todo ciclo de vida
   - Vinculação automática com lojas revendedoras

2. **Clube de Vantagens**
   - Benefícios exclusivos para clientes Relm
   - Sistema de tiers (V2: PRIME, VIP)
   - Resgate de vantagens (V2)

3. **Cotação de Seguro para Bikes**
   - V1: Coleta lead e encaminha para parceiros
   - V2: Integração com seguradoras

4. **Inscrição para Eventos**
   - Eventos Relm (lançamentos, provas, encontros)
   - Inscrição online com confirmação

5. **Newsletter**
   - Comunicação marketing com consentimento LGPD
   - Gestão de opt-in/opt-out

6. **Portal Lojas**
   - Comunicação Marca ↔ Lojas
   - Conteúdo institucional
   - Comunicados, materiais, vantagens para revendedores

7. **Portal B2B Distribuidores**
   - Conteúdo e comunicação comercial
   - Materiais de vendas
   - Relatórios (com mascaramento de dados sensíveis)

---

## 2. Identificadores Principais

### 🆔 Mudança Crítica de Arquitetura

**Cliente:**
- **Identificador primário:** `email` (único, obrigatório)
- **CPF:** opcional, usado apenas para garantia
- **Normalização CPF:** armazenado como texto com apenas números (11 dígitos)
- **Validação:** dígitos verificadores obrigatórios

**Produto:**
- **Identificador primário:** `serial_number` (único, obrigatório)
- **Composição:** MARCA + PRODUTO + MODELO + SERIAL NUMBER
- **Índice único:** garantir unicidade no banco

### 📦 Estrutura de Produto

```
MARCA: Relm Bikes
PRODUTO: Road / MTB / Gravel / E-bike / Acessórios
MODELO: Apex 2024 / Summit Pro / etc.
SERIAL NUMBER: RELM2024ABC123456
```

---

## 3. Perfis e Permissões (RBAC)

### 👥 Papéis do Sistema

| Papel | Código | Descrição | Escopo |
|-------|--------|-----------|--------|
| **Admin Relm** | `ADMIN_RELM` | Controle total do sistema | Global |
| **Gerente Relm** | `GERENTE_RELM` | Opera tudo, não gerencia admins | Global |
| **Suporte Relm** | `SUPORTE_RELM` | Atendimento, sem config/usuários | Operacional |
| **Loja** | `LOJA` | Portal revendedor | Própria loja |
| **Distribuidor** | `DISTRIBUIDOR` | Portal B2B | Próprio distribuidor |
| **Cliente** | `CLIENTE` | Portal do cliente | Próprios dados |

### 🔒 Regras de Escopo

#### Cliente (`CLIENTE`)
- ✅ Visualiza apenas seus próprios dados
- ✅ Filtros por `customer_id` ou `email`
- ❌ Não vê dados de outros clientes
- ❌ Não altera status de garantia (apenas envia mensagens em V2)

#### Loja (`LOJA`)
- ✅ Vê garantias vinculadas à loja
- ✅ Vê conteúdo e comunicados para lojas
- ⚠️ CPF/telefone mascarados (exceto quando necessário)
- ⚠️ Transições operacionais de garantia (sem aprovar/reprovar/cancelar)
- ❌ Não vê dados de outras lojas

#### Distribuidor (`DISTRIBUIDOR`)
- ✅ Vê conteúdo e relatórios B2B autorizados
- ⚠️ CPF mascarado por padrão
- ⚠️ Dados agregados apenas
- ❌ Não vê dados detalhados de clientes

#### Suporte Relm (`SUPORTE_RELM`)
- ✅ Opera atendimento completo
- ✅ Transições de garantia (exceto finalização)
- ❌ Não cria/edita usuários
- ❌ Não altera configurações do sistema

#### Gerente Relm (`GERENTE_RELM`)
- ✅ Todas as operações exceto gerenciar admins
- ✅ Cria usuários SUPORTE_RELM, LOJA, DISTRIBUIDOR
- ✅ Exportações e relatórios

#### Admin Relm (`ADMIN_RELM`)
- ✅ Controle total
- ✅ Gerencia todos os usuários
- ✅ Configurações do sistema

### 🛡️ Mascaramento de Dados

**CPF:**
```
Original: 12345678901
Mascarado: 123.***.**-01
```

**Telefone:**
```
Original: 11987654321
Mascarado: (11) 9****-4321
```

**Regras:**
- `CLIENTE`: vê próprios dados completos
- `ADMIN_RELM`, `GERENTE_RELM`, `SUPORTE_RELM`: veem dados completos
- `LOJA`, `DISTRIBUIDOR`: veem dados mascarados (com auditoria)

---

## 4. Módulos (V1 vs V2)

### 🚀 V1 — MVP Funcional

| Módulo | Status | Descrição |
|--------|--------|-----------|
| **Garantia** | ✅ Completo | Form público + FSM + admin |
| **Clube de Vantagens** | ✅ Simples | Lista de benefícios, sem resgate |
| **Seguro** | ✅ Lead | Coleta dados e gera protocolo |
| **Eventos** | ✅ Completo | Lista + inscrição |
| **Newsletter** | ✅ Completo | Opt-in com consentimento |
| **Portal Cliente** | ✅ Básico | Login + "Meus dados" + "Minhas garantias" |
| **Portal Loja** | ✅ Básico | Comunicados + conteúdo |
| **Portal Distribuidor** | ✅ Básico | Conteúdo B2B |
| **Admin** | ✅ Completo | CRUD + FSM + relatórios |

### 🔮 V2 — Expansão

| Módulo | Status | Descrição |
|--------|--------|-----------|
| **Garantia** | 🔄 Expandido | Chat cliente-suporte no protocolo |
| **Clube de Vantagens** | 🔄 Expandido | Sistema de resgate + tiers |
| **Seguro** | 🔄 Integração | API seguradoras + cotação real |
| **Uploads** | 🔄 Novo | Storage para NF, fotos de produtos |
| **Notificações** | 🔄 Novo | Email + SMS + Push |
| **Analytics** | 🔄 Novo | Dashboard de métricas |
| **Retenção LGPD** | 🔄 Novo | Jobs de anonimização automática |

---

## 5. Modelo de Dados

### 🗄️ PostgreSQL + Prisma

#### 5.1 Tabelas Núcleo (CRM)

##### `customers`
```prisma
model Customer {
  id            String    @id @default(uuid())
  email         String    @unique
  password_hash String?   // Null para cadastros via garantia sem senha
  full_name     String
  phone         String
  cpf           String?   // Opcional, normalizado (11 dígitos)
  birth_date    DateTime? // Opcional
  address       String?
  city          String?
  state         String?
  country       String?   @default("Brasil")
  zip_code      String?
  
  // Marketing
  marketing_consent Boolean @default(false)
  
  // Metadata
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  
  // Relations
  warranty_claims        WarrantyClaim[]
  benefit_memberships    BenefitMembership[]
  event_registrations    EventRegistration[]
  newsletter_subscription NewsletterSubscription?
  insurance_quotes       InsuranceQuote[]
  
  @@index([email])
  @@index([cpf])
}
```

##### `products`
```prisma
model Product {
  id                    String    @id @default(uuid())
  serial_number         String    @unique
  brand                 String    @default("Relm Bikes")
  product_type          String    // Road, MTB, Gravel, E-bike, Acessórios
  model                 String
  purchase_date         DateTime?
  purchase_invoice_number String?
  purchase_store_name   String?
  store_id              String?
  
  // Metadata
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  
  // Relations
  store          Store?          @relation(fields: [store_id], references: [id])
  warranty_claims WarrantyClaim[]
  insurance_quotes InsuranceQuote[]
  
  @@index([serial_number])
  @@index([store_id])
}
```

##### `stores`
```prisma
model Store {
  id          String   @id @default(uuid())
  trade_name  String   // Nome fantasia
  legal_name  String   // Razão social
  cnpj        String?  @unique
  aliases     String[] // Variações do nome
  email       String?
  phone       String?
  address     String?
  city        String
  state       String
  active      Boolean  @default(true)
  
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  
  // Relations
  products        Product[]
  users           User[]
  warranty_claims WarrantyClaim[]
  
  @@index([city, state])
}
```

##### `users`
```prisma
enum UserRole {
  ADMIN_RELM
  GERENTE_RELM
  SUPORTE_RELM
  LOJA
  DISTRIBUIDOR
  CLIENTE
}

model User {
  id             String    @id @default(uuid())
  name           String
  email          String    @unique
  password_hash  String
  role           UserRole
  store_id       String?
  distributor_id String?
  active         Boolean   @default(true)
  
  // Tokens
  refresh_token  String?
  
  created_at     DateTime  @default(now())
  updated_at     DateTime  @updatedAt
  
  // Relations
  store        Store?       @relation(fields: [store_id], references: [id])
  distributor  Distributor? @relation(fields: [distributor_id], references: [id])
  warranty_events WarrantyEvent[]
  
  @@index([email])
  @@index([role])
}
```

##### `distributors`
```prisma
model Distributor {
  id         String   @id @default(uuid())
  trade_name String
  legal_name String
  cnpj       String?  @unique
  active     Boolean  @default(true)
  
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  
  // Relations
  users User[]
}
```

#### 5.2 Módulo Garantia (V1 Obrigatório)

##### `warranty_claims`
```prisma
enum WarrantyStatus {
  RECEBIDO
  EM_ANALISE
  AGUARDANDO_CLIENTE
  APROVADO
  REPROVADO
  FINALIZADO
  CANCELADO
}

enum LinkStatus {
  PENDING_REVIEW  // Aguardando análise Relm
  CONFIRMED       // Loja confirmada
  NOT_FOUND       // Loja não encontrada
}

model WarrantyClaim {
  id                    String         @id @default(uuid())
  protocol_number       String         @unique
  
  // Relacionamentos
  customer_id           String
  product_id            String
  store_id              String?
  
  // Dados da nota fiscal
  invoice_number        String
  invoice_attachment_url String?       // V2: upload NF
  
  // Dados da loja (informados pelo cliente)
  purchase_store_name   String
  purchase_store_city   String?
  purchase_store_state  String?
  
  // Status
  link_status           LinkStatus     @default(PENDING_REVIEW)
  status                WarrantyStatus @default(RECEBIDO)
  
  // Observações
  customer_notes        String?
  admin_notes           String?
  rejection_reason      String?
  resolution            String?
  
  created_at            DateTime       @default(now())
  updated_at            DateTime       @updatedAt
  
  // Relations
  customer Customer @relation(fields: [customer_id], references: [id])
  product  Product  @relation(fields: [product_id], references: [id])
  store    Store?   @relation(fields: [store_id], references: [id])
  events   WarrantyEvent[]
  
  @@index([protocol_number])
  @@index([customer_id])
  @@index([status])
  @@index([created_at])
}
```

##### `warranty_events`
```prisma
model WarrantyEvent {
  id                String   @id @default(uuid())
  claim_id          String
  event_type        String   // STATUS_CHANGE, COMMENT_ADDED, STORE_LINKED, etc.
  from_status       String?
  to_status         String?
  comment           String?
  created_by_user_id String?
  
  created_at        DateTime @default(now())
  
  // Relations
  claim      WarrantyClaim @relation(fields: [claim_id], references: [id])
  created_by User?         @relation(fields: [created_by_user_id], references: [id])
  
  @@index([claim_id])
  @@index([created_at])
}
```

#### 5.3 Clube de Vantagens (V1 Simples, V2 Expandido)

##### `benefit_memberships`
```prisma
enum MembershipStatus {
  ACTIVE
  INACTIVE
}

model BenefitMembership {
  id          String           @id @default(uuid())
  customer_id String
  status      MembershipStatus @default(ACTIVE)
  tier        String?          // V2: PRIME, VIP, etc.
  joined_at   DateTime         @default(now())
  
  created_at  DateTime         @default(now())
  updated_at  DateTime         @updatedAt
  
  // Relations
  customer Customer @relation(fields: [customer_id], references: [id])
  redemptions BenefitRedemption[]
  
  @@unique([customer_id])
}
```

##### `benefits`
```prisma
model Benefit {
  id          String   @id @default(uuid())
  title       String
  description String
  terms       String?  // Termos e condições
  valid_from  DateTime
  valid_until DateTime
  active      Boolean  @default(true)
  
  // Segmentação
  target_role String?  // CLIENTE, LOJA, DISTRIBUIDOR, null = todos
  
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  
  // Relations
  redemptions BenefitRedemption[]
  
  @@index([active, valid_from, valid_until])
}
```

##### `benefit_redemptions` (V2 Opcional)
```prisma
model BenefitRedemption {
  id            String   @id @default(uuid())
  benefit_id    String
  customer_id   String?
  store_id      String?
  membership_id String
  
  redeemed_at   DateTime @default(now())
  
  // Relations
  benefit    Benefit           @relation(fields: [benefit_id], references: [id])
  membership BenefitMembership @relation(fields: [membership_id], references: [id])
  
  @@index([redeemed_at])
}
```

#### 5.4 Seguro (V1 como "lead/solicitação")

##### `insurance_quotes`
```prisma
model InsuranceQuote {
  id              String   @id @default(uuid())
  protocol_number String   @unique
  customer_id     String
  product_id      String?
  
  // Dados do seguro
  bike_value      Decimal? @db.Decimal(10, 2)
  city            String?
  state           String?
  
  // V2: campos de integração
  quote_value     Decimal? @db.Decimal(10, 2)
  insurance_company String?
  status          String   @default("PENDING") // PENDING, QUOTED, CONTRACTED, REJECTED
  
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  
  // Relations
  customer Customer @relation(fields: [customer_id], references: [id])
  product  Product? @relation(fields: [product_id], references: [id])
  
  @@index([protocol_number])
  @@index([customer_id])
}
```

#### 5.5 Eventos e Newsletter (V1)

##### `events`
```prisma
model Event {
  id          String   @id @default(uuid())
  title       String
  description String
  location    String
  start_at    DateTime
  end_at      DateTime
  max_participants Int?
  active      Boolean  @default(true)
  
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  
  // Relations
  registrations EventRegistration[]
  
  @@index([start_at])
}
```

##### `event_registrations`
```prisma
model EventRegistration {
  id          String   @id @default(uuid())
  event_id    String
  customer_id String
  
  created_at  DateTime @default(now())
  
  // Relations
  event    Event    @relation(fields: [event_id], references: [id])
  customer Customer @relation(fields: [customer_id], references: [id])
  
  @@unique([event_id, customer_id])
  @@index([event_id])
}
```

##### `newsletter_subscriptions`
```prisma
enum SubscriptionStatus {
  ACTIVE
  UNSUBSCRIBED
}

model NewsletterSubscription {
  id          String             @id @default(uuid())
  email       String             @unique
  customer_id String?            @unique
  status      SubscriptionStatus @default(ACTIVE)
  
  created_at  DateTime           @default(now())
  updated_at  DateTime           @updatedAt
  
  // Relations
  customer Customer? @relation(fields: [customer_id], references: [id])
  
  @@index([email])
  @@index([status])
}
```

#### 5.6 Conteúdo e Comunicação (Marca ↔ Loja / Distribuidor)

##### `content_items`
```prisma
model ContentItem {
  id           String    @id @default(uuid())
  title        String
  body         String    // Markdown
  category     String?   // Comunicados, Manuais, Promoções, etc.
  target_role  String?   // LOJA, DISTRIBUIDOR, null = todos
  published_at DateTime?
  active       Boolean   @default(true)
  
  created_at   DateTime  @default(now())
  updated_at   DateTime  @updatedAt
  
  @@index([active, published_at])
  @@index([target_role])
}
```

##### `announcements`
```prisma
model Announcement {
  id           String    @id @default(uuid())
  title        String
  message      String
  target_role  String?   // LOJA, DISTRIBUIDOR, null = todos
  published_at DateTime  @default(now())
  active       Boolean   @default(true)
  
  created_at   DateTime  @default(now())
  updated_at   DateTime  @updatedAt
  
  @@index([active, published_at])
}
```

#### 5.7 LGPD e Auditoria

##### `privacy_policy_versions`
```prisma
model PrivacyPolicyVersion {
  id         String   @id @default(uuid())
  version    String   @unique
  content    String   // Markdown
  active     Boolean  @default(false)
  
  created_at DateTime @default(now())
  
  // Relations
  consents PrivacyConsent[]
}
```

##### `privacy_consents`
```prisma
model PrivacyConsent {
  id         String   @id @default(uuid())
  customer_id String
  policy_version_id String
  accepted_at DateTime @default(now())
  ip_address  String?
  user_agent  String?
  
  // Relations
  policy_version PrivacyPolicyVersion @relation(fields: [policy_version_id], references: [id])
  
  @@index([customer_id])
}
```

##### `audit_logs`
```prisma
model AuditLog {
  id         String   @id @default(uuid())
  user_id    String?
  action     String   // EXPORT_DATA, VIEW_SENSITIVE, etc.
  entity     String   // customers, warranty_claims, etc.
  entity_id  String?
  metadata   Json?
  ip_address String?
  
  created_at DateTime @default(now())
  
  @@index([user_id, created_at])
  @@index([action])
}
```

---

## 6. Máquina de Estados (FSM)

### 🔄 Garantia — Workflow Completo

#### Estados
```
RECEBIDO → EM_ANALISE → AGUARDANDO_CLIENTE → EM_ANALISE → APROVADO → FINALIZADO
                      ↓                                    ↓
                  REPROVADO → FINALIZADO              CANCELADO
```

#### Transições Permitidas

| De | Para | Papel | Obrigatoriedade |
|----|------|-------|-----------------|
| `RECEBIDO` | `EM_ANALISE` | SUPORTE+, GERENTE, ADMIN | — |
| `EM_ANALISE` | `AGUARDANDO_CLIENTE` | SUPORTE+, GERENTE, ADMIN | **comment** obrigatório |
| `AGUARDANDO_CLIENTE` | `EM_ANALISE` | SUPORTE+, GERENTE, ADMIN | — |
| `EM_ANALISE` | `APROVADO` | GERENTE, ADMIN | — |
| `EM_ANALISE` | `REPROVADO` | GERENTE, ADMIN | **comment** + **rejection_reason** |
| `APROVADO` | `FINALIZADO` | GERENTE, ADMIN | **resolution** obrigatório |
| `REPROVADO` | `FINALIZADO` | GERENTE, ADMIN | **resolution** obrigatório |
| `*` | `CANCELADO` | ADMIN | — |

#### Estados Terminais
- `FINALIZADO`
- `CANCELADO`

#### Validações

1. **AGUARDANDO_CLIENTE**
   - `comment` obrigatório (explica o que cliente deve fornecer)

2. **REPROVADO**
   - `comment` obrigatório
   - `rejection_reason` obrigatório

3. **FINALIZADO**
   - `resolution` obrigatório (descreve como foi resolvido)

#### Regras de Papel

**CLIENTE:**
- ❌ Não altera status
- ✅ V2: pode enviar mensagens no protocolo quando `AGUARDANDO_CLIENTE`

**LOJA:**
- ❌ Não altera status de garantia
- ✅ Pode comentar (V2)

**SUPORTE_RELM:**
- ✅ `RECEBIDO` → `EM_ANALISE`
- ✅ `EM_ANALISE` → `AGUARDANDO_CLIENTE`
- ✅ `AGUARDANDO_CLIENTE` → `EM_ANALISE`
- ❌ Não aprova/reprova/finaliza

**GERENTE_RELM:**
- ✅ Todas as transições exceto `CANCELADO`

**ADMIN_RELM:**
- ✅ Todas as transições (incluindo `CANCELADO`)

#### Auditoria

Toda transição gera registro em `warranty_events`:
```typescript
{
  claim_id: uuid,
  event_type: "STATUS_CHANGE",
  from_status: "EM_ANALISE",
  to_status: "APROVADO",
  comment: "Aprovado após análise da NF",
  created_by_user_id: uuid,
  created_at: timestamp
}
```

---

## 7. Stack Tecnológica

### 🎨 Frontend
- **Framework:** Flutter Web 3.x
- **State Management:** Provider / Riverpod
- **HTTP Client:** Dio
- **Router:** go_router
- **Forms:** flutter_form_builder

### ⚙️ Backend
- **Framework:** NestJS 10.x + TypeScript
- **Runtime:** Node.js 20.x LTS
- **ORM:** Prisma 5.x
- **Validation:** class-validator + class-transformer
- **Auth:** JWT (jsonwebtoken + @nestjs/jwt)
- **Documentation:** Swagger (@nestjs/swagger)

### 🗄️ Database
- **SGBD:** PostgreSQL 15.x
- **Host:** localhost:5432
- **Databases:**
  - `relm_careplus_prod`
  - `relm_careplus_staging`

### 🚀 DevOps
- **Process Manager:** PM2
- **Web Server:** Nginx (reverse proxy + static serving)
- **SSL:** Certbot (Let's Encrypt)
- **Logs:** PM2 logs + Nginx logs

---

## 8. Arquitetura e Infraestrutura

### 🏗️ Estrutura de Diretórios

```
/var/www/relm-careplus-prod/
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── customers/
│   │   ├── products/
│   │   ├── warranty/
│   │   ├── benefits/
│   │   ├── insurance/
│   │   ├── events/
│   │   ├── newsletter/
│   │   ├── content/
│   │   ├── reports/
│   │   ├── common/ (guards, decorators, interceptors)
│   │   └── main.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── .env.production
│   └── package.json
├── frontend/
│   ├── lib/
│   │   ├── screens/
│   │   ├── widgets/
│   │   ├── models/
│   │   ├── services/
│   │   └── main.dart
│   └── pubspec.yaml

/var/www/relm-careplus-staging/ (mesma estrutura)

/var/www/relm-careplus-prod-web/ (build Flutter)
/var/www/relm-careplus-staging-web/ (build Flutter)
```

### 🌐 Domínios e Portas

| Ambiente | Frontend | API | Porta Backend |
|----------|----------|-----|---------------|
| **Produção** | careplus.relmbikes.com.br | api-careplus.relmbikes.com.br | 3001 |
| **Staging** | staging-careplus.relmbikes.com.br | staging-api-careplus.relmbikes.com.br | 3002 |

### 🔧 PM2 Processes

```javascript
// ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'relm-careplus-prod-backend',
      cwd: '/var/www/relm-careplus-prod/backend',
      script: 'dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'relm-careplus-staging-backend',
      cwd: '/var/www/relm-careplus-staging/backend',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'staging',
        PORT: 3002
      }
    }
  ]
};
```

### 🌍 Nginx Configuration

#### `/etc/nginx/sites-available/relm-careplus-prod.conf`
```nginx
# Frontend
server {
    listen 80;
    server_name careplus.relmbikes.com.br;
    
    root /var/www/relm-careplus-prod-web;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # SSL via certbot
}

# API
server {
    listen 80;
    server_name api-careplus.relmbikes.com.br;
    
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # SSL via certbot
}
```

#### `/etc/nginx/sites-available/relm-careplus-staging.conf`
(Mesma estrutura, trocando domínios e porta 3002)

---

## 9. LGPD e Segurança

### 🔒 Requisitos Legais

#### 9.1 Política de Privacidade
- ✅ Versionada (tabela `privacy_policy_versions`)
- ✅ Aceite obrigatório no primeiro cadastro
- ✅ Armazena IP + User-Agent + timestamp do aceite
- ✅ Disponível em `/politica-privacidade`

#### 9.2 Consentimentos Separados
```
[ ] Aceito a Política de Privacidade (OBRIGATÓRIO)
[ ] Aceito receber comunicações da Relm Bikes (OPCIONAL)
```

- **Garantia:** consentimento privacidade obrigatório
- **Newsletter:** consentimento marketing obrigatório
- **Clube de Vantagens:** consentimento marketing obrigatório

#### 9.3 Minimização de Dados
Coletar apenas o necessário:
- **Garantia:** nome, email, telefone, CPF, endereço, cidade, estado, país, CEP
- **Newsletter:** email apenas
- **Eventos:** nome, email

#### 9.4 Mascaramento
Implementado em DTOs de resposta:
```typescript
// Para LOJA e DISTRIBUIDOR
{
  "cpf": "123.***.**-01",
  "phone": "(11) 9****-4321"
}
```

#### 9.5 Auditoria
Registrar em `audit_logs`:
- Exportações de dados (`EXPORT_DATA`)
- Acesso a dados sensíveis (`VIEW_SENSITIVE`)
- Alterações críticas (`UPDATE_SENSITIVE`)

Campos:
```typescript
{
  user_id: uuid,
  action: "EXPORT_DATA",
  entity: "warranty_claims",
  entity_id: null,
  metadata: { filters: {...}, row_count: 1523 },
  ip_address: "192.168.1.1",
  created_at: timestamp
}
```

#### 9.6 Retenção (V2)
Job scheduled (cron):
- Anonizar dados de clientes inativos após 5 anos
- Manter protocolo de garantia (obrigação legal: 5 anos pós-compra)
- Excluir dados de newsletter após opt-out + 30 dias

#### 9.7 Direitos do Titular (V2)
API endpoints:
- `GET /client/my-data` (portabilidade)
- `DELETE /client/account` (exclusão/anonimização)
- `PATCH /client/consents` (revogação)

---

## 10. Endpoints da API

### 🔐 Autenticação

#### `POST /auth/login`
**Body:**
```json
{
  "email": "cliente@example.com",
  "password": "SenhaSegura123!"
}
```
**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "email": "cliente@example.com",
    "role": "CLIENTE"
  }
}
```

#### `POST /auth/refresh`
**Body:**
```json
{
  "refresh_token": "eyJhbGc..."
}
```

#### `POST /auth/logout`
**Headers:** `Authorization: Bearer <token>`

---

### 🌍 Rotas Públicas

#### `POST /public/warranty`
Cria/atualiza customer + product + warranty_claim.

**Body:**
```json
{
  "brand": "Relm Bikes",
  "product_type": "Road",
  "model": "Apex 2024",
  "serial_number": "RELM2024ABC123456",
  "purchase_date": "2024-01-15",
  "purchase_store_name": "Bike Shop São Paulo",
  "invoice_number": "NF-12345",
  "full_name": "João Silva",
  "email": "joao@example.com",
  "phone": "11987654321",
  "cpf": "12345678901",
  "address": "Rua das Flores, 123",
  "city": "São Paulo",
  "state": "SP",
  "country": "Brasil",
  "zip_code": "01234-567",
  "marketing_consent": true,
  "customer_notes": "Problema no câmbio"
}
```

**Response:**
```json
{
  "protocol_number": "GRT-2024-00001",
  "status": "RECEBIDO",
  "created_at": "2024-01-20T10:00:00Z"
}
```

#### `POST /public/newsletter`
```json
{
  "email": "email@example.com"
}
```

#### `GET /public/events`
Lista eventos ativos.

#### `POST /public/events/:id/register`
```json
{
  "full_name": "João Silva",
  "email": "joao@example.com",
  "phone": "11987654321"
}
```

#### `POST /public/insurance-quote`
```json
{
  "full_name": "João Silva",
  "email": "joao@example.com",
  "phone": "11987654321",
  "cpf": "12345678901",
  "serial_number": "RELM2024ABC123456",
  "bike_value": 15000.00,
  "city": "São Paulo",
  "state": "SP"
}
```

---

### 👤 Portal do Cliente (Autenticado)

#### `GET /client/me`
Retorna dados do cliente logado.

#### `GET /client/warranty-claims`
Lista garantias do cliente.

#### `POST /client/warranty-claims/:id/messages` (V2)
Envia mensagem em protocolo `AGUARDANDO_CLIENTE`.

---

### 🛠️ Admin/Operação (RBAC)

#### Customers
- `GET /customers` (filtros: name, email, cpf)
- `GET /customers/:id`
- `PATCH /customers/:id` (ADMIN, GERENTE)

#### Products
- `GET /products` (filtros: serial_number, model)
- `GET /products/:id`
- `PATCH /products/:id` (ADMIN, GERENTE)

#### Warranty
- `GET /warranty/claims` (filtros: status, protocol_number, customer_id, store_id, date_range)
- `GET /warranty/claims/:id`
- `PATCH /warranty/claims/:id/status` (FSM: valida transição + papel)
  ```json
  {
    "to_status": "APROVADO",
    "comment": "NF válida, produto dentro do prazo",
    "resolution": "Peça substituída"
  }
  ```
- `PATCH /warranty/claims/:id/link-store` (ADMIN, GERENTE)
  ```json
  {
    "store_id": "uuid"
  }
  ```

#### Benefits
- `GET /benefits` (filtros: active, target_role)
- `POST /benefits` (ADMIN, GERENTE)
- `PATCH /benefits/:id` (ADMIN, GERENTE)

#### Content
- `GET /content` (filtros: category, target_role)
- `POST /content` (ADMIN, GERENTE)
- `PATCH /content/:id` (ADMIN, GERENTE)

#### Announcements
- `GET /announcements` (filtros: target_role)
- `POST /announcements` (ADMIN, GERENTE)

#### Exports
- `GET /exports/warranty-claims.csv` (auditoria automática)
  - Filtros: date_range, status, store_id
  - Gera `audit_log` com metadata

#### Reports
- `GET /reports/warranty-summary` (agregados por status, loja, período)
- `GET /reports/benefits-usage` (V2)

---

### 🏪 Portal Loja

- `GET /store/content` (conteúdo segmentado para LOJA)
- `GET /store/announcements`
- `GET /store/benefits` (vantagens para revendedores)
- `GET /store/warranty-claims` (garantias vinculadas à loja)

---

### 🏢 Portal Distribuidor

- `GET /distributor/content` (conteúdo B2B)
- `GET /distributor/announcements`
- `GET /distributor/reports` (dados agregados, CPF mascarado)

---

### 📊 Health & Swagger

- `GET /api/health` (status do sistema)
- `GET /docs` (Swagger UI)

---

## 11. UI/UX Guidelines

### 🎨 Paleta de Cores

```
Primária (Teal):      #00BCD4 (header, botões principais)
Secundária (Verde):   #4CAF50 (badges, ações)
Sucesso:              #4CAF50
Alerta:               #FF9800
Erro:                 #F44336
Background:           #FFFFFF
Background Sec.:      #F5F5F5
Texto Principal:      #212121
Texto Secundário:     #757575
Bordas:               #E0E0E0
```

### 📐 Layout

#### Desktop (>1024px)
```
┌─────────────────────────────────────────┐
│ HEADER (Teal #00BCD4, 80px altura)     │
│ Logo | Menu | Search | Login/Avatar     │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────┬─────────────────────────┐  │
│ │ SIDEBAR │ CONTENT AREA            │  │
│ │         │                         │  │
│ │ Filtros │ Cards Grid              │  │
│ │         │ [Card] [Card] [Card]    │  │
│ │         │ [Card] [Card] [Card]    │  │
│ └─────────┴─────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

#### Mobile (<768px)
- Menu hamburguer
- Cards em coluna única
- Filtros em modal/drawer

### 🧩 Componentes

#### Header
- Altura: 80px
- Fundo: Teal (#00BCD4)
- Logo: branco, esquerda
- Menu: horizontal, centro
- Ações: direita (busca, login, avatar)

#### Card
```
┌─────────────────────┐
│ [Badge novo/ativo]  │
│                     │
│    [Imagem/Ícone]   │
│                     │
│    Título           │
│    Subtítulo        │
│                     │
│  [Botão CTA Verde]  │
└─────────────────────┘
```

- Borda: 1px sólida #E0E0E0
- Padding: 20px
- Border-radius: 8px
- Sombra: subtle (0 2px 4px rgba(0,0,0,0.1))

#### Botão Principal
- Background: #00BCD4 (teal) ou #4CAF50 (verde)
- Texto: branco, bold
- Padding: 12px 24px
- Border-radius: 24px (arredondado)
- Hover: escurecer 10%

#### Badge
- Background: #4CAF50 (verde)
- Texto: branco, uppercase, small
- Padding: 4px 8px
- Border-radius: 4px
- Posição: canto superior esquerdo do card

#### Tabela (Admin)
- Linhas zebradas (#FAFAFA alternado)
- Padding células: 12px 16px
- Header: bold, background #F5F5F5
- Ações: ícones, direita

### 📱 Telas Obrigatórias (V1)

#### Público

1. **Home** (`/`)
   - Hero simples com CTA
   - Cards de acesso rápido (Garantia, Vantagens, Seguro, Eventos)
   - Footer com links

2. **Garantia** (`/garantia`)
   - Form com todos os campos
   - Upload NF (V2)
   - Checkbox consentimentos
   - Botão "Registrar Garantia" (verde)

3. **Clube de Vantagens** (`/vantagens`)
   - Grid de cards de benefícios
   - Badge "novo" em benefícios recentes
   - CTA login para resgatar (V2)

4. **Seguro** (`/seguro`)
   - Form de cotação
   - Explicação do serviço
   - CTA "Solicitar Cotação" (verde)

5. **Eventos** (`/eventos`)
   - Lista de eventos ativos
   - Card por evento (data, local, vagas)
   - Modal de inscrição

6. **Newsletter** (`/newsletter`)
   - Form simples (email + checkbox)
   - Botão "Inscrever" (verde)

#### Cliente Logado

7. **Minha Conta** (`/cliente/conta`)
   - Dados pessoais
   - Editar perfil
   - Alterar senha

8. **Meus Produtos** (`/cliente/produtos`)
   - Lista de produtos cadastrados
   - Card por produto (serial, modelo, data compra)

9. **Minhas Garantias** (`/cliente/garantias`)
   - Lista de protocolos
   - Status visual (badges coloridas)
   - Botão "Ver Detalhes"

10. **Detalhe Garantia** (`/cliente/garantias/:id`)
    - Timeline de eventos
    - Status atual (destaque)
    - Mensagens (V2)

#### Loja

11. **Dashboard Loja** (`/loja`)
    - Resumo: garantias vinculadas, comunicados novos
    - Acesso rápido

12. **Comunicados** (`/loja/comunicados`)
    - Lista de anúncios Relm → Lojas

13. **Conteúdos** (`/loja/conteudos`)
    - Manuais, materiais de vendas, promoções

14. **Benefícios Lojas** (`/loja/beneficios`)
    - Vantagens exclusivas para revendedores

15. **Garantias Vinculadas** (`/loja/garantias`)
    - Lista de garantias da loja (filtros)

#### Distribuidor

16. **Dashboard Distribuidor** (`/distribuidor`)
17. **Conteúdo B2B** (`/distribuidor/conteudo`)
18. **Comunicados Comerciais** (`/distribuidor/comunicados`)
19. **Materiais de Vendas** (`/distribuidor/materiais`)

#### Admin

20. **Dashboard Admin** (`/admin`)
    - Métricas: garantias por status, novos clientes, eventos
    - Gráficos simples

21. **Clientes** (`/admin/clientes`)
    - Tabela com filtros (nome, email, CPF)
    - Ações: visualizar, editar

22. **Produtos** (`/admin/produtos`)
    - Tabela com filtros (serial, modelo, loja)

23. **Garantias** (`/admin/garantias`)
    - Tabela com filtros (status, protocolo, loja, data)
    - Ações: visualizar, alterar status

24. **Detalhe Garantia Admin** (`/admin/garantias/:id`)
    - Form de transição de status (FSM)
    - Timeline de eventos
    - Campos obrigatórios conforme transição

25. **Benefícios** (`/admin/beneficios`)
    - CRUD de benefícios

26. **Conteúdos** (`/admin/conteudos`)
    - CRUD de conteúdos (markdown editor)

27. **Comunicados** (`/admin/comunicados`)
    - CRUD de anúncios

28. **Exportações** (`/admin/exportacoes`)
    - Filtros para export CSV
    - Botão "Exportar" (gera auditoria)

---

## 12. Deploy e Operação

### 🚀 Deploy Inicial

#### 1. Preparar VPS
```bash
# Como root no VPS
ssh root@191.252.217.190

# Criar diretórios
mkdir -p /var/www/relm-careplus-prod/{backend,frontend}
mkdir -p /var/www/relm-careplus-staging/{backend,frontend}
mkdir -p /var/www/relm-careplus-prod-web
mkdir -p /var/www/relm-careplus-staging-web

# Permissões
chown -R www-data:www-data /var/www/relm-careplus-*
```

#### 2. Criar Bancos PostgreSQL
```bash
# Como postgres user
sudo -u postgres psql

CREATE DATABASE relm_careplus_prod;
CREATE DATABASE relm_careplus_staging;

# Criar user específico (opcional, mais seguro)
CREATE USER relm_careplus WITH PASSWORD 'SenhaForte123!';
GRANT ALL PRIVILEGES ON DATABASE relm_careplus_prod TO relm_careplus;
GRANT ALL PRIVILEGES ON DATABASE relm_careplus_staging TO relm_careplus;
```

#### 3. Deploy Backend

**Produção:**
```bash
cd /var/www/relm-careplus-prod/backend

# Copiar código (via git ou rsync)
git clone <repo> .
# ou
rsync -avz --exclude node_modules local-backend/ root@191.252.217.190:/var/www/relm-careplus-prod/backend/

# Install dependencies
npm ci --production

# Build
npm run build

# Prisma
npx prisma generate
npx prisma migrate deploy
npx prisma db seed

# PM2
pm2 start ecosystem.config.cjs --only relm-careplus-prod-backend
pm2 save
```

**Staging:** (mesmo processo, trocar diretórios)

#### 4. Deploy Frontend

**Build local:**
```bash
cd frontend
flutter build web --release --web-renderer html
```

**Upload:**
```bash
rsync -avz build/web/ root@191.252.217.190:/var/www/relm-careplus-prod-web/
rsync -avz build/web/ root@191.252.217.190:/var/www/relm-careplus-staging-web/
```

#### 5. Nginx

```bash
# Copiar configs
cp relm-careplus-prod.conf /etc/nginx/sites-available/
cp relm-careplus-staging.conf /etc/nginx/sites-available/

# Enable
ln -s /etc/nginx/sites-available/relm-careplus-prod.conf /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/relm-careplus-staging.conf /etc/nginx/sites-enabled/

# Testar
nginx -t

# Reload
systemctl reload nginx
```

#### 6. SSL (Certbot)
```bash
certbot --nginx -d careplus.relmbikes.com.br
certbot --nginx -d api-careplus.relmbikes.com.br
certbot --nginx -d staging-careplus.relmbikes.com.br
certbot --nginx -d staging-api-careplus.relmbikes.com.br
```

---

### 🔄 Rollback

#### Backend
```bash
# Parar processo
pm2 stop relm-careplus-prod-backend

# Reverter código (git)
cd /var/www/relm-careplus-prod/backend
git reset --hard <commit-anterior>

# Rebuild
npm run build

# Reverter migration (se necessário)
npx prisma migrate resolve --rolled-back <migration-name>

# Restart
pm2 restart relm-careplus-prod-backend
```

#### Frontend
```bash
# Manter backup do build anterior
cp -r /var/www/relm-careplus-prod-web /var/www/relm-careplus-prod-web.backup-$(date +%Y%m%d)

# Reverter
rm -rf /var/www/relm-careplus-prod-web/*
cp -r /var/www/relm-careplus-prod-web.backup-YYYYMMDD/* /var/www/relm-careplus-prod-web/
```

---

### 📊 Monitoramento

#### Healthcheck
```bash
curl https://api-careplus.relmbikes.com.br/api/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "database": "connected",
  "uptime": 123456
}
```

#### PM2
```bash
pm2 status
pm2 logs relm-careplus-prod-backend --lines 50
pm2 monit
```

#### Nginx Logs
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

### 🔧 Manutenção

#### Backup Banco (diário via cron)
```bash
#!/bin/bash
# /etc/cron.daily/backup-relm-careplus

BACKUP_DIR="/var/backups/relm-careplus"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup produção
pg_dump -U postgres relm_careplus_prod | gzip > $BACKUP_DIR/relm_careplus_prod_$DATE.sql.gz

# Manter últimos 7 dias
find $BACKUP_DIR -type f -mtime +7 -delete
```

#### Update Dependencies (mensal)
```bash
cd /var/www/relm-careplus-prod/backend

# Backend
npm outdated
npm update
npm audit fix

# Rebuild e restart
npm run build
pm2 restart relm-careplus-prod-backend
```

---

## 🎯 Checklist de Entrega

### Backend
- [x] Prisma schema completo
- [x] Migrations geradas
- [x] Seed com dados iniciais
- [x] Auth (JWT + RBAC)
- [x] Módulos implementados:
  - [x] auth
  - [x] customers
  - [x] products
  - [x] warranty (com FSM)
  - [x] benefits
  - [x] insurance
  - [x] events
  - [x] newsletter
  - [x] content
  - [x] reports
- [x] Guards de RBAC
- [x] Mascaramento de dados
- [x] Auditoria (audit_logs)
- [x] Swagger em /docs
- [x] Healthcheck

### Frontend
- [ ] Telas públicas (home, garantia, vantagens, seguro, eventos, newsletter)
- [ ] Portal cliente (login, conta, produtos, garantias)
- [ ] Portal loja (dashboard, comunicados, conteúdo, benefícios, garantias)
- [ ] Portal distribuidor (dashboard, conteúdo B2B)
- [ ] Admin (dashboard, CRUD completo, FSM garantia, exportações)
- [ ] UI teal/verde conforme spec
- [ ] Responsivo (desktop + mobile)

### Infraestrutura
- [x] Estrutura de diretórios
- [x] .env separados (prod/staging)
- [x] PM2 config (ecosystem.config.cjs)
- [x] Nginx configs (prod + staging)
- [x] Scripts de deploy
- [x] README completo

### LGPD
- [x] Política de privacidade versionada
- [x] Consentimentos separados
- [x] Mascaramento de CPF/telefone
- [x] Auditoria de exportações
- [ ] V2: Jobs de retenção

---

## 📚 Referências

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Flutter Web Documentation](https://docs.flutter.dev/platform-integration/web)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [LGPD (Lei 13.709/2018)](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)

---

**Fim do antigravity.md** 🚀
