#!/bin/bash
# ============================================
# COMANDOS RÁPIDOS - CRIAR TABELAS DE PRODUTOS
# Execute no servidor: bash QUICK-FIX-COMMANDS.sh
# ============================================

echo "🔄 1. Atualizando código..."
cd /var/www/relm-careplus-prod
git pull origin feature/admin-pages-only

echo ""
echo "📊 2. Executando SQL corrigido (SEM FKs para TEXT ids)..."
cd backend
sudo -u postgres psql relm_careplus_prod < create-product-tables.sql

echo ""
echo "✅ 3. Verificando tabelas criadas..."
sudo -u postgres psql relm_careplus_prod -c "
SELECT tablename FROM pg_tables 
WHERE schemaname='public' 
  AND tablename IN ('product_catalog', 'customer_products', 'extended_warranties', 'product_history')
ORDER BY tablename;
"

echo ""
echo "📈 4. Contando registros..."
sudo -u postgres psql relm_careplus_prod -c "
SELECT 'product_catalog' as table_name, COUNT(*) as row_count FROM product_catalog
UNION ALL
SELECT 'customer_products', COUNT(*) FROM customer_products
UNION ALL
SELECT 'extended_warranties', COUNT(*) FROM extended_warranties
UNION ALL
SELECT 'product_history', COUNT(*) FROM product_history;
"

echo ""
echo "🎯 5. Verificando índices criados..."
sudo -u postgres psql relm_careplus_prod -c "
SELECT tablename, COUNT(*) as index_count
FROM pg_indexes 
WHERE schemaname='public' 
  AND tablename IN ('product_catalog', 'customer_products', 'extended_warranties', 'product_history')
GROUP BY tablename
ORDER BY tablename;
"

echo ""
echo "✅ PRONTO! Se todas as 4 tabelas apareceram, está tudo OK!"
echo "📝 Próximo passo: Atualizar Prisma schema e gerar client"
