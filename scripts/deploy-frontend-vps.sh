#!/bin/bash

# Deploy Frontend Flutter Web - DIRETO NO VPS
# Execute este script NO VPS para fazer build e deploy localmente

set -e

echo "🚀 Deploy Frontend Flutter Web - Relm Care+"
echo ""

# Configurações
DEPLOY_DIR="/var/www/relm-careplus-prod-web"
REPO_DIR="/var/www/relm-careplus-prod"
API_URL="http://191.252.217.190:3005"

# Verificar se Flutter está instalado
if ! command -v flutter &> /dev/null; then
    echo "❌ Flutter não encontrado no VPS"
    echo "📥 Instalando Flutter..."
    
    cd /tmp
    wget https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_3.16.5-stable.tar.xz
    tar xf flutter_linux_3.16.5-stable.tar.xz
    export PATH="$PATH:/tmp/flutter/bin"
    
    flutter doctor
fi

echo "✅ Flutter disponível"
echo ""

# Ir para diretório do frontend
cd "$REPO_DIR/frontend"

echo "🧹 Limpando build anterior..."
flutter clean

echo "📦 Instalando dependências..."
flutter pub get

echo "🔨 Compilando Flutter Web..."
flutter build web \
  --release \
  --web-renderer html \
  --dart-define=API_URL=$API_URL \
  --base-href /

echo "📂 Criando diretório de deploy..."
mkdir -p "$DEPLOY_DIR"

# Backup se existir
if [ "$(ls -A $DEPLOY_DIR 2>/dev/null)" ]; then
    echo "💾 Fazendo backup..."
    BACKUP_DIR="$DEPLOY_DIR-backup-$(date +%Y%m%d-%H%M%S)"
    cp -r "$DEPLOY_DIR" "$BACKUP_DIR"
    echo "   Backup: $BACKUP_DIR"
fi

echo "🚀 Copiando arquivos buildados..."
rm -rf "$DEPLOY_DIR"/*
cp -r build/web/* "$DEPLOY_DIR/"

echo "🔐 Ajustando permissões..."
chown -R www-data:www-data "$DEPLOY_DIR"
chmod -R 755 "$DEPLOY_DIR"

echo ""
echo "✅ Deploy concluído!"
echo ""
echo "📊 Arquivos:"
ls -lh "$DEPLOY_DIR" | head -10

echo ""
echo "🌐 Acesse: http://191.252.217.190"
echo ""
