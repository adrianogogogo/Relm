# 🗄️ CRIAÇÃO DAS TABELAS DE PRODUTOS

## ✅ O QUE SERÁ CRIADO

### **4 Novas Tabelas**
1. ✅ `product_catalog` - Catálogo de produtos disponíveis para registro
2. ✅ `customer_products` - Produtos registrados pelos clientes
3. ✅ `extended_warranties` - Garantias estendidas (compradas/concedidas/resgatadas)
4. ✅ `product_history` - Histórico completo de mudanças

### **1 Migração**
- ✅ Adiciona campo `customer_product_id` em `warranty_claims` (opcional, não quebra nada)

---

## 🚀 EXECUTAR NO SERVIDOR

### **Passo 1: Fazer backup do banco** (IMPORTANTE!)

```bash
# Backup completo
sudo -u postgres pg_dump relm_careplus_prod > /tmp/backup_antes_produtos_$(date +%Y%m%d_%H%M%S).sql

# Verificar tamanho do backup
ls -lh /tmp/backup_antes_produtos_*.sql
```

### **Passo 2: Executar SQL**

```bash
cd /var/www/relm-careplus-prod/backend

# Executar criação das tabelas
sudo -u postgres psql relm_careplus_prod < create-product-tables.sql
```

### **Passo 3: Verificar**

```bash
# Verificar se tabelas foram criadas
sudo -u postgres psql relm_careplus_prod -c "
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('product_catalog', 'customer_products', 'extended_warranties', 'product_history')
ORDER BY tablename;
"

# Verificar contagem (deve ser 0 em todas)
sudo -u postgres psql relm_careplus_prod -c "
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
"
```

---

## 📊 ESTRUTURA CRIADA

### **product_catalog** (20 campos)
- Informações do produto
- Configurações de garantia
- Pontos do clube
- Status ativo/inativo

### **customer_products** (28 campos)
- Vínculo cliente → produto
- Serial number / Nota fiscal
- Status de verificação (PENDING, APPROVED, etc)
- Garantia padrão
- Transferência
- Pontos do clube

### **extended_warranties** (21 campos)
- Vínculo produto → garantia
- Tipos: PURCHASED, GRANTED, CLUB_REDEMPTION
- Pagamento flexível
- Controle de uso (claims)

### **product_history** (13 campos)
- Auditoria completa
- Eventos rastreados
- Quem fez (admin/cliente)
- IP e user agent

---

## ✅ SEGURANÇA

### **O que NÃO quebra:**
- ✅ Tabelas existentes não são modificadas
- ✅ `warranty_claims` continua funcionando igual
- ✅ Apenas ADICIONA campo opcional
- ✅ Todas as queries antigas funcionam

### **Rollback (se necessário):**

```sql
-- Remover campo adicionado
ALTER TABLE warranty_claims DROP COLUMN IF EXISTS customer_product_id;

-- Dropar tabelas na ordem correta
DROP TABLE IF EXISTS product_history CASCADE;
DROP TABLE IF EXISTS extended_warranties CASCADE;
DROP TABLE IF EXISTS customer_products CASCADE;
DROP TABLE IF EXISTS product_catalog CASCADE;
```

---

## 🎯 PRÓXIMOS PASSOS (APÓS EXECUTAR)

1. ✅ Atualizar Prisma schema
2. ✅ Gerar Prisma Client
3. ✅ Criar módulos backend (ProductCatalog, CustomerProducts, etc)
4. ✅ Testar APIs
5. ✅ Criar interfaces admin
6. ✅ Criar portal do cliente

---

## 📞 SE DER ERRO

**Erro: "relation already exists"**
- Tabela já foi criada antes
- Não é erro crítico, pode continuar

**Erro: "permission denied"**
- Use `sudo -u postgres`
- Verificar permissões do usuário

**Erro: "column already exists"**
- Campo `customer_product_id` já existe em `warranty_claims`
- Não é erro crítico, pode continuar

---

**🎯 Execute os comandos acima e me avise o resultado!** 🚀
