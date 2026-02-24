#!/bin/bash
# Script de correção rápida - executar no servidor

echo "🔧 Correção Rápida - RELM Care+"
echo "================================"
echo ""

cd /var/www/relm-careplus-prod

# Pull da correção
echo "📥 Baixando correção do GitHub..."
git pull origin feature/insurance-module

# Build e deploy do frontend
echo "⚛️  Build do frontend..."
cd frontend
npm run build

echo "📦 Deploy do frontend..."
sudo rm -rf /var/www/relm-careplus-prod-web/assets
sudo cp -r dist/assets /var/www/relm-careplus-prod-web/
sudo cp dist/index.html /var/www/relm-careplus-prod-web/
sudo chown -R www-data:www-data /var/www/relm-careplus-prod-web/
sudo chmod -R 755 /var/www/relm-careplus-prod-web/

echo ""
echo "✅ Correção aplicada!"
echo ""
echo "🧪 Testando..."
curl -s http://localhost:3005/api/health | head -c 200
echo ""
echo ""
echo "🌐 Acesse: http://177.153.62.248"
