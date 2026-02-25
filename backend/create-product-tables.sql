-- ============================================
-- NOVA ARQUITETURA DE PRODUTOS - RELM CARE
-- Criação das 4 tabelas principais
-- ============================================

-- ============================================
-- 1. PRODUCT_CATALOG (Catálogo de Produtos)
-- ============================================
CREATE TABLE IF NOT EXISTS product_catalog (
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
    
    -- Configurações de garantia padrão
    has_standard_warranty BOOLEAN DEFAULT false,
    standard_warranty_months INTEGER, -- Ex: 12 meses
    
    -- Configurações de garantia estendida
    can_extend_warranty BOOLEAN DEFAULT false,
    extended_warranty_months INTEGER, -- Ex: 24 meses adicionais
    extended_warranty_price DECIMAL(10,2), -- Preço sugerido (admin pode mudar)
    
    -- Pontos do clube
    club_points_base INTEGER DEFAULT 0, -- Pontos ganhos ao registrar
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_catalog_category ON product_catalog(category);
CREATE INDEX IF NOT EXISTS idx_product_catalog_active ON product_catalog(active);
CREATE INDEX IF NOT EXISTS idx_product_catalog_brand ON product_catalog(brand);

-- ============================================
-- 2. CUSTOMER_PRODUCTS (Produtos Registrados)
-- ============================================
CREATE TABLE IF NOT EXISTS customer_products (
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
    standard_warranty_expires_at TIMESTAMP, -- Calculado automaticamente
    
    -- Benefícios
    club_member_since TIMESTAMP, -- Preenchido após aprovação
    club_points INTEGER DEFAULT 0, -- Pontos acumulados por este produto
    
    -- Metadata
    notes TEXT, -- Notas do cliente
    admin_notes TEXT, -- Notas internas do admin
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_customer_products_customer ON customer_products(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_products_catalog ON customer_products(product_catalog_id);
CREATE INDEX IF NOT EXISTS idx_customer_products_serial ON customer_products(serial_number);
CREATE INDEX IF NOT EXISTS idx_customer_products_status ON customer_products(status);
CREATE INDEX IF NOT EXISTS idx_customer_products_verification ON customer_products(verification_status);
CREATE INDEX IF NOT EXISTS idx_customer_products_store ON customer_products(store_id);

-- ============================================
-- 3. EXTENDED_WARRANTIES (Garantias Estendidas)
-- ============================================
CREATE TABLE IF NOT EXISTS extended_warranties (
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
    price_paid DECIMAL(10,2) DEFAULT 0, -- Admin define caso a caso ou 0 se brinde
    payment_status VARCHAR(50) DEFAULT 'FREE', -- PENDING, PAID, REFUNDED, FREE
    payment_date TIMESTAMP,
    payment_method VARCHAR(50), -- PIX, CARD, CLUB_POINTS, FREE
    payment_reference VARCHAR(255), -- ID da transação
    
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
    cancelled_at TIMESTAMP,
    cancelled_by_user_id UUID REFERENCES users(id),
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_extended_warranties_customer ON extended_warranties(customer_id);
CREATE INDEX IF NOT EXISTS idx_extended_warranties_product ON extended_warranties(customer_product_id);
CREATE INDEX IF NOT EXISTS idx_extended_warranties_status ON extended_warranties(status);
CREATE INDEX IF NOT EXISTS idx_extended_warranties_type ON extended_warranties(type);
CREATE INDEX IF NOT EXISTS idx_extended_warranties_dates ON extended_warranties(start_date, end_date);

-- ============================================
-- 4. PRODUCT_HISTORY (Histórico de Produtos)
-- ============================================
CREATE TABLE IF NOT EXISTS product_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_product_id UUID NOT NULL REFERENCES customer_products(id) ON DELETE CASCADE,
    
    -- Evento
    event_type VARCHAR(50) NOT NULL, -- REGISTERED, APPROVED, REJECTED, TRANSFERRED, STATUS_CHANGED, WARRANTY_ACTIVATED, CLAIM_OPENED, WARRANTY_GRANTED
    
    -- Detalhes
    from_value TEXT, -- Estado anterior (JSON ou texto)
    to_value TEXT, -- Estado novo (JSON ou texto)
    description TEXT, -- Descrição legível do evento
    
    -- Transferência
    from_customer_id UUID REFERENCES customers(id),
    to_customer_id UUID REFERENCES customers(id),
    
    -- Quem fez
    performed_by_user_id UUID REFERENCES users(id), -- Admin que fez ação
    performed_by_customer_id UUID REFERENCES customers(id), -- Cliente que fez ação
    
    -- Metadata
    notes TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_product_history_product ON product_history(customer_product_id);
CREATE INDEX IF NOT EXISTS idx_product_history_event ON product_history(event_type);
CREATE INDEX IF NOT EXISTS idx_product_history_date ON product_history(created_at);
CREATE INDEX IF NOT EXISTS idx_product_history_from_customer ON product_history(from_customer_id);
CREATE INDEX IF NOT EXISTS idx_product_history_to_customer ON product_history(to_customer_id);

-- ============================================
-- 5. MIGRAÇÃO - Adicionar campo em warranty_claims
-- ============================================
-- Adicionar campo opcional para vincular claims a produtos registrados
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='warranty_claims' AND column_name='customer_product_id'
    ) THEN
        ALTER TABLE warranty_claims 
        ADD COLUMN customer_product_id UUID REFERENCES customer_products(id) ON DELETE SET NULL;
        
        CREATE INDEX idx_warranty_claims_customer_product ON warranty_claims(customer_product_id);
    END IF;
END $$;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Contar registros em cada tabela nova
SELECT 
    'product_catalog' as table_name, 
    COUNT(*) as row_count 
FROM product_catalog
UNION ALL
SELECT 'customer_products', COUNT(*) FROM customer_products
UNION ALL
SELECT 'extended_warranties', COUNT(*) FROM extended_warranties
UNION ALL
SELECT 'product_history', COUNT(*) FROM product_history;

-- Listar todas as tabelas criadas
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('product_catalog', 'customer_products', 'extended_warranties', 'product_history')
ORDER BY tablename;
