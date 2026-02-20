#!/bin/bash

# Script de Build e Deploy do Frontend Flutter Web
# Relm Care+ - Production

set -e

echo "🚀 Iniciando build e deploy do Frontend Flutter Web..."
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configurações
PROJECT_DIR="/home/user/webapp/frontend"
BUILD_DIR="$PROJECT_DIR/build/web"
VPS_USER="root"
VPS_HOST="191.252.217.190"
VPS_DEPLOY_DIR="/var/www/relm-careplus-prod-web"
API_URL="https://api-careplus.relmbikes.com.br"

# Temporariamente usar IP até DNS estar configurado
API_URL_TEMP="http://191.252.217.190:3005"

echo -e "${YELLOW}⚙️  Configurações:${NC}"
echo "   API URL: $API_URL_TEMP"
echo "   Deploy Dir: $VPS_DEPLOY_DIR"
echo ""

# 1. Verificar Flutter
echo -e "${YELLOW}1️⃣  Verificando Flutter...${NC}"
if ! command -v flutter &> /dev/null; then
    echo -e "${RED}❌ Flutter não encontrado!${NC}"
    echo "   Instale Flutter: https://flutter.dev/docs/get-started/install"
    exit 1
fi
echo -e "${GREEN}✅ Flutter encontrado: $(flutter --version | head -n 1)${NC}"
echo ""

# 2. Limpar build anterior
echo -e "${YELLOW}2️⃣  Limpando build anterior...${NC}"
cd "$PROJECT_DIR"
flutter clean
echo -e "${GREEN}✅ Build anterior limpo${NC}"
echo ""

# 3. Instalar dependências
echo -e "${YELLOW}3️⃣  Instalando dependências...${NC}"
flutter pub get
echo -e "${GREEN}✅ Dependências instaladas${NC}"
echo ""

# 4. Build para Web
echo -e "${YELLOW}4️⃣  Compilando Flutter Web (release mode)...${NC}"
flutter build web \
  --release \
  --web-renderer html \
  --dart-define=API_URL=$API_URL_TEMP \
  --base-href /

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro no build do Flutter${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build concluído com sucesso${NC}"
echo ""

# 5. Verificar arquivos gerados
echo -e "${YELLOW}5️⃣  Verificando arquivos gerados...${NC}"
if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${RED}❌ Diretório de build não encontrado: $BUILD_DIR${NC}"
    exit 1
fi

FILE_COUNT=$(find "$BUILD_DIR" -type f | wc -l)
BUILD_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)
echo -e "${GREEN}✅ Build gerado:${NC}"
echo "   Arquivos: $FILE_COUNT"
echo "   Tamanho: $BUILD_SIZE"
echo ""

# 6. Criar tarball para deploy
echo -e "${YELLOW}6️⃣  Criando arquivo de deploy...${NC}"
TARBALL="/tmp/relm-careplus-frontend-$(date +%Y%m%d-%H%M%S).tar.gz"
cd "$BUILD_DIR"
tar -czf "$TARBALL" .
echo -e "${GREEN}✅ Tarball criado: $TARBALL${NC}"
echo ""

# 7. Upload para VPS
echo -e "${YELLOW}7️⃣  Enviando para VPS...${NC}"
scp "$TARBALL" "$VPS_USER@$VPS_HOST:/tmp/"
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao enviar arquivo para VPS${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Arquivo enviado para VPS${NC}"
echo ""

# 8. Deploy no VPS
echo -e "${YELLOW}8️⃣  Fazendo deploy no VPS...${NC}"
ssh "$VPS_USER@$VPS_HOST" << EOF
set -e

# Criar diretório se não existir
mkdir -p $VPS_DEPLOY_DIR

# Backup do deploy anterior (se existir)
if [ -d "$VPS_DEPLOY_DIR" ] && [ "\$(ls -A $VPS_DEPLOY_DIR)" ]; then
    echo "📦 Fazendo backup do deploy anterior..."
    BACKUP_DIR="$VPS_DEPLOY_DIR-backup-\$(date +%Y%m%d-%H%M%S)"
    cp -r $VPS_DEPLOY_DIR \$BACKUP_DIR
    echo "✅ Backup salvo em: \$BACKUP_DIR"
fi

# Limpar diretório
echo "🧹 Limpando diretório de deploy..."
rm -rf $VPS_DEPLOY_DIR/*

# Extrair novos arquivos
echo "📂 Extraindo arquivos..."
tar -xzf $TARBALL -C $VPS_DEPLOY_DIR

# Ajustar permissões
echo "🔐 Ajustando permissões..."
chown -R www-data:www-data $VPS_DEPLOY_DIR
chmod -R 755 $VPS_DEPLOY_DIR

# Limpar tarball temporário
rm $TARBALL

echo "✅ Deploy concluído!"
ls -lh $VPS_DEPLOY_DIR
EOF

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao fazer deploy no VPS${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Deploy no VPS concluído${NC}"
echo ""

# 9. Limpar tarball local
echo -e "${YELLOW}9️⃣  Limpando arquivos temporários...${NC}"
rm "$TARBALL"
echo -e "${GREEN}✅ Arquivos temporários removidos${NC}"
echo ""

# 10. Resumo final
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ DEPLOY CONCLUÍDO COM SUCESSO!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📋 Próximos passos:${NC}"
echo ""
echo "1. Configure o Nginx (se ainda não fez):"
echo "   ${GREEN}sudo cp /var/www/relm-careplus-prod/deployment/prod/relm-careplus-prod.conf /etc/nginx/sites-available/${NC}"
echo "   ${GREEN}sudo ln -s /etc/nginx/sites-available/relm-careplus-prod.conf /etc/nginx/sites-enabled/${NC}"
echo "   ${GREEN}sudo nginx -t${NC}"
echo "   ${GREEN}sudo systemctl reload nginx${NC}"
echo ""
echo "2. Configure DNS (quando estiver pronto):"
echo "   ${YELLOW}careplus.relmbikes.com.br → 191.252.217.190${NC}"
echo ""
echo "3. Obtenha certificado SSL:"
echo "   ${GREEN}sudo certbot --nginx -d careplus.relmbikes.com.br${NC}"
echo ""
echo -e "${YELLOW}🌐 URLs de acesso:${NC}"
echo "   Temporário (IP): ${GREEN}http://191.252.217.190${NC}"
echo "   Produção (após DNS): ${GREEN}https://careplus.relmbikes.com.br${NC}"
echo ""
