#!/bin/bash

echo "🔍 Verificando estrutura do projeto..."
echo ""

ERRORS=0

# 1. Verificar arquivos de layout
echo "📋 Verificando componentes de layout:"

if [ -f "frontend/src/components/AdminLayout.jsx" ]; then
  echo "  ✅ AdminLayout.jsx existe"
  if grep -q "ImageIcon" "frontend/src/components/AdminLayout.jsx"; then
    echo "  ✅ Menu Banners incluído em AdminLayout"
  else
    echo "  ❌ Menu Banners NÃO encontrado em AdminLayout"
    ((ERRORS++))
  fi
else
  echo "  ❌ AdminLayout.jsx NÃO existe"
  ((ERRORS++))
fi

if [ -f "frontend/src/components/PublicLayout.jsx" ]; then
  echo "  ✅ PublicLayout.jsx existe"
else
  echo "  ❌ PublicLayout.jsx NÃO existe"
  ((ERRORS++))
fi

if [ -f "frontend/src/components/Header.jsx" ]; then
  echo "  ✅ Header.jsx existe"
  if grep -q "/logo-relm.png" "frontend/src/components/Header.jsx"; then
    echo "  ✅ Header usa logo-relm.png"
  else
    echo "  ❌ Header NÃO usa logo-relm.png"
    ((ERRORS++))
  fi
else
  echo "  ❌ Header.jsx NÃO existe"
  ((ERRORS++))
fi

# 2. Verificar App.jsx
echo ""
echo "🔧 Verificando App.jsx:"

if [ -f "frontend/src/App.jsx" ]; then
  echo "  ✅ App.jsx existe"
  
  if grep -q "import AdminLayout" "frontend/src/App.jsx"; then
    echo "  ✅ AdminLayout importado"
  else
    echo "  ❌ AdminLayout NÃO importado"
    ((ERRORS++))
  fi
  
  if grep -q "import PublicLayout" "frontend/src/App.jsx"; then
    echo "  ✅ PublicLayout importado"
  else
    echo "  ❌ PublicLayout NÃO importado"
    ((ERRORS++))
  fi
  
  if grep -q '<Route element={<PublicLayout />}>' "frontend/src/App.jsx"; then
    echo "  ✅ PublicLayout usado nas rotas públicas"
  else
    echo "  ❌ PublicLayout NÃO usado nas rotas públicas"
    ((ERRORS++))
  fi
  
  if grep -q '<AdminLayout />' "frontend/src/App.jsx"; then
    echo "  ✅ AdminLayout usado nas rotas admin"
  else
    echo "  ❌ AdminLayout NÃO usado nas rotas admin"
    ((ERRORS++))
  fi
else
  echo "  ❌ App.jsx NÃO existe"
  ((ERRORS++))
fi

# 3. Verificar página de banners
echo ""
echo "🎨 Verificando sistema de banners:"

if [ -f "frontend/src/pages/BannersPage.jsx" ]; then
  echo "  ✅ BannersPage.jsx existe"
else
  echo "  ❌ BannersPage.jsx NÃO existe"
  ((ERRORS++))
fi

if [ -f "frontend/src/components/BannerCarousel.jsx" ]; then
  echo "  ✅ BannerCarousel.jsx existe"
else
  echo "  ❌ BannerCarousel.jsx NÃO existe"
  ((ERRORS++))
fi

if grep -q "path=\"/admin/banners\"" "frontend/src/App.jsx" || grep -q "path='/admin/banners'" "frontend/src/App.jsx" || grep -q 'path="banners"' "frontend/src/App.jsx" || grep -q "path='banners'" "frontend/src/App.jsx"; then
  echo "  ✅ Rota /admin/banners configurada"
else
  echo "  ❌ Rota /admin/banners NÃO configurada"
  ((ERRORS++))
fi

# 4. Verificar backend
echo ""
echo "⚙️ Verificando backend:"

if [ -f "backend/src/banners/banners.module.ts" ]; then
  echo "  ✅ BannersModule existe"
else
  echo "  ❌ BannersModule NÃO existe"
  ((ERRORS++))
fi

if [ -f "backend/src/banners/banners.service.ts" ]; then
  echo "  ✅ BannersService existe"
else
  echo "  ❌ BannersService NÃO existe"
  ((ERRORS++))
fi

if [ -f "backend/src/banners/banners.controller.ts" ]; then
  echo "  ✅ BannersController existe"
else
  echo "  ❌ BannersController NÃO existe"
  ((ERRORS++))
fi

# Resultado final
echo ""
echo "═════════════════════════════════════"
if [ $ERRORS -eq 0 ]; then
  echo "✅ Todos os componentes estão corretos!"
  echo "═════════════════════════════════════"
  exit 0
else
  echo "❌ Encontrados $ERRORS problema(s)"
  echo "═════════════════════════════════════"
  exit 1
fi
