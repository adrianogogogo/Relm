#!/bin/bash
set -e

echo "🚀 RELM Care+ - Deploy Estrutura de Layouts Completa"
echo "======================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROD_DIR="/var/www/relm-careplus-prod"
WEB_DIR="/var/www/relm-careplus-prod-web"

echo -e "${BLUE}📍 Diretório de trabalho: $PROD_DIR${NC}"
echo ""

# Step 1: Pull latest changes
echo -e "${BLUE}📥 Step 1: Atualizando código do GitHub...${NC}"
cd "$PROD_DIR"
git fetch origin feature/insurance-module
git checkout feature/insurance-module
git pull origin feature/insurance-module

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Código atualizado com sucesso${NC}"
else
  echo -e "${RED}❌ Erro ao atualizar código${NC}"
  exit 1
fi
echo ""

# Step 2: Verify structure
echo -e "${BLUE}🔍 Step 2: Verificando estrutura do projeto...${NC}"
./verify-structure.sh

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Estrutura verificada com sucesso${NC}"
else
  echo -e "${YELLOW}⚠️  Estrutura tem problemas, mas continuando...${NC}"
fi
echo ""

# Step 3: Copy logo
echo -e "${BLUE}🖼️  Step 3: Copiando logo...${NC}"
if [ -f "/tmp/logo-relm.png" ]; then
  sudo cp /tmp/logo-relm.png "$WEB_DIR/logo-relm.png"
  sudo chown www-data:www-data "$WEB_DIR/logo-relm.png"
  sudo chmod 644 "$WEB_DIR/logo-relm.png"
  echo -e "${GREEN}✅ Logo copiado: $(ls -lh $WEB_DIR/logo-relm.png)${NC}"
else
  echo -e "${YELLOW}⚠️  Logo não encontrado em /tmp/logo-relm.png${NC}"
fi
echo ""

# Step 4: Backend - Prisma
echo -e "${BLUE}🗄️  Step 4: Gerando Prisma Client...${NC}"
cd "$PROD_DIR/backend"
npx prisma generate

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Prisma Client gerado${NC}"
else
  echo -e "${RED}❌ Erro ao gerar Prisma Client${NC}"
  exit 1
fi
echo ""

# Step 5: Restart Backend
echo -e "${BLUE}🔄 Step 5: Reiniciando backend...${NC}"
pm2 restart relm-backend
sleep 3
pm2 list | grep relm-backend
echo ""

# Step 6: Check Backend Status
echo -e "${BLUE}🏥 Step 6: Verificando saúde do backend...${NC}"
sleep 5

HEALTH_RESPONSE=$(curl -s http://localhost:3005/api/health || echo "ERROR")
if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
  echo -e "${GREEN}✅ Backend está saudável: $HEALTH_RESPONSE${NC}"
else
  echo -e "${RED}❌ Backend não está respondendo corretamente${NC}"
  echo "Últimos logs do backend:"
  pm2 logs relm-backend --lines 20 --nostream
fi
echo ""

# Step 7: Build Frontend
echo -e "${BLUE}⚛️  Step 7: Build do frontend...${NC}"
cd "$PROD_DIR/frontend"
npm run build

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Frontend compilado com sucesso${NC}"
else
  echo -e "${RED}❌ Erro ao compilar frontend${NC}"
  exit 1
fi
echo ""

# Step 8: Deploy Frontend
echo -e "${BLUE}📦 Step 8: Deploy do frontend...${NC}"
echo "  Removendo assets antigos..."
sudo rm -rf "$WEB_DIR/assets"

echo "  Copiando novos assets..."
sudo cp -r dist/assets "$WEB_DIR/"
sudo cp dist/index.html "$WEB_DIR/"

echo "  Ajustando permissões..."
sudo chown -R www-data:www-data "$WEB_DIR/"
sudo chmod -R 755 "$WEB_DIR/"

if [ -f "$WEB_DIR/index.html" ]; then
  echo -e "${GREEN}✅ Frontend deployed com sucesso${NC}"
  ls -lh "$WEB_DIR/index.html"
  ls -lhd "$WEB_DIR/assets/"
else
  echo -e "${RED}❌ Erro no deploy do frontend${NC}"
  exit 1
fi
echo ""

# Step 9: Test APIs
echo -e "${BLUE}🧪 Step 9: Testando endpoints...${NC}"

echo "  Testing Health API..."
HEALTH=$(curl -s http://localhost:3005/api/health | head -c 200)
echo "  Health: $HEALTH"
echo ""

echo "  Testing Banners API..."
BANNERS=$(curl -s http://localhost:3005/api/public/banners | head -c 400)
echo "  Banners: $BANNERS"
echo ""

# Step 10: Final Summary
echo "══════════════════════════════════════════════════════"
echo -e "${GREEN}✅ DEPLOYMENT CONCLUÍDO COM SUCESSO!${NC}"
echo "══════════════════════════════════════════════════════"
echo ""
echo -e "${BLUE}🔗 URLs de Teste:${NC}"
echo "  🏠 Homepage:        http://177.153.62.248"
echo "  🎨 Banners Admin:   http://177.153.62.248/admin/banners"
echo "  👤 Login Admin:     http://177.153.62.248/login"
echo "  🏥 Health Check:    http://177.153.62.248:3005/api/health"
echo "  📊 API Banners:     http://177.153.62.248:3005/api/public/banners"
echo ""
echo -e "${YELLOW}📋 Próximos passos:${NC}"
echo "  1. Acesse http://177.153.62.248 e faça Ctrl+Shift+R (hard refresh)"
echo "  2. Verifique se o logo RELM aparece no header"
echo "  3. Faça login em /login"
echo "  4. Verifique se o admin tem sidebar azul com logo"
echo "  5. Verifique se o menu 'Banners' aparece no sidebar"
echo "  6. Teste a página /admin/banners"
echo ""
echo -e "${GREEN}🎉 Deploy finalizado!${NC}"
