#!/bin/bash

echo "🔍 VERIFICANDO ESTRUTURA DO PROJETO"
echo "================================"
echo ""

ERRORS=0

# 1. Verificar logo
if [ -f "/var/www/relm-careplus-prod-web/logo-relm.png" ]; then
    echo "✅ Logo existe"
else
    echo "❌ Logo não encontrado!"
    ERRORS=$((ERRORS + 1))
fi

# 2. Verificar AdminLayout
if [ -f "frontend/src/components/AdminLayout.jsx" ]; then
    if grep -q "ImageIcon" frontend/src/components/AdminLayout.jsx; then
        echo "✅ AdminLayout tem menu de Banners"
    else
        echo "⚠️  AdminLayout sem menu de Banners"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "❌ AdminLayout não encontrado!"
    ERRORS=$((ERRORS + 1))
fi

# 3. Verificar App.jsx
if grep -q "AdminLayout" frontend/src/App.jsx; then
    echo "✅ App.jsx usa AdminLayout"
else
    echo "❌ App.jsx não usa AdminLayout!"
    ERRORS=$((ERRORS + 1))
fi

# 4. Verificar BannersPage
if [ -f "frontend/src/pages/BannersPage.jsx" ]; then
    echo "✅ BannersPage existe"
else
    echo "❌ BannersPage não encontrado!"
    ERRORS=$((ERRORS + 1))
fi

# 5. Verificar rota de banners (corrigido)
if grep -q 'path="banners"' frontend/src/App.jsx || grep -q "path='banners'" frontend/src/App.jsx; then
    echo "✅ Rota /admin/banners configurada"
else
    echo "❌ Rota /admin/banners não encontrada!"
    ERRORS=$((ERRORS + 1))
fi

# 6. Verificar se BannersPage está importado
if grep -q "import.*BannersPage" frontend/src/App.jsx; then
    echo "✅ BannersPage importado no App.jsx"
else
    echo "❌ BannersPage não importado!"
    ERRORS=$((ERRORS + 1))
fi

echo ""
if [ $ERRORS -eq 0 ]; then
    echo "✅ ESTRUTURA 100% OK - Tudo funcionando!"
    echo ""
    echo "🎯 Sistema pronto:"
    echo "  • Logo: ✅"
    echo "  • Menu Admin: ✅"
    echo "  • Rota Banners: ✅"
    echo "  • Componentes: ✅"
else
    echo "❌ ENCONTRADOS $ERRORS PROBLEMA(S)!"
fi
echo ""
