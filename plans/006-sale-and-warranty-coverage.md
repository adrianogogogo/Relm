# Plan 006: Registrar vendas (Sale/SaleItem) e passar a saber até quando cada série está em garantia

> **Instruções ao executor**: Siga este plano passo a passo. Rode **todos** os
> comandos de verificação e confirme o resultado esperado antes de avançar. Se
> qualquer item de "Condições de PARADA" ocorrer, pare e reporte — não improvise.
> Ao terminar, atualize a linha deste plano em `plans/README.md`.
>
> **Drift check (rode primeiro)**:
> `git diff --stat bc6d86d..HEAD -- backend/prisma/schema.prisma backend/src/app.module.ts backend/src/products backend/src/warranty`
> Se algum arquivo em escopo mudou desde este plano, compare os trechos da seção
> "Estado atual" com o código vivo antes de prosseguir. Divergência = PARADA.

## Status

- **Prioridade**: P1
- **Esforço**: M
- **Risco**: MED (migration nova em produção; nenhum dado existente é alterado)
- **Depende de**: nenhum
- **Categoria**: direction (funcionalidade nova acordada em call com o cliente)
- **Planejado em**: commit `bc6d86d`, 2026-07-22

## Por que isso importa

A plataforma hoje **não registra vendas**. A compra vive solta em três colunas de
`Product` (`purchase_date`, `purchase_invoice_number`, `purchase_store_name`) e
não existe, em lugar nenhum do schema, o prazo ou a data de fim da garantia. Ou
seja: a pergunta central do negócio — *"o produto com série Y está em garantia
até quando, e para qual cliente?"* — é hoje **irrespondível pelo sistema**.

Isso bloqueia três coisas acordadas na call de 22/07/2026: o fluxo de cadastro
de venda na loja, a tela cliente 360° (aba de compras com status de garantia) e
a integração com o Help Desk (que precisa perguntar "essa série está coberta?").

Quando este plano fechar, existirá uma venda com linhas de produto (nome
comercial livre, quantidade, número de série, prazo de garantia), com nota
fiscal anexável, e cada linha carregará `warrantyEndsAt` calculado — consultável
por série.

**Este plano é backend-only.** A tela da loja é o plano 007; a aba do cliente
360° é o plano 008. Não construa UI aqui.

## Estado atual

Arquivos relevantes:

- `backend/prisma/schema.prisma` — schema único, 1088 linhas. Modelos
  `Customer` (l.17), `Product` (l.95), `Store` (l.128), `User` (l.195),
  `WarrantyClaim` (l.259). **Não existe** `Sale` nem `SaleItem`.
- `backend/src/app.module.ts` — registra todos os módulos (`ProductsModule` na
  linha 64, importado na l.16).
- `backend/src/products/` — exemplar de módulo simples (controller + service +
  dto + module). **Use como molde estrutural.**
- `backend/src/warranty/warranty.controller.ts` — exemplar de upload multipart
  para disco (linhas 24-39). **Use como molde do upload da NF.**
- `backend/src/auth/jwt.strategy.ts:23` — o payload do usuário admin/loja.

Trechos que importam (confirme que batem antes de mexer):

`backend/prisma/schema.prisma:95-110` — o produto de **catálogo** (por modelo),
sem série. A série é da unidade:

```prisma
model Product {
  id                    String    @id @default(uuid())
  // serialNumber é da UNIDADE (preenchido na garantia). Catálogo (cadastro
  // admin por modelo) não tem série — por isso é opcional.
  serialNumber          String?   @unique @map("serial_number")
  name                  String?   // Nome comercial do produto (catálogo)
  sku                   String?   // ponytail: SKU livre, não-único por ora
  brand                 String    @default("Relm Bikes")
  ...
}
```

`backend/src/auth/jwt.strategy.ts:16-24` — **o token NÃO carrega `storeId`**:

```ts
  async validate(payload: any) {
    if (payload.type) {
      throw new UnauthorizedException();
    }
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
```

O `storeId` de um usuário `LOJA` vive em `User.storeId`
(`schema.prisma:201`) e precisa ser buscado no banco. **Isto é load-bearing no
Passo 4.**

`backend/src/warranty/warranty.controller.ts:24-39` — o padrão de upload:

```ts
// Upload de anexos para o disco do servidor. Limite 10MB; PDF e imagens.
// ponytail: disco local — trocar por S3 se o volume crescer.
const warrantyUpload = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      const dir = join(process.cwd(), 'uploads', 'warranty');
      mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname)}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req: any, file: any, cb: any) => {
    const ok = /^(image\/(jpeg|png|webp|gif)|application\/pdf)$/.test(file.mimetype);
    cb(ok ? null : new BadRequestException('Tipo de arquivo não permitido (PDF ou imagem).'), ok);
  },
};
```

### Convenções do repositório (siga-as)

1. **Comentários e mensagens de erro em português.** Ex.:
   `throw new NotFoundException('Produto não encontrado');`
   (`backend/src/products/products.service.ts:48-50`).
2. **Simplificações deliberadas são marcadas com `// ponytail:`** seguido do
   teto e do caminho de upgrade. Ex.: `schema.prisma:100`,
   `dto/bulk-create-products.dto.ts:7`. Use esse marcador quando simplificar.
3. **Prisma**: campos em camelCase com `@map("snake_case")`; modelo com
   `@@map("plural_snake_case")`; índices explícitos com `@@index`.
4. **Migrations são SQL escritas à mão**, idempotentes, com comentário-cabeçalho
   em português. Exemplar completo
   (`prisma/migrations/20260709050000_add_quote_quoted_at/migration.sql`):
   ```sql
   -- Wave 9: fluxo de aprovação de cotação de seguro (state machine leve)
   -- Coluna quoted_at registra quando a Relm enviou a cotação (COTADA), usada pelo
   -- cron de expiração de 7 dias. Idempotente.
   ALTER TABLE "insurance_quotes" ADD COLUMN IF NOT EXISTS "quoted_at" TIMESTAMP(3);
   ```
5. **Controllers**: `@UseGuards(JwtAuthGuard)` na classe, `@UseGuards(RolesGuard)`
   + `@Roles(...)` por rota. Papéis válidos (enum `UserRole`, `schema.prisma:186`):
   `ADMIN_RELM`, `GERENTE_RELM`, `SUPORTE_RELM`, `LOJA`, `DISTRIBUIDOR`, `CLIENTE`.
6. **Services** recebem `PrismaService` no construtor
   (`import { PrismaService } from '../prisma/prisma.service';`) e montam `data`
   com spread condicional `...(dto.x !== undefined && { x: dto.x })`.
7. **DTOs** usam `class-validator` + `@Type()` de `class-transformer`.

## Comandos que você vai precisar

Todos rodam a partir de `backend/` (`node_modules` já instalado).

| Objetivo            | Comando                                   | Sucesso                       |
|---------------------|-------------------------------------------|-------------------------------|
| Gerar client Prisma | `npx prisma generate`                     | exit 0                        |
| Validar schema      | `npx prisma validate`                     | "The schema at ... is valid"  |
| Build / typecheck   | `npm run build`                           | exit 0, sem erros TS          |
| Lint                | `npm run lint`                            | exit 0                        |
| Testes              | `npm test`                                | todos passam                  |
| Teste filtrado      | `npm test -- sales`                       | specs de sales passam         |

> **Não rode `npx prisma migrate dev`** — ele reescreve/renomeia migrations e
> pode tentar resetar o banco. Este repo escreve o SQL à mão (convenção 4) e
> aplica com `npm run prisma:migrate:deploy`. Aplicar em produção **não** é sua
> tarefa.

## Escopo

**Em escopo** (os únicos arquivos que você deve criar/modificar):

- `backend/prisma/schema.prisma` (adicionar 2 modelos + 1 relação em `Customer`,
  `Store`, `Product`, `User`)
- `backend/prisma/migrations/20260722000000_add_sales/migration.sql` (criar)
- `backend/src/sales/sales.module.ts` (criar)
- `backend/src/sales/sales.controller.ts` (criar)
- `backend/src/sales/sales.service.ts` (criar)
- `backend/src/sales/dto/create-sale.dto.ts` (criar)
- `backend/src/sales/dto/query-sales.dto.ts` (criar)
- `backend/src/sales/sales.service.spec.ts` (criar)
- `backend/src/app.module.ts` (apenas: 1 import + 1 entrada no array `imports`)

**Fora de escopo** (não toque, mesmo parecendo relacionado):

- `backend/src/warranty/**` — `WarrantyClaim` é *chamado de garantia* (um
  problema relatado), não *cobertura de garantia*. São conceitos diferentes e
  não devem ser fundidos neste plano. Não altere o fluxo de claims.
- As colunas `purchaseDate` / `purchaseInvoiceNumber` / `purchaseStoreName` de
  `Product` — ficam onde estão. Migrar dados delas para `Sale` é trabalho
  futuro; removê-las agora quebra o form público de garantia.
- Todo o `frontend/` — planos 007 e 008.
- Qualquer endpoint de consulta por série para o Help Desk — deliberadamente
  adiado (ver "Notas de manutenção").

## Git workflow

- Branch: `advisor/006-sales`
- Um commit por passo. Estilo observado em `git log --oneline`:
  `feat: registrar vendas com vigencia de garantia` (prefixos `feat:` / `fix:`,
  minúsculas, **sem acentos na mensagem de commit**).
- Não faça push nem abra PR salvo instrução explícita do operador.

## Passos

### Passo 1: Adicionar `Sale` e `SaleItem` ao schema

No fim de `backend/prisma/schema.prisma`, adicione uma seção nova seguindo o
estilo dos separadores existentes (`// ====...` + título). Modelos:

```prisma
// ============================================
// VENDAS (registro de venda na loja + vigência de garantia)
// ============================================

model Sale {
  id           String   @id @default(uuid())
  customerId   String   @map("customer_id")
  storeId      String?  @map("store_id")
  soldByUserId String?  @map("sold_by_user_id")

  saleDate      DateTime @map("sale_date")
  invoiceNumber String?  @map("invoice_number")

  // Nota fiscal: um arquivo por venda, no disco do servidor.
  // ponytail: disco local, igual aos anexos de garantia — trocar por S3 junto.
  invoiceStoragePath String? @map("invoice_storage_path")
  invoiceFileName    String? @map("invoice_file_name")
  invoiceMimeType    String? @map("invoice_mime_type")

  notes     String?  @db.Text
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  customer Customer @relation(fields: [customerId], references: [id])
  store    Store?   @relation(fields: [storeId], references: [id])
  soldBy   User?    @relation("SaleSeller", fields: [soldByUserId], references: [id])
  items    SaleItem[]

  @@index([customerId])
  @@index([storeId])
  @@index([saleDate])
  @@map("sales")
}

model SaleItem {
  id     String @id @default(uuid())
  saleId String @map("sale_id")

  // Nome comercial digitado livremente pela loja no PDV. Obrigatório.
  // productId fica nulo até a curadoria da Relm vincular ao catálogo.
  commercialName String  @map("commercial_name")
  productId      String? @map("product_id")

  quantity     Int      @default(1)
  // ponytail: série não-única (digitação livre no PDV). Unicidade só depois da curadoria.
  serialNumber String?  @map("serial_number")
  unitPrice    Decimal? @map("unit_price") @db.Decimal(10, 2)

  // Vigência: prazo em dias informado na venda; warrantyEndsAt é DERIVADO
  // (saleDate + warrantyDays) e gravado para permitir consulta indexada.
  warrantyDays   Int?      @map("warranty_days")
  warrantyEndsAt DateTime? @map("warranty_ends_at")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  sale    Sale     @relation(fields: [saleId], references: [id], onDelete: Cascade)
  product Product? @relation(fields: [productId], references: [id])

  @@index([saleId])
  @@index([serialNumber])
  @@index([productId])
  @@index([warrantyEndsAt])
  @@map("sale_items")
}
```

E adicione os lados inversos das relações (Prisma exige):

- em `model Customer` (bloco `// Relations`, junto de `warrantyClaims`): `sales                  Sale[]`
- em `model Store` (bloco de relations): `sales      Sale[]`
- em `model Product` (bloco de relations): `saleItems       SaleItem[]`
- em `model User` (bloco de relations, junto de `assignedClaims`): `salesSold      Sale[] @relation("SaleSeller")`

**Nota deliberada**: `serialNumber` em `SaleItem` **não é único**. Séries vêm
digitadas à mão pelo lojista; unicidade global geraria erro 500 no PDV por
typo — daí o comentário `ponytail:` acima do campo.

**Verificar**: `npx prisma validate` → `The schema at ...\schema.prisma is valid 🚀`
e depois `npx prisma generate` → exit 0.

### Passo 2: Escrever a migration SQL à mão

Crie `backend/prisma/migrations/20260722000000_add_sales/migration.sql`,
idempotente, com cabeçalho em português. Ela deve conter, nesta ordem:

1. `CREATE TABLE IF NOT EXISTS "sales" (...)` com as colunas do Passo 1
   (`id TEXT PRIMARY KEY`, `customer_id TEXT NOT NULL`, `store_id TEXT`,
   `sold_by_user_id TEXT`, `sale_date TIMESTAMP(3) NOT NULL`,
   `invoice_number TEXT`, `invoice_storage_path TEXT`, `invoice_file_name TEXT`,
   `invoice_mime_type TEXT`, `notes TEXT`,
   `created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
   `updated_at TIMESTAMP(3) NOT NULL`).
2. `CREATE TABLE IF NOT EXISTS "sale_items" (...)` idem, com
   `sale_id TEXT NOT NULL`, `commercial_name TEXT NOT NULL`, `product_id TEXT`,
   `quantity INTEGER NOT NULL DEFAULT 1`, `serial_number TEXT`,
   `unit_price DECIMAL(10,2)`, `warranty_days INTEGER`,
   `warranty_ends_at TIMESTAMP(3)`.
3. `CREATE INDEX IF NOT EXISTS` para cada `@@index` declarado
   (nomes no padrão do Prisma: `sales_customer_id_idx`, `sales_store_id_idx`,
   `sales_sale_date_idx`, `sale_items_sale_id_idx`,
   `sale_items_serial_number_idx`, `sale_items_product_id_idx`,
   `sale_items_warranty_ends_at_idx`).
4. As FKs, cada uma envolvida em
   `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$;`
   para manter a idempotência.
   `sale_items.sale_id` → `sales(id)` com `ON DELETE CASCADE`;
   `sales.customer_id` → `customers(id)` com `ON DELETE RESTRICT` (é NOT NULL);
   as demais (`sales.store_id`, `sales.sold_by_user_id`, `sale_items.product_id`)
   com `ON DELETE SET NULL`.

**Verificar**: `npx prisma validate` → válido. (Não aplique a migration.)
Confira manualmente que cada `CREATE`/`ALTER` tem `IF NOT EXISTS` ou guarda de
idempotência — rodar o arquivo duas vezes não pode falhar.

### Passo 3: Criar os DTOs

`backend/src/sales/dto/create-sale.dto.ts`:

```ts
import {
  IsArray, IsDateString, IsInt, IsNumber, IsOptional, IsString,
  IsUUID, MaxLength, Min, ArrayMinSize, ArrayMaxSize, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSaleItemDto {
  // Nome comercial livre — é o que o lojista digita no PDV.
  @IsString()
  @MaxLength(200)
  commercialName: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  serialNumber?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  // 60 / 90 / 180 / 360 são os prazos usuais, mas o campo é livre em dias.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  warrantyDays?: number;
}

export class CreateSaleDto {
  @IsUUID()
  customerId: string;

  @IsOptional()
  @IsUUID()
  storeId?: string;

  @IsDateString()
  saleDate: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  invoiceNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50) // ponytail: teto sanidade; subir se vendas maiores aparecerem
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];
}
```

`backend/src/sales/dto/query-sales.dto.ts`: `customerId?`, `storeId?`, `serial?`
(todos `@IsOptional()` `@IsString()`), mais `page?` e `limit?` numéricos
(`@Type(() => Number) @IsInt() @Min(1)`), com `limit` também `@Max(100)`.

**Verificar**: `npm run build` → exit 0.

### Passo 4: Criar `SalesService`

`backend/src/sales/sales.service.ts`. Comportamento exigido:

**`create(dto: CreateSaleDto, userId?: string)`**
1. Busca o usuário: `const user = userId ? await this.prisma.user.findUnique({ where: { id: userId } }) : null;`
2. **Resolução de loja (load-bearing)**: se `user?.role === 'LOJA'`, a loja da
   venda é **sempre** `user.storeId`, ignorando `dto.storeId`. Se
   `user.role === 'LOJA'` e `user.storeId` for nulo, lance
   `new BadRequestException('Usuário de loja sem loja vinculada.')`.
   Para os demais papéis, use `dto.storeId` (opcional).
3. Valida que o cliente existe:
   `if (!customer) throw new NotFoundException('Cliente não encontrado');`
4. Calcula, **para cada item**, `warrantyEndsAt` via o helper abaixo, declarado
   no topo do arquivo e exportado (o teste importa ele diretamente):
   ```ts
   // Vigência derivada: data da venda + prazo em dias. Exportado para o teste.
   export function computeWarrantyEnd(saleDate: Date, warrantyDays?: number | null): Date | null {
     if (warrantyDays == null) return null;
     return new Date(saleDate.getTime() + warrantyDays * 24 * 60 * 60 * 1000);
   }
   ```
5. Cria a venda e as linhas numa única chamada aninhada
   (`this.prisma.sale.create({ data: { ..., items: { create: [...] } }, include: { items: true } })`).

**`findAll(query, userId?)`** — paginado, **sempre**. Default `page=1`,
`limit=20`, teto 100. Retorne `{ data, total, page, limit }`. Filtros:
`customerId`, `storeId`, e `serial` (que filtra
`items: { some: { serialNumber: { contains: serial, mode: 'insensitive' } } }`).
Inclua `items` e `customer: { select: { id: true, fullName: true } }`.
Ordene por `saleDate: 'desc'`.
> Paginação não é opcional: `warranty.findAll` já é um problema conhecido de
> query ilimitada neste repo (plano 004). Não repita.

**`findOne(id, userId?)`** — `include: { items: { include: { product: true } }, customer: true, store: true }`;
`NotFoundException('Venda não encontrada')` se ausente.

**`attachInvoice(id, file, userId?)`** — verifica que a venda existe, grava
`invoiceStoragePath: file.path`, `invoiceFileName: file.originalname`,
`invoiceMimeType: file.mimetype` e retorna a venda atualizada.

**Escopo por papel na leitura**: em `findAll` e `findOne`, se o usuário for
`LOJA`, force o filtro `storeId = user.storeId` — uma loja não pode ver vendas
de outra loja. Em `findOne`, se a venda existir mas for de outra loja, lance
`NotFoundException('Venda não encontrada')` (não `ForbiddenException` — não
vaze a existência do registro).

**Verificar**: `npm run build` → exit 0.

### Passo 5: Criar controller e módulo, e registrar no app

`backend/src/sales/sales.controller.ts` — molde: `products.controller.ts`
(classe com `@ApiTags('sales')`, `@Controller('sales')`,
`@UseGuards(JwtAuthGuard)`, `@ApiBearerAuth()`). Rotas:

| Método | Rota                | `@Roles`                                          |
|--------|---------------------|---------------------------------------------------|
| POST   | `/sales`            | `ADMIN_RELM`, `GERENTE_RELM`, `SUPORTE_RELM`, `LOJA` |
| GET    | `/sales`            | `ADMIN_RELM`, `GERENTE_RELM`, `SUPORTE_RELM`, `LOJA` |
| GET    | `/sales/:id`        | `ADMIN_RELM`, `GERENTE_RELM`, `SUPORTE_RELM`, `LOJA` |
| POST   | `/sales/:id/invoice`| `ADMIN_RELM`, `GERENTE_RELM`, `SUPORTE_RELM`, `LOJA` |

`DISTRIBUIDOR` e `CLIENTE` **não** têm acesso a nenhuma delas.

O `POST /sales/:id/invoice` copia o bloco `warrantyUpload` de
`warranty.controller.ts:24-39`, trocando o diretório para
`join(process.cwd(), 'uploads', 'sales')`, e usa
`@UseInterceptors(FileInterceptor('file', salesUpload))` +
`@UploadedFile() file: any`, com
`if (!file) throw new BadRequestException('Arquivo obrigatório.');`.

Todas as rotas que precisam do usuário usam `@Request() req: any` e passam
`req.user?.userId`.

`backend/src/sales/sales.module.ts` — cópia estrutural de `products.module.ts`.

Em `backend/src/app.module.ts`: adicione
`import { SalesModule } from './sales/sales.module';` junto dos outros imports
e `SalesModule,` no array `imports`, logo após `ProductsModule,`.

**Verificar**:
- `npm run build` → exit 0
- `npm run lint` → exit 0
- `grep -n "SalesModule" src/app.module.ts` → 2 ocorrências

### Passo 6: Testes

Ver "Plano de teste".

## Plano de teste

Crie `backend/src/sales/sales.service.spec.ts`. **Antes de escrever**, rode
`npm test` e verifique se já existem specs no repo:

- Se **existirem** specs (`ls src/**/*.spec.ts`), copie a estrutura do mais
  próximo e siga-a.
- Se **não existirem**, este é o primeiro spec: escreva-o com o Jest já
  configurado em `backend/package.json` (`npm test` roda `jest`), sem instalar
  nada e sem alterar a config do Jest. Se `npm test` falhar com "no tests found"
  ou erro de configuração, isso é uma **condição de PARADA** (o plano 001 existe
  exatamente para estabelecer essa base) — reporte e entregue o resto do plano
  sem o spec.

Casos obrigatórios, todos sobre `computeWarrantyEnd` (função pura, sem banco):

1. `computeWarrantyEnd(new Date('2026-07-22T00:00:00Z'), 90)` →
   `new Date('2026-10-20T00:00:00Z')`.
2. `computeWarrantyEnd(date, null)` → `null`.
3. `computeWarrantyEnd(date, undefined)` → `null`.
4. `computeWarrantyEnd(date, 0)` → a própria data da venda (**não** `null` —
   zero é um prazo válido e `0` é falsy; este teste existe para travar esse bug).

**Verificar**: `npm test -- sales` → todos passam, 4 testes novos.

## Critérios de conclusão

Checáveis por comando. Todos devem valer:

- [ ] `cd backend && npx prisma validate` → schema válido
- [ ] `cd backend && npx prisma generate` → exit 0
- [ ] `cd backend && npm run build` → exit 0, sem erros TS
- [ ] `cd backend && npm run lint` → exit 0
- [ ] `cd backend && npm test -- sales` → passa com 4 testes (ou PARADA
      documentada conforme "Plano de teste")
- [ ] `grep -n "model Sale " backend/prisma/schema.prisma` → 1 ocorrência
- [ ] `grep -rn "warrantyEndsAt" backend/src/sales/` → pelo menos 2 ocorrências
- [ ] `ls backend/prisma/migrations/20260722000000_add_sales/migration.sql` → existe
- [ ] `git status --short` não mostra nenhum arquivo fora da lista "Em escopo"
- [ ] linha do plano 006 atualizada em `plans/README.md`

## Condições de PARADA

Pare e reporte (não improvise) se:

- O trecho de `Product` ou de `jwt.strategy.ts` na seção "Estado atual" não
  bater com o código vivo (o repo mudou desde o planejamento).
- Já existir um modelo `Sale`, `SaleItem` ou uma tabela `sales` no schema —
  alguém implementou isso em paralelo; não sobrescreva.
- `npx prisma validate` falhar duas vezes após tentativa razoável de correção.
- Você concluir que precisa alterar `WarrantyClaim` ou o módulo `warranty/` para
  fazer isso funcionar — é sinal de que os conceitos estão sendo fundidos, e não
  devem ser.
- `npm test` não tiver harness funcional (ver "Plano de teste").

## Notas de manutenção

- **`warrantyEndsAt` é derivado e gravado.** Se `saleDate` ou `warrantyDays` de
  uma linha for editado depois (não há endpoint de edição neste plano), quem
  criar esse endpoint **deve** recalcular `warrantyEndsAt` no mesmo update. Isso
  é o principal ponto a ser cobrado em review de qualquer PR futuro sobre vendas.
- **Adiado de propósito**: o endpoint `GET /sales/coverage?serial=` para o Help
  Desk. Ele é trivial depois deste plano
  (`saleItem.findFirst({ where: { serialNumber }, orderBy: { warrantyEndsAt: 'desc' } })`)
  mas o contrato com o Help Desk ainda não foi fechado — construir agora é
  adivinhar o formato de resposta.
- **Adiado de propósito**: migrar `Product.purchaseDate` /
  `purchaseInvoiceNumber` / `purchaseStoreName` para `Sale`. O form público de
  garantia ainda escreve nessas colunas.
- A NF vai para `uploads/sales/` no disco local, igual aos anexos de garantia.
  Quando/se os anexos migrarem para S3, **as duas** pastas migram juntas.
- Um reviewer deve olhar com atenção: (a) o forçamento de `storeId` para papel
  `LOJA` no create **e** nas leituras, (b) a idempotência da migration, (c) o
  caso `warrantyDays = 0`.
