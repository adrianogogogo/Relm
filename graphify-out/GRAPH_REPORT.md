# Graph Report - .  (2026-07-20)

## Corpus Check
- 333 files · ~343,165 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2011 nodes · 4320 edges · 120 communities (99 shown, 21 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Notificacoes & Roles
- DTOs de Seguro
- Mascaramento de Dados (CPF/Tel)
- DTOs de Lojas
- DTOs de Eventos
- Email Service & Templates
- DTOs de WhatsApp
- Dependencias do Pacote
- Banners Controller
- DTOs de Pagamento
- Customer Auth Controller
- Customer Portal Controller
- Componentes UI do Cliente
- Admin Users Controller
- Entitlements & Allowances
- Workshop Controller
- Benefits Controller
- Partners Controller
- UI Admin (Cards)
- Componentes UI Compartilhados
- Servicos Admin/Auth
- Rewards & Vouchers Controller
- DTOs de Solucao
- Componentes de Layout
- Auth Controller
- Cluster 25
- Cluster 26
- Cluster 27
- Cluster 28
- Cluster 29
- Cluster 30
- Cluster 31
- Cluster 32
- Cluster 33
- Cluster 34
- Cluster 35
- Cluster 36
- Cluster 37
- Cluster 38
- Cluster 39
- Cluster 40
- Cluster 41
- Cluster 42
- Cluster 43
- Cluster 44
- Cluster 45
- Cluster 46
- Cluster 47
- Cluster 48
- Cluster 49
- Cluster 50
- Cluster 51
- Cluster 52
- Cluster 53
- Cluster 54
- Cluster 55
- Cluster 56
- Cluster 57
- Cluster 58
- Cluster 59
- Cluster 60
- Cluster 61
- Cluster 62
- Cluster 63
- Cluster 64
- Cluster 65
- Cluster 66
- Cluster 67
- Cluster 68
- Cluster 69
- Cluster 70
- Cluster 71
- Cluster 72
- Cluster 73
- Cluster 74
- Cluster 75
- Cluster 76
- Cluster 77
- Cluster 78
- Cluster 80
- Cluster 82
- Cluster 83
- Cluster 84
- Cluster 85
- Cluster 92
- Cluster 94
- Cluster 95
- Cluster 96
- Cluster 97
- Cluster 98
- Cluster 99
- Cluster 100
- Cluster 101
- Cluster 102
- Cluster 103
- Cluster 104
- Cluster 105
- Cluster 106
- Cluster 107
- Cluster 108
- Cluster 109
- Cluster 110

## God Nodes (most connected - your core abstractions)
1. `Roles()` - 95 edges
2. `useAuthStore` - 83 edges
3. `PrismaService` - 77 edges
4. `PageHeader()` - 44 edges
5. `Card()` - 41 edges
6. `WarrantyService` - 34 edges
7. `NotificationsService` - 28 edges
8. `WarrantyController` - 28 edges
9. `InsuranceService` - 27 edges
10. `StatusChip()` - 27 edges

## Surprising Connections (you probably didn't know these)
- `AdminUsersController` --references--> `Roles()`  [EXTRACTED]
  backend/src/admin-users/admin-users.controller.ts → backend/src/common/decorators/roles.decorator.ts
- `bootstrap()` --indirect_call--> `AppModule`  [INFERRED]
  backend/src/main.ts → backend/src/app.module.ts
- `AuditLogsController` --references--> `Roles()`  [EXTRACTED]
  backend/src/audit-logs/audit-logs.controller.ts → backend/src/common/decorators/roles.decorator.ts
- `BannersController` --references--> `Roles()`  [EXTRACTED]
  backend/src/banners/banners.controller.ts → backend/src/common/decorators/roles.decorator.ts
- `ContentController` --references--> `Roles()`  [EXTRACTED]
  backend/src/content/content.controller.ts → backend/src/common/decorators/roles.decorator.ts

## Import Cycles
- 3-file cycle: `backend/src/customer-auth/customer-auth.module.ts -> backend/src/engagement/engagement.module.ts -> backend/src/gamification/gamification.module.ts -> backend/src/customer-auth/customer-auth.module.ts`
- 3-file cycle: `backend/src/customer-auth/customer-auth.module.ts -> backend/src/engagement/engagement.module.ts -> backend/src/points/points.module.ts -> backend/src/customer-auth/customer-auth.module.ts`

## Communities (120 total, 21 thin omitted)

### Community 0 - "Notificacoes & Roles"
Cohesion: 0.08
Nodes (22): Roles(), ApiBearerAuth, ApiOperation, ApiTags, Body, Controller, Delete, Get (+14 more)

### Community 1 - "DTOs de Seguro"
Cohesion: 0.08
Nodes (24): CreateInsurancePublicDto, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min (+16 more)

### Community 2 - "Mascaramento de Dados (CPF/Tel)"
Cohesion: 0.06
Nodes (33): maskCpf(), maskPhone(), ROLES_THAT_SEE_MASKED, shouldMaskFor(), CustomersController, Body, Controller, Delete (+25 more)

### Community 3 - "DTOs de Lojas"
Cohesion: 0.06
Nodes (30): BulkCreateStoresDto, ArrayMaxSize, IsArray, Type, ValidateNested, CreateStoreDto, IsArray, IsBoolean (+22 more)

### Community 4 - "DTOs de Eventos"
Cohesion: 0.07
Nodes (31): CreateEventDto, IsArray, IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString (+23 more)

### Community 5 - "Email Service & Templates"
Cohesion: 0.07
Nodes (24): EmailService, Injectable, CreateStoreUserDto, IsEmail, IsString, IsUUID, MinLength, StoreLoginDto (+16 more)

### Community 6 - "DTOs de WhatsApp"
Cohesion: 0.07
Nodes (29): BroadcastDto, BroadcastTarget, IsArray, IsOptional, IsString, MaxLength, MinLength, UpdateWhatsappSettingsDto (+21 more)

### Community 7 - "Dependencias do Pacote"
Cohesion: 0.04
Nodes (45): dependencies, axios, bcryptjs, class-transformer, class-validator, helmet, @nestjs/common, @nestjs/config (+37 more)

### Community 8 - "Banners Controller"
Cohesion: 0.08
Nodes (24): BannersController, Body, Controller, Delete, Get, Param, Patch, Post (+16 more)

### Community 9 - "DTOs de Pagamento"
Cohesion: 0.06
Nodes (27): CreatePaymentDto, IsIn, IsNumber, IsOptional, IsString, IsUUID, Min, PaymentsController (+19 more)

### Community 10 - "Customer Auth Controller"
Cohesion: 0.09
Nodes (24): CustomerAuthController, ApiBearerAuth, ApiOperation, ApiTags, Body, Controller, HttpCode, Post (+16 more)

### Community 11 - "Customer Portal Controller"
Cohesion: 0.08
Nodes (21): CustomerPortalController, ApiBearerAuth, ApiTags, Body, Controller, Get, Put, Request (+13 more)

### Community 12 - "Componentes UI do Cliente"
Cohesion: 0.10
Nodes (23): ChangePasswordModal(), CustomerProtectedRoute(), Header(), ProtectedRoute(), StoreProtectedRoute(), AdminDashboard(), AdminHome(), AdminProfilePage() (+15 more)

### Community 13 - "Admin Users Controller"
Cohesion: 0.09
Nodes (15): AdminUsersController, ApiBearerAuth, ApiTags, Body, Controller, Delete, Get, Param (+7 more)

### Community 14 - "Entitlements & Allowances"
Cohesion: 0.09
Nodes (18): ALLOWANCE_SERVICE_TYPES, ComparisonRow, Enforcement, SERVICE_TYPE_LABELS, ServiceAllowance, TIER_COMPARISON, TIER_ORDER, tierAtLeast() (+10 more)

### Community 15 - "Workshop Controller"
Cohesion: 0.11
Nodes (15): isAllowanceType(), ApiOperation, ApiTags, Body, Controller, Get, Param, Patch (+7 more)

### Community 16 - "Benefits Controller"
Cohesion: 0.11
Nodes (15): BenefitsController, ApiBearerAuth, ApiTags, Body, Controller, Delete, Get, HttpCode (+7 more)

### Community 17 - "Partners Controller"
Cohesion: 0.11
Nodes (19): PartnersController, ApiBearerAuth, ApiOperation, ApiTags, Body, Controller, Delete, Get (+11 more)

### Community 18 - "UI Admin (Cards)"
Cohesion: 0.11
Nodes (19): AdminResetPasswordModal(), Card(), AdminWhatsAppPage(), TARGET_OPTIONS, AuditLogsPage(), CustomerBenefitsPage(), CustomerFormPage(), StoreCustomersPage() (+11 more)

### Community 19 - "Componentes UI Compartilhados"
Cohesion: 0.09
Nodes (21): Button(), COLOR_STYLES, PageHeader(), AdminBenefitsPage(), EMPTY_FORM, AdminCatalogPage(), TIER_OPTIONS, AdminVouchersPage() (+13 more)

### Community 20 - "Servicos Admin/Auth"
Cohesion: 0.12
Nodes (13): AuditLogsService, Injectable, TODO: Adicionar campo resetPasswordToken no model User se necessário, ContentFilters, EXPIRY_WARNING_DAYS, QUOTE_TRANSITIONS, CreateNotificationInput, NotificationPayload (+5 more)

### Community 21 - "Rewards & Vouchers Controller"
Cohesion: 0.11
Nodes (13): RewardsController, ApiOperation, ApiTags, Body, Controller, Delete, Get, Param (+5 more)

### Community 22 - "DTOs de Solucao"
Cohesion: 0.08
Nodes (24): ApproveSolutionDto, IsBoolean, IsOptional, IsString, MaxLength, AssignClaimDto, IsOptional, IsString (+16 more)

### Community 23 - "Componentes de Layout"
Cohesion: 0.15
Nodes (20): AdminLayout(), MENU_ITEMS, BannerCarousel(), CustomerLayout(), MENU, MENU, StoreLayout(), TopBarChrome() (+12 more)

### Community 24 - "Auth Controller"
Cohesion: 0.15
Nodes (13): AuthController, ApiBearerAuth, ApiOperation, ApiTags, Body, Controller, HttpCode, Post (+5 more)

### Community 25 - "Cluster 25"
Cohesion: 0.09
Nodes (12): ReportsController, ApiBearerAuth, ApiTags, Controller, Get, UseGuards, ReportsModule, Module (+4 more)

### Community 26 - "Cluster 26"
Cohesion: 0.11
Nodes (20): Dialog(), buildEmailReport(), EVENT_LABELS, formatBytes(), formatDateTime(), onlyDigits(), parseAssignee(), ROLE_LABELS (+12 more)

### Community 27 - "Cluster 27"
Cohesion: 0.10
Nodes (12): NotificationJwtGuard, Injectable, NotificationsController, Controller, Get, Param, Patch, Query (+4 more)

### Community 28 - "Cluster 28"
Cohesion: 0.12
Nodes (17): StoreLocator(), EMPTY_FORM, WarrantyCreateModal(), ForgotPasswordPage(), HomePage(), NewsletterPage(), ResetPasswordPage(), StoreFormPage() (+9 more)

### Community 29 - "Cluster 29"
Cohesion: 0.07
Nodes (27): devDependencies, eslint, eslint-config-prettier, eslint-plugin-prettier, @nestjs/cli, @nestjs/schematics, @nestjs/testing, ts-jest (+19 more)

### Community 30 - "Cluster 30"
Cohesion: 0.11
Nodes (16): AuditLogsModule, Module, CustomersModule, Module, EventsModule, Module, InsuranceModule, Module (+8 more)

### Community 31 - "Cluster 31"
Cohesion: 0.16
Nodes (4): CronHealthService, CronJobHealth, Injectable, ENTITLEMENTS

### Community 32 - "Cluster 32"
Cohesion: 0.13
Nodes (11): ManualGatewayService, Injectable, ConfirmPaymentResult, CreateChargeInput, CreateChargeResult, PaymentGatewayService, PaymentsService, actorStore (+3 more)

### Community 33 - "Cluster 33"
Cohesion: 0.09
Nodes (17): StatusChip(), VARIANT_HEX, AdminEventsPage(), EMPTY_FORM, TARGET_ROLE_OPTIONS, AdminPaymentsPage(), formatBRL(), METHOD_LABEL (+9 more)

### Community 34 - "Cluster 34"
Cohesion: 0.09
Nodes (18): AdminInsurancesPage(), formatDate(), POLICY_STATUS_LABEL, POLICY_STATUS_VARIANT, QUOTE_STATUS_LABEL, QUOTE_STATUS_VARIANT, initialForm, InsurancePage() (+10 more)

### Community 35 - "Cluster 35"
Cohesion: 0.09
Nodes (22): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+14 more)

### Community 36 - "Cluster 36"
Cohesion: 0.31
Nodes (4): JwtAuthGuard, Injectable, RolesGuard, Injectable

### Community 37 - "Cluster 37"
Cohesion: 0.11
Nodes (12): AuthModule, Module, JwtStrategy, Injectable, EmailModule, Module, PartnersModule, Module (+4 more)

### Community 38 - "Cluster 38"
Cohesion: 0.11
Nodes (15): useEntitlements(), CustomerDashboard(), WARRANTY_STATUS_LABEL, WARRANTY_STATUS_VARIANT, CustomerRankingPage(), CustomerWorkshopPage(), LOGISTICS_STEPS, SERVICE_LABELS (+7 more)

### Community 39 - "Cluster 39"
Cohesion: 0.13
Nodes (13): SubscribeNewsletterDto, IsEmail, IsNotEmpty, MaxLength, NewsletterController, ApiTags, Body, Controller (+5 more)

### Community 40 - "Cluster 40"
Cohesion: 0.16
Nodes (10): App(), queryClient, BenefitsFeed(), EventsFeed(), Footer(), BenefitsPage(), DistribuidorBeneficiosPage(), DistribuidorEventosPage() (+2 more)

### Community 41 - "Cluster 41"
Cohesion: 0.23
Nodes (13): PointsModule, Module, PrismaModule, Global, Module, RewardsModule, Module, SubscriptionsModule (+5 more)

### Community 42 - "Cluster 42"
Cohesion: 0.16
Nodes (12): CustomerAuthModule, Module, CustomerJwtStrategy, Injectable, CustomerPortalModule, Module, EngagementModule, Module (+4 more)

### Community 43 - "Cluster 43"
Cohesion: 0.11
Nodes (19): scripts, build, format, lint, migrate:base-to-care, prisma:generate, prisma:migrate, prisma:migrate:deploy (+11 more)

### Community 44 - "Cluster 44"
Cohesion: 0.12
Nodes (17): autoprefixer, eslint-plugin-react, devDependencies, autoprefixer, eslint, eslint-plugin-react, tailwindcss, @types/react (+9 more)

### Community 45 - "Cluster 45"
Cohesion: 0.18
Nodes (4): Inject, EngagementService, Cron, Injectable

### Community 46 - "Cluster 46"
Cohesion: 0.12
Nodes (17): date-fns, dependencies, axios, date-fns, react, react-dom, react-icons, react-router-dom (+9 more)

### Community 47 - "Cluster 47"
Cohesion: 0.24
Nodes (13): xlsx, StatCard(), AdminProductsPage(), cell(), EMPTY, norm(), CustomersPage(), StoresPage() (+5 more)

### Community 48 - "Cluster 48"
Cohesion: 0.12
Nodes (16): jest, collectCoverageFrom, coverageDirectory, moduleFileExtensions, rootDir, roots, testEnvironment, testRegex (+8 more)

### Community 49 - "Cluster 49"
Cohesion: 0.14
Nodes (11): ContentController, ApiBearerAuth, ApiTags, Controller, Get, Query, UseGuards, ContentModule (+3 more)

### Community 50 - "Cluster 50"
Cohesion: 0.15
Nodes (9): GamificationController, ApiBearerAuth, ApiTags, Body, Controller, Get, Patch, Request (+1 more)

### Community 51 - "Cluster 51"
Cohesion: 0.14
Nodes (14): BulkCreateProductsDto, ArrayMaxSize, IsArray, Type, ValidateNested, CreateProductDto, IsInt, IsNumber (+6 more)

### Community 52 - "Cluster 52"
Cohesion: 0.13
Nodes (11): SubscriptionsController, ApiOperation, ApiResponse, ApiTags, Body, Controller, HttpCode, Post (+3 more)

### Community 53 - "Cluster 53"
Cohesion: 0.21
Nodes (5): ProductsService, Injectable, PublicProductsController, Controller, Get

### Community 54 - "Cluster 54"
Cohesion: 0.17
Nodes (10): IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, Type (+2 more)

### Community 55 - "Cluster 55"
Cohesion: 0.22
Nodes (8): ProductsController, ApiBearerAuth, ApiTags, Body, Controller, Delete, Post, UseGuards

### Community 56 - "Cluster 56"
Cohesion: 0.15
Nodes (12): compilerOptions, noEmit, outDir, exclude, extends, include, dist, node_modules (+4 more)

### Community 57 - "Cluster 57"
Cohesion: 0.21
Nodes (8): AdminResetPasswordDto, IsString, MaxLength, MinLength, ChangePasswordDto, IsString, MaxLength, MinLength

### Community 58 - "Cluster 58"
Cohesion: 0.17
Nodes (8): AdminPartnersPage(), CATEGORY_OPTIONS, EMPTY_FORM, TIER_OPTIONS, CATEGORY_META, CATEGORY_ORDER, CustomerPartnersPage(), partnersAPI

### Community 59 - "Cluster 59"
Cohesion: 0.24
Nodes (6): HealthController, ApiOperation, ApiTags, Controller, Get, HttpCode

### Community 60 - "Cluster 60"
Cohesion: 0.24
Nodes (7): CustomerJwtGuard, Injectable, LeaderboardOptInDto, IsBoolean, IsOptional, IsString, MaxLength

### Community 61 - "Cluster 61"
Cohesion: 0.24
Nodes (5): BADGE, BadgeCode, GamificationService, Injectable, RegisterPaymentInput

### Community 62 - "Cluster 62"
Cohesion: 0.18
Nodes (9): PointsController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, Get, Request (+1 more)

### Community 63 - "Cluster 63"
Cohesion: 0.25
Nodes (6): AdminClubReportsPage(), fmtBrl(), fmtNum(), fmtPct(), monthLabel(), clubReportsAPI

### Community 64 - "Cluster 64"
Cohesion: 0.20
Nodes (7): AuditLogsController, ApiBearerAuth, ApiTags, Controller, Get, Query, UseGuards

### Community 65 - "Cluster 65"
Cohesion: 0.27
Nodes (4): BenefitsModule, Module, FeedAudienceGuard, Injectable

### Community 66 - "Cluster 66"
Cohesion: 0.20
Nodes (9): IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Min, UpdateEventDto (+1 more)

### Community 67 - "Cluster 67"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, dev, lint, preview, type (+1 more)

### Community 68 - "Cluster 68"
Cohesion: 0.31
Nodes (8): AdminUsersPage(), EditUserModal(), EMPTY, NewUserModal(), ROLE_HEX, ROLES, useDistributors(), useStores()

### Community 69 - "Cluster 69"
Cohesion: 0.22
Nodes (8): author, description, license, name, prisma, seed, private, version

### Community 70 - "Cluster 70"
Cohesion: 0.22
Nodes (8): CreateSolutionDto, IsBoolean, IsIn, IsNumber, IsOptional, IsString, MaxLength, Min

### Community 71 - "Cluster 71"
Cohesion: 0.25
Nodes (7): collection, compilerOptions, assets, deleteOutDir, watchAssets, sourceRoot, **/*.md

### Community 72 - "Cluster 72"
Cohesion: 0.25
Nodes (5): CustomerPaymentsController, Controller, Get, Request, UseGuards

### Community 73 - "Cluster 73"
Cohesion: 0.25
Nodes (7): CreateTaskDto, TASK_STATUSES, IsDateString, IsIn, IsOptional, IsString, MaxLength

### Community 74 - "Cluster 74"
Cohesion: 0.25
Nodes (7): CreateWarrantyPublicDto, IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength

### Community 75 - "Cluster 75"
Cohesion: 0.25
Nodes (7): TASK_STATUSES, IsDateString, IsIn, IsOptional, IsString, MaxLength, UpdateTaskDto

### Community 76 - "Cluster 76"
Cohesion: 0.29
Nodes (3): Get, Param, Query

### Community 77 - "Cluster 77"
Cohesion: 0.33
Nodes (5): SetCostDto, IsNumber, IsOptional, Min, ValidateIf

### Community 78 - "Cluster 78"
Cohesion: 0.40
Nodes (3): prisma, TemplateInput, TEMPLATES

### Community 80 - "Cluster 80"
Cohesion: 0.67
Nodes (3): AppModule, Module, bootstrap()

### Community 84 - "Cluster 84"
Cohesion: 0.67
Nodes (3): CommonModule, Global, Module

## Knowledge Gaps
- **231 isolated node(s):** `collection`, `sourceRoot`, `**/*.md`, `watchAssets`, `deleteOutDir` (+226 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Roles()` connect `Notificacoes & Roles` to `DTOs de Seguro`, `Mascaramento de Dados (CPF/Tel)`, `DTOs de Lojas`, `DTOs de Eventos`, `Email Service & Templates`, `DTOs de WhatsApp`, `Banners Controller`, `DTOs de Pagamento`, `Admin Users Controller`, `Benefits Controller`, `Partners Controller`, `Rewards & Vouchers Controller`, `DTOs de Solucao`, `Cluster 25`, `Cluster 36`, `Cluster 49`, `Cluster 54`, `Cluster 55`, `Cluster 57`, `Cluster 64`?**
  _High betweenness centrality (0.166) - this node is a cross-community bridge._
- **Why does `PrismaService` connect `Servicos Admin/Auth` to `DTOs de Seguro`, `Mascaramento de Dados (CPF/Tel)`, `DTOs de Lojas`, `Email Service & Templates`, `Banners Controller`, `Customer Auth Controller`, `Customer Portal Controller`, `Admin Users Controller`, `Entitlements & Allowances`, `Workshop Controller`, `Benefits Controller`, `Partners Controller`, `Auth Controller`, `Cluster 25`, `Cluster 27`, `Cluster 31`, `Cluster 32`, `Cluster 39`, `Cluster 41`, `Cluster 45`, `Cluster 49`, `Cluster 52`, `Cluster 53`, `Cluster 59`, `Cluster 61`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Why does `AdminUsersController` connect `Admin Users Controller` to `Notificacoes & Roles`, `Cluster 36`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `collection`, `sourceRoot`, `**/*.md` to the rest of the system?**
  _231 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Notificacoes & Roles` be split into smaller, more focused modules?**
  _Cohesion score 0.07958707958707958 - nodes in this community are weakly interconnected._
- **Should `DTOs de Seguro` be split into smaller, more focused modules?**
  _Cohesion score 0.0750925436277102 - nodes in this community are weakly interconnected._
- **Should `Mascaramento de Dados (CPF/Tel)` be split into smaller, more focused modules?**
  _Cohesion score 0.05902980713033314 - nodes in this community are weakly interconnected._