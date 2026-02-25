# 🚀 DEPLOY DAS NOVAS TABELAS DE PRODUTOS

## ✅ CORREÇÕES APLICADAS

**Problema identificado**: `customers.id` é do tipo TEXT no banco, mas o SQL esperava UUID.

**Solução**: Removidas as Foreign Keys (FK) para `customers` temporariamente. A validação será feita no código da aplicação.

---

## 📋 PASSO A PASSO PARA DEPLOY NO SERVIDOR

### **1. Atualizar código no servidor**

```bash
cd /var/www/relm-careplus-prod
git fetch --all
git checkout feature/admin-pages-only
git pull origin feature/admin-pages-only
```

### **2. Fazer backup do banco de dados**

```bash
sudo -u postgres pg_dump relm_careplus_prod > /tmp/backup_antes_tabelas_$(date +%Y%m%d_%H%M%S).sql

echo "✅ Backup criado em /tmp/backup_antes_tabelas_*.sql"
```

### **3. Executar o SQL de criação das tabelas**

```bash
cd /var/www/relm-careplus-prod/backend
sudo -u postgres psql relm_careplus_prod < create-product-tables.sql
```

**O que vai ser criado**:
- ✅ `product_catalog` - Catálogo de produtos disponíveis
- ✅ `customer_products` - Produtos registrados pelos clientes
- ✅ `extended_warranties` - Garantias estendidas
- ✅ `product_history` - Histórico de mudanças
- ✅ Coluna `customer_product_id` em `warranty_claims` (compatibilidade)

### **4. Verificar se as tabelas foram criadas**

```bash
sudo -u postgres psql relm_careplus_prod -c "
SELECT tablename, schemaname 
FROM pg_tables 
WHERE schemaname='public' 
  AND tablename IN ('product_catalog', 'customer_products', 'extended_warranties', 'product_history')
ORDER BY tablename;
"
```

**Esperado**: Deve listar as 4 tabelas criadas.

### **5. Verificar índices criados**

```bash
sudo -u postgres psql relm_careplus_prod -c "
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname='public' 
  AND tablename IN ('product_catalog', 'customer_products', 'extended_warranties', 'product_history')
ORDER BY tablename, indexname;
"
```

**Esperado**: Deve listar ~23 índices criados.

### **6. Contar registros (deve estar zerado)**

```bash
sudo -u postgres psql relm_careplus_prod -c "
SELECT 'product_catalog' as table_name, COUNT(*) as row_count FROM product_catalog
UNION ALL
SELECT 'customer_products', COUNT(*) FROM customer_products
UNION ALL
SELECT 'extended_warranties', COUNT(*) FROM extended_warranties
UNION ALL
SELECT 'product_history', COUNT(*) FROM product_history;
"
```

**Esperado**: Todas com 0 registros.

---

## 🔧 SE ALGO DER ERRADO

### **Rollback - Deletar as tabelas**

```bash
sudo -u postgres psql relm_careplus_prod <<'SQL'
DROP TABLE IF EXISTS product_history CASCADE;
DROP TABLE IF EXISTS extended_warranties CASCADE;
DROP TABLE IF EXISTS customer_products CASCADE;
DROP TABLE IF EXISTS product_catalog CASCADE;

-- Remover coluna adicionada em warranty_claims
ALTER TABLE warranty_claims DROP COLUMN IF EXISTS customer_product_id;
SQL
```

### **Restaurar backup**

```bash
# Listar backups disponíveis
ls -lh /tmp/backup_antes_tabelas_*.sql

# Restaurar (use o arquivo correto)
sudo -u postgres psql relm_careplus_prod < /tmp/backup_antes_tabelas_20260225_XXXXXX.sql
```

---

## 🎯 PRÓXIMOS PASSOS (APÓS CRIAÇÃO DAS TABELAS)

1. **Atualizar Prisma schema** - Adicionar os modelos das novas tabelas
2. **Gerar Prisma Client** - `npx prisma generate`
3. **Criar módulos backend** - ProductCatalog, CustomerProducts, ExtendedWarranties
4. **Restart backend** - `pm2 restart relm-backend`
5. **Criar páginas admin** - Frontend React para gerenciar produtos

---

## ⚠️ OBSERVAÇÕES IMPORTANTES

### **Por que customer_id é UUID nas novas tabelas?**

- As novas tabelas usam UUID para `customer_id` por padronização
- A validação se o customer existe será feita no código da aplicação
- Futuramente, pode-se migrar `customers.id` de TEXT para UUID

### **Por que remover as Foreign Keys?**

- PostgreSQL não permite FK entre tipos incompatíveis (TEXT ≠ UUID)
- A integridade referencial será garantida pela aplicação NestJS
- Alternativa seria mudar `customers.id` para UUID (migração arriscada)

### **As tabelas antigas continuam funcionando?**

- ✅ SIM! Todas as tabelas atuais (`customers`, `products`, `warranty_claims`, etc.) permanecem intactas
- ✅ O sistema atual continua funcionando normalmente
- ✅ As novas tabelas são **adicionais** e não afetam o sistema existente

---

## 📊 RESUMO DO QUE FOI CRIADO

| Tabela | Propósito | Registros Iniciais |
|--------|-----------|-------------------|
| `product_catalog` | Admin gerencia catálogo de produtos | 0 |
| `customer_products` | Clientes registram seus produtos | 0 |
| `extended_warranties` | Garantias estendidas (compradas/concedidas) | 0 |
| `product_history` | Auditoria de mudanças | 0 |

**Total de índices criados**: 23  
**Alteração em tabela existente**: 1 coluna em `warranty_claims` (`customer_product_id`)

---

## ✅ CHECKLIST DE DEPLOY

- [ ] Código atualizado (`git pull`)
- [ ] Backup do banco criado
- [ ] SQL executado sem erros
- [ ] 4 tabelas criadas e verificadas
- [ ] Índices criados (23 índices)
- [ ] Contagem de registros = 0
- [ ] Backend ainda funcionando (health check OK)

---

**Criado por**: Claude AI  
**Data**: 2025-02-25  
**Branch**: `feature/admin-pages-only`  
**Commit**: `2f301bb`
