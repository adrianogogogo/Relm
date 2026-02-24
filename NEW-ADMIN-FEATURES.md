# 🎯 Novas Features Admin - Documentação Completa

## 📋 Visão Geral

Este documento descreve as três novas páginas administrativas implementadas no sistema RELM Care+:

1. **Eventos** - Gerenciamento de eventos
2. **Seguros** - Apólices ativas e cotações
3. **RELM Club** - Clube de benefícios

---

## 🎪 1. EVENTOS

### Backend

**Modelos (Prisma Schema)**
```prisma
model Event {
  id              String   @id @default(uuid())
  title           String
  description     String   @db.Text
  location        String
  startAt         DateTime @map("start_at")
  endAt           DateTime @map("end_at")
  maxParticipants Int?     @map("max_participants")
  active          Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  registrations   EventRegistration[]
}

model EventRegistration {
  id         String   @id @default(uuid())
  eventId    String
  customerId String
  createdAt  DateTime @default(now())
  event      Event    @relation(fields: [eventId], references: [id])
  customer   Customer @relation(fields: [customerId], references: [id])
  @@unique([eventId, customerId])
}
```

**Módulo**: `EventsModule`
- **Service**: `EventsService`
- **Controllers**: 
  - `EventsController` (Admin - `/api/events`)
  - `PublicEventsController` (Public - `/api/public/events`)

**Endpoints Admin**:
- `POST /api/events` - Criar evento
- `GET /api/events` - Listar todos eventos
- `GET /api/events/:id` - Detalhes do evento
- `PATCH /api/events/:id` - Atualizar evento
- `DELETE /api/events/:id` - Excluir evento

**Endpoints Públicos**:
- `GET /api/public/events` - Listar eventos ativos
- `GET /api/public/events/:id` - Detalhes do evento

### Frontend

**Página Admin**: `EventsPage.jsx` (`/admin/events`)

**Funcionalidades**:
- ✅ Listar todos os eventos
- ✅ Criar novo evento
- ✅ Editar evento existente
- ✅ Excluir evento
- ✅ Exibir número de inscritos
- ✅ Gerenciar vagas (limite de participantes)
- ✅ Filtro por status (ativo/inativo)
- ✅ Card visual com informações do evento

**Página Pública**: `PublicEventsPage.jsx` (`/eventos`)

**API Service**: `eventsAPI.js`
```javascript
eventsAPI.getAll()
eventsAPI.getOne(id)
eventsAPI.create(data)
eventsAPI.update(id, data)
eventsAPI.delete(id)

publicEventsAPI.getActive()
publicEventsAPI.getOne(id)
```

---

## 🛡️ 2. SEGUROS E APÓLICES

### Backend

**Modelos (Prisma Schema)**
```prisma
enum InsuranceQuoteStatus {
  PENDING
  APPROVED
  CONVERTED
  REJECTED
  EXPIRED
}

enum InsurancePolicyStatus {
  ACTIVE
  SUSPENDED
  CANCELLED
  EXPIRED
}

model InsuranceQuote {
  id                String                @id @default(uuid())
  protocolNumber    String                @unique
  customerId        String
  productId         String?
  bikeValue         Decimal?
  city              String?
  state             String?
  quoteValue        Decimal?
  insuranceCompany  String?
  status            InsuranceQuoteStatus  @default(PENDING)
  notes             String?
  createdAt         DateTime
  updatedAt         DateTime
  customer          Customer
  product           Product?
  policies          InsurancePolicy[]
}

model InsurancePolicy {
  id                  String                 @id @default(uuid())
  policyNumber        String                 @unique
  quoteId             String?
  customerId          String
  productId           String?
  insuranceCompany    String
  policyValue         Decimal
  coverageAmount      Decimal
  deductible          Decimal?
  startDate           DateTime
  endDate             DateTime
  status              InsurancePolicyStatus  @default(ACTIVE)
  monthlyPayment      Decimal?
  paymentDay          Int?
  policyDocumentUrl   String?
  notes               String?
  createdAt           DateTime
  updatedAt           DateTime
  quote               InsuranceQuote?
  customer            Customer
}
```

**Módulo**: `InsurancePoliciesModule`
- **Service**: `InsurancePoliciesService`
- **Controller**: `InsurancePoliciesController` (Admin - `/api/insurance-policies`)

**Endpoints**:
- `POST /api/insurance-policies` - Criar apólice
- `GET /api/insurance-policies` - Listar apólices (com filtros)
- `GET /api/insurance-policies/statistics` - Estatísticas
- `GET /api/insurance-policies/active` - Apólices ativas
- `GET /api/insurance-policies/expiring-soon` - Apólices próximas do vencimento
- `GET /api/insurance-policies/:id` - Detalhes da apólice
- `PATCH /api/insurance-policies/:id` - Atualizar apólice
- `PATCH /api/insurance-policies/:id/status` - Atualizar status
- `DELETE /api/insurance-policies/:id` - Excluir apólice

### Frontend

**Página Admin**: `InsurancePoliciesPage.jsx` (`/admin/insurance`)

**Funcionalidades**:
- ✅ **Duas abas**:
  - **Apólices Ativas**: Gerenciamento completo de apólices
  - **Cotações**: Visualização de cotações
- ✅ **Dashboard de estatísticas**:
  - Total de apólices
  - Apólices ativas
  - Apólices suspensas
  - Apólices canceladas
  - Apólices expiradas
  - Apólices vencendo em breve
- ✅ Criar nova apólice
- ✅ Editar apólice existente
- ✅ Excluir apólice
- ✅ Atualizar status
- ✅ Campos completos:
  - Número da apólice
  - Cliente
  - Seguradora
  - Valores (apólice, cobertura, franquia)
  - Datas (início, fim)
  - Pagamento mensal
  - Observações

**API Service**: `insurancePoliciesAPI.js`
```javascript
insurancePoliciesAPI.getAll(params)
insurancePoliciesAPI.getOne(id)
insurancePoliciesAPI.getActive()
insurancePoliciesAPI.getExpiringSoon(days)
insurancePoliciesAPI.getStatistics()
insurancePoliciesAPI.create(data)
insurancePoliciesAPI.update(id, data)
insurancePoliciesAPI.updateStatus(id, status)
insurancePoliciesAPI.delete(id)

insuranceQuotesAPI.getAll()
insuranceQuotesAPI.getOne(id)
insuranceQuotesAPI.create(data)
insuranceQuotesAPI.update(id, data)
```

---

## 🎁 3. RELM CLUB (Benefícios)

### Backend

**Modelos (Prisma Schema)**
```prisma
enum BenefitCategory {
  DISCOUNT
  EXCLUSIVE_ACCESS
  CASHBACK
  FREE_SHIPPING
  PARTNER_BENEFIT
  OTHER
}

model Benefit {
  id                  String           @id @default(uuid())
  title               String
  description         String           @db.Text
  terms               String?          @db.Text
  category            BenefitCategory  @default(OTHER)
  discountPercentage  Int?
  partnerName         String?
  partnerLogo         String?
  howToRedeem         String?          @db.Text
  imageUrl            String?
  validFrom           DateTime
  validUntil          DateTime
  active              Boolean          @default(true)
  featured            Boolean          @default(false)
  targetRole          String?
  maxRedemptions      Int?
  currentRedemptions  Int              @default(0)
  createdAt           DateTime
  updatedAt           DateTime
  redemptions         BenefitRedemption[]
}

model BenefitMembership {
  id         String           @id @default(uuid())
  customerId String           @unique
  status     MembershipStatus @default(ACTIVE)
  tier       String?
  joinedAt   DateTime         @default(now())
  createdAt  DateTime
  updatedAt  DateTime
  customer   Customer
  redemptions BenefitRedemption[]
}

model BenefitRedemption {
  id           String   @id @default(uuid())
  benefitId    String
  customerId   String?
  storeId      String?
  membershipId String
  redeemedAt   DateTime @default(now())
  benefit      Benefit
  membership   BenefitMembership
}
```

**Módulo**: `BenefitsModule`
- **Service**: `BenefitsService`
- **Controllers**: 
  - `BenefitsController` (Admin - `/api/benefits`)
  - `PublicBenefitsController` (Public - `/api/public/benefits`)

**Endpoints Admin**:
- `POST /api/benefits` - Criar benefício
- `GET /api/benefits` - Listar benefícios (com filtros)
- `GET /api/benefits/statistics` - Estatísticas
- `GET /api/benefits/:id` - Detalhes do benefício
- `PATCH /api/benefits/:id` - Atualizar benefício
- `DELETE /api/benefits/:id` - Excluir benefício

**Endpoints Públicos**:
- `GET /api/public/benefits` - Listar benefícios ativos
- `GET /api/public/benefits/featured` - Benefícios em destaque
- `GET /api/public/benefits/:id` - Detalhes do benefício

### Frontend

**Página Admin**: `BenefitsPage.jsx` (`/admin/benefits`)

**Funcionalidades**:
- ✅ **Dashboard de estatísticas**:
  - Total de benefícios
  - Benefícios ativos
  - Benefícios destacados
  - Total de resgates
- ✅ Criar novo benefício
- ✅ Editar benefício existente
- ✅ Excluir benefício
- ✅ **Categorias de benefício**:
  - Desconto
  - Acesso Exclusivo
  - Cashback
  - Frete Grátis
  - Benefício Parceiro
  - Outro
- ✅ **Campos completos**:
  - Título e descrição
  - Categoria
  - Percentual de desconto
  - Nome e logo do parceiro
  - Como resgatar
  - Imagem de destaque
  - Termos e condições
  - Período de validade
  - Limite de resgates
  - Ativo/Inativo
  - Benefício destacado
- ✅ Cards visuais com imagem
- ✅ Badge de benefício destacado

**Página Pública**: `PublicBenefitsPage.jsx` (`/vantagens`)

**API Service**: `benefitsAPI.js`
```javascript
benefitsAPI.getAll(params)
benefitsAPI.getOne(id)
benefitsAPI.getStatistics()
benefitsAPI.create(data)
benefitsAPI.update(id, data)
benefitsAPI.delete(id)

publicBenefitsAPI.getActive()
publicBenefitsAPI.getFeatured()
publicBenefitsAPI.getOne(id)
```

---

## 🎨 Design System

### Paleta de Cores
```css
Primary Blue: #00BCD4
Secondary Blue: #2FC0D3
Accent Green: #00FF8E
Red: #FF4043
```

### Componentes Visuais

**Badges de Status**:
- ✅ Ativo: `bg-[#00FF8E] text-gray-900`
- ⏸️ Inativo: `bg-gray-200 text-gray-600`
- 🟡 Pendente: `bg-yellow-100 text-yellow-800`
- 🔴 Cancelado: `bg-[#FF4043] text-white`

**Botões**:
- Primário: `bg-[#00BCD4] hover:bg-[#2FC0D3]`
- Secundário: `bg-gray-500 hover:bg-gray-600`
- Perigo: `bg-[#FF4043] hover:bg-red-600`

---

## 🔐 Autenticação e Permissões

Todas as páginas admin requerem autenticação com roles:
- `ADMIN_RELM`
- `GERENTE_RELM`
- `SUPORTE_RELM`

Proteção via:
- **Backend**: `JwtAuthGuard` + `RolesGuard`
- **Frontend**: `ProtectedRoute` component

---

## 📁 Estrutura de Arquivos

### Backend
```
backend/src/
├── events/
│   ├── events.module.ts
│   ├── events.service.ts
│   ├── events.controller.ts
│   ├── public-events.controller.ts
│   └── dto/
│       ├── create-event.dto.ts
│       └── update-event.dto.ts
├── insurance-policies/
│   ├── insurance-policies.module.ts
│   ├── insurance-policies.service.ts
│   ├── insurance-policies.controller.ts
│   └── dto/
│       ├── create-insurance-policy.dto.ts
│       └── update-insurance-policy.dto.ts
└── benefits/
    ├── benefits.module.ts
    ├── benefits.service.ts
    ├── benefits.controller.ts
    ├── public-benefits.controller.ts
    └── dto/
        ├── create-benefit.dto.ts
        └── update-benefit.dto.ts
```

### Frontend
```
frontend/src/
├── pages/
│   ├── EventsPage.jsx
│   ├── PublicEventsPage.jsx
│   ├── InsurancePoliciesPage.jsx
│   ├── BenefitsPage.jsx
│   └── PublicBenefitsPage.jsx
└── services/
    ├── eventsAPI.js
    ├── insurancePoliciesAPI.js
    └── benefitsAPI.js
```

---

## 🚀 Deploy

### 1. Backend

```bash
cd backend

# Gerar Prisma Client com novos modelos
npx prisma generate

# Criar migração do banco
npx prisma migrate dev --name add_events_insurance_benefits

# Reiniciar backend
pm2 restart relm-backend
```

### 2. Frontend

```bash
cd frontend

# Build
npm run build

# Deploy
sudo rm -rf /var/www/relm-careplus-prod-web/assets
sudo cp -r dist/assets /var/www/relm-careplus-prod-web/
sudo cp dist/index.html /var/www/relm-careplus-prod-web/
sudo chown -R www-data:www-data /var/www/relm-careplus-prod-web/
sudo chmod -R 755 /var/www/relm-careplus-prod-web/
```

---

## ✅ Checklist de Teste

### Eventos
- [ ] Criar evento
- [ ] Editar evento
- [ ] Excluir evento
- [ ] Visualizar lista de eventos
- [ ] Visualizar eventos públicos
- [ ] Verificar contador de inscritos

### Seguros
- [ ] Criar apólice
- [ ] Editar apólice
- [ ] Excluir apólice
- [ ] Atualizar status
- [ ] Visualizar estatísticas
- [ ] Visualizar cotações
- [ ] Verificar filtro por status

### RELM Club
- [ ] Criar benefício
- [ ] Editar benefício
- [ ] Excluir benefício
- [ ] Upload de imagem
- [ ] Marcar como destacado
- [ ] Definir categoria
- [ ] Visualizar estatísticas
- [ ] Visualizar benefícios públicos

---

## 📞 Suporte

Para dúvidas ou problemas:
- GitHub: https://github.com/adrianogogogo/Relm
- Branch: `feature/insurance-module`

---

## 📝 Changelog

**v1.0.0** - 2026-02-24
- ✅ Implementação completa dos módulos de Eventos, Seguros e RELM Club
- ✅ Backend com NestJS e Prisma
- ✅ Frontend React com design system atualizado
- ✅ Documentação completa
- ✅ Integração com sistema de autenticação existente
