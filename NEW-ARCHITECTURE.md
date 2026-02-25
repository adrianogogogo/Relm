# 🏗️ NOVA ARQUITETURA - SISTEMA DE PRODUTOS RELM CARE

## 📊 VISÃO GERAL DA MUDANÇA

### **Antes (Sistema Atual)**
```
Cliente → Produto (serial) → Garantia (warranty_claims)
```
- Foco: Cadastro de Garantia
- Problema: Nem todos produtos precisam de garantia

### **Depois (Nova Arquitetura)**
```
Cliente → Registra Produto → (Opcional) Garantia Estendida
                           → Acessa Benefícios RELM Club
```
- Foco: Cadastro de Produto
- Benefício: Todo produto registrado = acesso ao clube
- Plus: Opção de comprar/ganhar garantia estendida

---

## 🗄️ ESTRUTURA DE BANCO DE DADOS

### **1. Tabela: `product_catalog` (Catálogo de Produtos)**
**Propósito**: Admin define quais produtos podem ser registrados

```sql
CREATE TABLE product_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'BICYCLE' ou 'ACCESSORY'
    type VARCHAR(100), -- Road, MTB, Gravel, E-bike, Capacete, etc
    brand VARCHAR(100) DEFAULT 'Relm Bikes',
    model VARCHAR(255),
    description TEXT,
    requires_serial BOOLEAN DEFAULT true,
    image_url VARCHAR(500),
    active BOOLEAN DEFAULT true,
    
    -- Configurações de garantia
    has_standard_warranty BOOLEAN DEFAULT false,
    standard_warranty_months INTEGER, -- Ex: 12 meses
    can_extend_warranty BOOLEAN DEFAULT false,
    extended_warranty_months INTEGER, -- Ex: 24 meses adicionais
    extended_warranty_price DECIMAL(10,2), -- Preço da garantia estendida
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_product_catalog_category ON product_catalog(category);
CREATE INDEX idx_product_catalog_active ON product_catalog(active);
```

**Exemplos de Produtos**:
- Bicicleta Relm Road Pro 2024
- Bicicleta Relm MTB Explorer
- Capacete Relm Safety Pro
- Kit de Ferramentas Relm

---

### **2. Tabela: `customer_products` (Produtos Registrados)**
**Propósito**: Produtos que os clientes registraram

```sql
CREATE TABLE customer_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    product_catalog_id UUID REFERENCES product_catalog(id) ON DELETE SET NULL,
    
    -- Informações do produto
    custom_name VARCHAR(255), -- Nome customizado pelo cliente
    serial_number VARCHAR(255), -- Pelo menos serial OU invoice obrigatório
    
    -- Compra
    purchase_date DATE,
    invoice_number VARCHAR(255),
    invoice_url VARCHAR(500), -- Upload da nota fiscal
    store_name VARCHAR(255),
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    purchase_price DECIMAL(10,2),
    product_value DECIMAL(10,2), -- Valor declarado do produto
    
    -- Aprovação
    verification_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, AUTO_APPROVED
    verified_at TIMESTAMP,
    verified_by_user_id UUID REFERENCES users(id),
    rejection_reason TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, STOLEN, SOLD, INACTIVE, TRANSFERRED
    registration_date TIMESTAMP DEFAULT NOW(),
    
    -- Transferência
    transferred_to_customer_id UUID REFERENCES customers(id),
    transferred_at TIMESTAMP,
    transfer_notes TEXT,
    
    -- Garantia Padrão (ativação manual)
    standard_warranty_activated BOOLEAN DEFAULT false,
    standard_warranty_activated_at TIMESTAMP,
    
    -- Benefícios
    club_member_since TIMESTAMP, -- Preenchido após aprovação
    club_points INTEGER DEFAULT 0, -- Pontos acumulados
    
    -- Metadata
    notes TEXT,
    admin_notes TEXT, -- Notas internas do admin
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT check_serial_or_invoice CHECK (
        serial_number IS NOT NULL OR invoice_url IS NOT NULL
    )
);

CREATE INDEX idx_customer_products_customer ON customer_products(customer_id);
CREATE INDEX idx_customer_products_serial ON customer_products(serial_number);
CREATE INDEX idx_customer_products_status ON customer_products(status);
CREATE INDEX idx_customer_products_verification ON customer_products(verification_status);
```

---

### **3. Tabela: `extended_warranties` (Garantias Estendidas)**
**Propósito**: Garantias estendidas compradas, concedidas ou resgatadas

```sql
CREATE TABLE extended_warranties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_product_id UUID NOT NULL REFERENCES customer_products(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Tipo
    type VARCHAR(50) NOT NULL, -- 'PURCHASED', 'GRANTED', 'PROMOTIONAL', 'CLUB_REDEMPTION'
    
    -- Período
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_months INTEGER NOT NULL,
    
    -- Pagamento (se comprada)
    price_paid DECIMAL(10,2), -- Admin define caso a caso ou 0 se brinde
    payment_status VARCHAR(50), -- PENDING, PAID, REFUNDED, FREE
    payment_date TIMESTAMP,
    payment_method VARCHAR(50), -- PIX, CARD, CLUB_POINTS
    
    -- Resgate por pontos do clube
    club_points_used INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, CANCELLED, USED
    
    -- Uso
    claims_allowed INTEGER DEFAULT 1,
    claims_used INTEGER DEFAULT 0,
    
    -- Metadata
    notes TEXT,
    granted_by_user_id UUID REFERENCES users(id), -- Se foi concedida por admin
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_extended_warranties_customer ON extended_warranties(customer_id);
CREATE INDEX idx_extended_warranties_product ON extended_warranties(customer_product_id);
CREATE INDEX idx_extended_warranties_status ON extended_warranties(status);
CREATE INDEX idx_extended_warranties_type ON extended_warranties(type);
```

---

### **4. Tabela: `product_history` (Histórico de Produtos)**
**Propósito**: Rastrear todas mudanças nos produtos registrados

```sql
CREATE TABLE product_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_product_id UUID NOT NULL REFERENCES customer_products(id) ON DELETE CASCADE,
    
    -- Evento
    event_type VARCHAR(50) NOT NULL, -- REGISTERED, APPROVED, REJECTED, TRANSFERRED, STATUS_CHANGED, WARRANTY_ACTIVATED, CLAIM_OPENED
    
    -- Detalhes
    from_value TEXT, -- Estado anterior (JSON ou texto)
    to_value TEXT, -- Estado novo (JSON ou texto)
    
    -- Transferência
    from_customer_id UUID REFERENCES customers(id),
    to_customer_id UUID REFERENCES customers(id),
    
    -- Quem fez
    performed_by_user_id UUID REFERENCES users(id), -- Admin que fez ação
    performed_by_customer_id UUID REFERENCES customers(id), -- Cliente que fez ação
    
    -- Metadata
    notes TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_product_history_product ON product_history(customer_product_id);
CREATE INDEX idx_product_history_event ON product_history(event_type);
CREATE INDEX idx_product_history_date ON product_history(created_at);
```

---

### **5. Relacionamento com `warranty_claims` (Mantém Compatibilidade)**

```sql
-- ADICIONAR campo opcional na tabela existente (migração)
ALTER TABLE warranty_claims 
ADD COLUMN customer_product_id UUID REFERENCES customer_products(id) ON DELETE SET NULL;

CREATE INDEX idx_warranty_claims_customer_product ON warranty_claims(customer_product_id);
```

**Lógica**:
- Claims antigos: usam `product_id` (tabela products atual)
- Claims novos: podem usar `customer_product_id` (produto registrado)

---

## 🔄 FLUXO DO USUÁRIO

### **Fluxo 1: Registro de Produto**
1. Cliente acessa `/registrar-produto`
2. Seleciona tipo: Bicicleta ou Acessório
3. Escolhe da lista (product_catalog) ou "Outro produto"
4. Informa **pelo menos um**:
   - ✅ Serial Number
   - ✅ Nota Fiscal (upload)
5. Dados adicionais:
   - Data de compra
   - Loja (opcional)
   - Valor do produto
6. ✅ Produto registrado com status **PENDING**
7. ⏳ **Aguardando aprovação do admin**

### **Fluxo 1.1: Aprovação pelo Admin**
1. Admin acessa `/admin/customer-products`
2. Vê lista de produtos **PENDING**
3. Verifica serial number e/ou nota fiscal
4. **Aprova** ou **Rejeita** com motivo
5. Se aprovado:
   - Status → **APPROVED**
   - Cliente recebe notificação
   - `club_member_since` é preenchido
   - 🎉 **Acesso ao RELM Club ativado**
   - Ganha pontos base pelo cadastro

### **Fluxo 2: Ativação de Garantia Padrão**
1. Cliente acessa "Meus Produtos"
2. Produto aprovado mostra: "Garantia Disponível"
3. Cliente clica "Ativar Garantia Padrão"
4. Sistema verifica se dentro do prazo
5. ✅ Garantia ativada
6. `standard_warranty_activated = true`

### **Fluxo 3: Compra/Resgate de Garantia Estendida**
**Opção A: Compra com dinheiro**
1. Cliente vê "Garantia Estendida Disponível"
2. Admin definiu preço: R$ 350,00 ou outro valor
3. Cliente compra (pagamento futuro)
4. ✅ Garantia estendida ativada

**Opção B: Resgate com pontos do clube**
1. Cliente acumula pontos (mais produtos = mais pontos)
2. Pode resgatar garantia com pontos
3. `type = 'CLUB_REDEMPTION'`
4. Pontos são debitados
5. ✅ Garantia estendida ativada

**Opção C: Brinde do admin**
1. Admin acessa produto do cliente
2. Clica "Conceder Garantia Gratuitamente"
3. `type = 'GRANTED'`, `price_paid = 0`
4. Cliente recebe notificação
5. ✅ Garantia estendida ativada

### **Fluxo 4: Transferência de Produto**
1. Cliente acessa produto
2. Clica "Transferir Propriedade"
3. Informa email do novo dono
4. Sistema verifica se novo dono existe (ou cria conta)
5. Novo dono recebe notificação
6. Aceita transferência
7. ✅ Produto transferido
8. Histórico registra transferência
9. Garantias podem ser transferidas junto

### **Fluxo 5: Abertura de Claim (Mantém atual + novo)**
1. Cliente acessa "Abrir Garantia"
2. Seleciona produto registrado
3. Sistema verifica:
   - ✅ Tem garantia padrão ativada? (dentro do prazo)
   - ✅ Tem garantia estendida ativa?
4. Se sim → Abre claim
5. Preenche formulário (igual atual)
6. Cria registro em `warranty_claims`
7. Vincula a `customer_product_id`
8. Fluxo de aprovação continua igual

---

## 🎨 INTERFACES ADMIN

### **1. Catálogo de Produtos (`/admin/product-catalog`)**
- Lista de produtos disponíveis para registro
- CRUD: Criar, Editar, Ativar/Desativar
- Configurar garantias padrão e estendidas
- Upload de imagens

### **2. Produtos Registrados (`/admin/customer-products`)**
- Lista de todos produtos registrados
- **Filtros**: 
  - Status: PENDING, APPROVED, REJECTED, TRANSFERRED
  - Cliente, Categoria, Loja
  - Data de registro
- **Ações em Massa**: Aprovar/rejeitar múltiplos
- **Detalhes do Produto**:
  - Ver serial, nota fiscal (download)
  - Histórico completo (`product_history`)
  - Garantias ativas
  - Claims abertos
- **Aprovar/Rejeitar**:
  - Botão "Aprovar" → muda para APPROVED
  - Botão "Rejeitar" → modal para motivo
  - Notificação automática para cliente
- **Conceder Garantia**:
  - Botão "Conceder Garantia Estendida"
  - Define duração e tipo (brinde, promocional)
- **Ver Transferências**: Histórico de donos anteriores

### **3. Garantias Estendidas (`/admin/extended-warranties`)**
- Listar garantias compradas/concedidas
- Conceder garantia gratuitamente (promoção)
- Ver estatísticas de vendas
- Gerenciar expiração

---

## 📱 INTERFACES CLIENTE

### **1. Portal do Cliente (`/cliente/meus-produtos`)**
- Lista de produtos registrados
- Status de cada produto
- Botão: "Adicionar Produto"
- Ver garantias ativas
- Comprar garantia estendida

### **2. Registrar Produto (`/cliente/registrar-produto`)**
- Wizard de registro
- Seleção de produto do catálogo
- Upload de nota fiscal
- Confirmação

### **3. RELM Club (`/cliente/beneficios`)**
- Acesso a benefícios por ter produtos registrados
- Cupons de desconto
- Eventos exclusivos

---

## ⚙️ REGRAS DE NEGÓCIO (ATUALIZADAS)

### **Registro de Produto**
- ✅ **Validação**: Serial Number OU Nota Fiscal obrigatório
- ✅ **Produtos Múltiplos**: Cliente pode ter vários do mesmo modelo (diferenciados por serial)
- ✅ **Aprovação**: Manual pelo admin (verifica autenticidade)
- ✅ **Status Inicial**: PENDING até aprovação

### **Garantia Padrão**
- ✅ **Não é automática**: Cliente precisa ativar manualmente
- ✅ **Pré-requisito**: Produto APPROVED
- ✅ **Prazo**: Dentro do período definido no catálogo (`standard_warranty_months`)
- ✅ **Ativação**: Válida a partir da data de compra
- ✅ **Gratuita**: Sempre sem custo

### **Garantia Estendida**
- ✅ **Preço Flexível**: Admin define caso a caso (pode ser R$0 se brinde)
- ✅ **Formas de Obtenção**:
  - 💰 Compra com dinheiro (preço definido pelo admin)
  - 🎁 Brinde do admin (GRANTED, preço = 0)
  - 🏆 Resgate com pontos do clube (CLUB_REDEMPTION)
  - 📢 Promoção (PROMOTIONAL)
- ✅ **Múltiplas**: Cliente pode ter várias garantias estendidas no mesmo produto
- ✅ **Período**: Inicia quando garantia padrão expira OU imediatamente

### **Acesso ao RELM Club**
- ✅ **Critério**: Produto APPROVED (não automático no registro)
- ✅ **Campo**: `club_member_since` preenchido após aprovação
- ✅ **Pontos**: Proporcionais à quantidade de produtos
  - 1 bicicleta = 100 pontos base
  - 1 acessório = 20 pontos base
  - Produtos caros = mais pontos (% do valor)
- ✅ **Benefícios**: Aumentam com mais produtos registrados

### **Transferência de Produto**
- ✅ **Permitida**: Cliente pode transferir para outro dono
- ✅ **Processo**: 
  1. Cliente solicita transferência
  2. Informa email do novo dono
  3. Novo dono aceita
  4. Produto muda de `customer_id`
- ✅ **Garantias**: Transferidas junto com produto
- ✅ **Histórico**: Registrado em `product_history`
- ✅ **Status**: Muda para TRANSFERRED no antigo dono

### **Lojas Parceiras**
- ✅ **Podem Registrar**: Produtos para clientes no ato da venda
- ✅ **Status**: AUTO_APPROVED (já vem aprovado)
- ✅ **Visualização**: Podem ver produtos vendidos por elas
- ✅ **Login**: Portal próprio para lojas

### **Migração de Dados Antigos**
- ✅ **Script Automático**: Cria `customer_products` baseado em `warranty_claims` existentes
- ✅ **Status**: AUTO_APPROVED (já eram válidos)
- ✅ **Vinculação**: `customer_product_id` preenchido nos claims antigos
- ✅ **Backwards Compatible**: Sistema antigo continua funcionando

---

## 🚀 PLANO DE IMPLEMENTAÇÃO

### **Fase 1: Backend - Estrutura Base** (3-4 dias)
1. ✅ Criar tabelas SQL
2. ✅ Criar modelos Prisma
3. ✅ Módulo ProductCatalog (admin CRUD)
4. ✅ Módulo CustomerProducts (registro + listagem)
5. ✅ Módulo ExtendedWarranties (CRUD + concessão)
6. ✅ Migração suave (manter warranty_claims funcionando)

### **Fase 2: Frontend Admin** (2-3 dias)
7. ✅ Página Product Catalog
8. ✅ Página Customer Products
9. ✅ Página Extended Warranties
10. ✅ Integração com APIs

### **Fase 3: Frontend Cliente** (3-4 dias)
11. ✅ Login de Cliente
12. ✅ Portal "Meus Produtos"
13. ✅ Wizard de Registro
14. ✅ Compra de Garantia (sem pagamento ainda)

### **Fase 4: Integração e Testes** (2 dias)
15. ✅ Testes end-to-end
16. ✅ Migration de dados antigos (se necessário)
17. ✅ Deploy em produção

---

## ✅ VANTAGENS DA NOVA ARQUITETURA

1. **✅ Foco no Produto**: Cliente registra produtos, não garantias
2. **✅ Upsell Natural**: Garantia estendida como add-on
3. **✅ Clube Automático**: Todo registro = membro do club
4. **✅ Flexibilidade**: Admin controla catálogo centralmente
5. **✅ Backward Compatible**: Sistema antigo continua funcionando
6. **✅ Escalável**: Fácil adicionar novos tipos de produtos

---

## 📊 MÉTRICAS DE SUCESSO

- **Produtos Registrados**: Total, por categoria, por mês
- **Taxa de Conversão**: Registro → Compra garantia estendida
- **Receita**: Vendas de garantias estendidas
- **Engajamento**: Produtos ativos vs inativos
- **RELM Club**: Membros ativos, benefícios resgatados

---

**🎯 Próximo Passo: Começar a implementação?**
