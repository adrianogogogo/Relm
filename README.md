# 🚴 Relm Care+ — Centro de Serviços ao Cliente

> **Sistema completo de CRM para Relm Bikes**  
> Portal do Cliente • Portal Loja • Portal Distribuidor • Admin

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Flutter](https://img.shields.io/badge/Flutter-02569B?style=flat&logo=flutter&logoColor=white)](https://flutter.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

---

## 📖 Sobre o Projeto

**Relm Care+** é um sistema de CRM completo que oferece:

✅ **Cadastro de Garantia** — Registro de produtos e gestão de garantias  
✅ **Clube de Vantagens** — Benefícios exclusivos para clientes  
✅ **Cotação de Seguro** — Lead capture para seguros de bikes  
✅ **Eventos** — Inscrições e gestão de eventos Relm  
✅ **Newsletter** — Comunicação marketing com LGPD  
✅ **Portal Lojas** — Comunicação marca ↔ revendedores  
✅ **Portal B2B** — Conteúdo e relatórios para distribuidores  

### 🎯 Objetivos

- **V1 MVP:** Sistema funcional com garantia + vantagens + eventos
- **LGPD Compliant:** Consentimento, mascaramento, auditoria
- **RBAC:** 6 perfis com permissões granulares
- **FSM:** Máquina de estados para workflow de garantia
- **Multi-tenant:** Isolamento prod/staging no mesmo VPS

---

## 🏗️ Arquitetura

### Stack Tecnológica

**Backend:**
- NestJS 10 + TypeScript
- Prisma ORM + PostgreSQL 15
- JWT (access + refresh tokens)
- Swagger (OpenAPI)

**Frontend:**
- Flutter Web 3.x
- UI teal/verde (paleta Relm)
- Responsivo (desktop + mobile)

**Infraestrutura:**
- PM2 (process manager)
- Nginx (reverse proxy + static serving)
- SSL via Let's Encrypt
- Ambientes isolados (prod + staging)

### Ambientes

| Ambiente | Frontend | API | Porta | Banco |
|----------|----------|-----|-------|-------|
| **Produção** | careplus.relmbikes.com.br | api-careplus.relmbikes.com.br | 3001 | relm_careplus_prod |
| **Staging** | staging-careplus.relmbikes.com.br | staging-api-careplus.relmbikes.com.br | 3002 | relm_careplus_staging |

---

## 🚀 Quick Start

### Pré-requisitos

- Node.js 20.x
- Flutter SDK 3.x
- PostgreSQL 15.x
- PM2, Nginx (VPS)

### Instalação Local

```bash
# Clone
git clone <repo-url> relm-careplus
cd relm-careplus

# Backend
cd backend
npm install
cp .env.example .env
# Editar .env com credenciais locais

# Prisma
npx prisma generate
npx prisma migrate dev
npx prisma db seed

# Rodar
npm run start:dev

# Frontend
cd ../frontend
flutter pub get
flutter run -d chrome --dart-define=API_URL=http://localhost:3003
```

### Deploy VPS

Ver documentação completa em **[README-DEPLOY.md](./README-DEPLOY.md)**

---

## 📁 Estrutura do Projeto

```
relm-careplus/
├── antigravity.md              # 📜 Source of Truth (Documentação definitiva)
├── README.md                   # Este arquivo
├── README-DEPLOY.md            # Guia de deploy VPS
│
├── backend/                    # NestJS API
│   ├── prisma/
│   │   ├── schema.prisma       # Modelo de dados completo
│   │   ├── migrations/         # Migrations versionadas
│   │   └── seed.ts             # Dados iniciais
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── auth/               # Auth + JWT
│   │   ├── customers/          # CRUD clientes
│   │   ├── products/           # CRUD produtos
│   │   ├── warranty/           # Garantia + FSM
│   │   ├── benefits/           # Clube de Vantagens
│   │   ├── insurance/          # Cotação Seguro
│   │   ├── events/             # Eventos
│   │   ├── newsletter/         # Newsletter
│   │   ├── content/            # Conteúdo/Comunicados
│   │   ├── reports/            # Relatórios
│   │   └── common/             # Guards, Decorators, Interceptors
│   ├── package.json
│   └── .env.example
│
├── frontend/                   # Flutter Web
│   ├── lib/
│   │   ├── main.dart
│   │   ├── screens/
│   │   │   ├── home/
│   │   │   ├── warranty/
│   │   │   ├── benefits/
│   │   │   ├── events/
│   │   │   ├── admin/
│   │   │   ├── store/
│   │   │   └── distributor/
│   │   ├── widgets/
│   │   ├── models/
│   │   └── services/
│   └── pubspec.yaml
│
├── deployment/                 # Configs de infra
│   ├── ecosystem.config.cjs    # PM2
│   ├── prod/
│   │   └── relm-careplus-prod.conf       # Nginx prod
│   └── staging/
│       └── relm-careplus-staging.conf    # Nginx staging
│
├── scripts/                    # Scripts auxiliares
└── docs/                       # Documentação adicional
```

---

## 📊 Modelo de Dados

### Tabelas Principais

**Core:**
- `customers` — Clientes (email primário, CPF opcional)
- `products` — Produtos (serial_number único)
- `stores` — Lojas revendedoras
- `users` — Usuários do sistema (RBAC)
- `distributors` — Distribuidores B2B

**Garantia:**
- `warranty_claims` — Protocolos de garantia
- `warranty_events` — Auditoria/timeline

**Benefícios:**
- `benefits` — Vantagens disponíveis
- `benefit_memberships` — Associação cliente ↔ clube
- `benefit_redemptions` — Resgates (V2)

**Outros:**
- `insurance_quotes` — Cotações de seguro
- `events` + `event_registrations` — Eventos
- `newsletter_subscriptions` — Newsletter
- `content_items` + `announcements` — Conteúdo
- `privacy_policy_versions` + `privacy_consents` — LGPD
- `audit_logs` — Auditoria geral

Ver [prisma/schema.prisma](./backend/prisma/schema.prisma) para detalhes.

---

## 🔐 Segurança e LGPD

### Autenticação
- JWT (access token 15min + refresh token 7 dias)
- Bcrypt para hashes de senha
- Guards NestJS para rotas protegidas

### RBAC (6 Perfis)
| Papel | Código | Permissões |
|-------|--------|------------|
| Admin Relm | `ADMIN_RELM` | Tudo |
| Gerente Relm | `GERENTE_RELM` | Opera tudo, não gerencia admins |
| Suporte Relm | `SUPORTE_RELM` | Atendimento, sem config |
| Loja | `LOJA` | Portal revendedor |
| Distribuidor | `DISTRIBUIDOR` | Portal B2B |
| Cliente | `CLIENTE` | Portal do cliente |

### LGPD
✅ Política de privacidade versionada  
✅ Consentimento separado para marketing  
✅ Minimização de dados  
✅ Mascaramento de CPF/telefone (LOJA/DISTRIBUIDOR)  
✅ Auditoria de exportações  
🔄 V2: Retenção e anonimização automática

---

## 🔄 FSM — Garantia

Estados e transições válidas:

```
RECEBIDO → EM_ANALISE → AGUARDANDO_CLIENTE → EM_ANALISE
                      ↓                                  ↓
                  APROVADO → FINALIZADO            REPROVADO → FINALIZADO
                                                        ↓
                                                   CANCELADO
```

**Regras:**
- `AGUARDANDO_CLIENTE`: comment obrigatório
- `REPROVADO`: comment + rejection_reason obrigatórios
- `FINALIZADO`: resolution obrigatório
- Terminais: `FINALIZADO`, `CANCELADO`

Ver [antigravity.md § 6](./antigravity.md) para detalhes.

---

## 🎨 UI Guidelines

### Paleta de Cores
- **Primária (Teal):** `#00BCD4` (header, botões principais)
- **Secundária (Verde):** `#4CAF50` (badges, ações)
- **Background:** `#FFFFFF`
- **Bordas:** `#E0E0E0`

### Componentes
- Header teal com logo + menu horizontal
- Cards com borda sutil e badges
- Botões arredondados grandes (teal/verde)
- Tabelas leves (admin)
- Layout desktop-first com responsividade

Ver [antigravity.md § 11](./antigravity.md) para detalhes completos.

---

## 📚 Documentação

- **[antigravity.md](./antigravity.md)** — Source of Truth completo
- **[README-DEPLOY.md](./README-DEPLOY.md)** — Guia de deploy VPS
- **Swagger:** `/docs` (backend rodando)

---

## 🧪 Credenciais de Teste (Seed)

Após rodar `npx prisma db seed`:

| Perfil | Email | Senha |
|--------|-------|-------|
| Admin | admin@relmbikes.com.br | Admin@2024 |
| Gerente | gerente@relmbikes.com.br | Gerente@2024 |
| Suporte | suporte@relmbikes.com.br | Suporte@2024 |
| Loja | loja@bikeshopsp.com.br | Loja@2024 |
| Distribuidor | distribuidor@distrisul.com.br | Distri@2024 |

---

## 🛠️ Scripts Úteis

### Backend

```bash
# Desenvolvimento
npm run start:dev

# Build
npm run build

# Produção
npm run start:prod

# Prisma
npm run prisma:generate     # Gerar client
npm run prisma:migrate      # Criar migration
npm run prisma:migrate:deploy  # Deploy migrations (prod)
npm run prisma:studio       # GUI
npm run prisma:seed         # Executar seed
```

### Frontend

```bash
# Dev
flutter run -d chrome

# Build production
flutter build web --release --web-renderer html \
  --dart-define=API_URL=https://api-careplus.relmbikes.com.br

# Build staging
flutter build web --release --web-renderer html \
  --dart-define=API_URL=https://staging-api-careplus.relmbikes.com.br
```

---

## 📞 Suporte

**Issues:** Abrir issue no repositório  
**Documentação:** Ver [antigravity.md](./antigravity.md)  
**Deploy:** Ver [README-DEPLOY.md](./README-DEPLOY.md)

---

## 📄 Licença

Propriedade de **Relm Bikes**. Todos os direitos reservados.

---

**Desenvolvido com ❤️ para Relm Bikes**  
Versão: 1.0.0 | Data: 2026-02-20
