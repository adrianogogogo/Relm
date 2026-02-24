#!/bin/bash
# Script de diagnóstico do backend

echo "🔍 Diagnóstico do Backend RELM Care+"
echo "===================================="
echo ""

echo "📊 Status do PM2:"
pm2 list

echo ""
echo "📝 Últimos 30 logs do backend:"
pm2 logs relm-backend --lines 30 --nostream

echo ""
echo "🔌 Portas em uso:"
netstat -tlnp | grep :3005 || echo "Porta 3005 não está em uso"

echo ""
echo "🏥 Teste de conexão:"
curl -s http://localhost:3005/api/health || echo "❌ Backend não responde"

echo ""
echo "📁 Verificar arquivos backend:"
ls -lh /var/www/relm-careplus-prod/backend/src/banners/

echo ""
echo "🔧 Verificar dependências do Multer:"
cd /var/www/relm-careplus-prod/backend
grep -E "(multer|@nestjs/platform)" package.json || echo "❌ Multer não encontrado"

echo ""
echo "💾 Verificar diretório de uploads:"
ls -lhd /var/www/relm-careplus-prod-web/uploads/banners/ 2>/dev/null || echo "❌ Diretório de uploads não existe"

echo ""
echo "🔐 Verificar permissões:"
ls -lh /var/www/relm-careplus-prod-web/uploads/ 2>/dev/null || echo "❌ Diretório uploads não existe"

echo ""
echo "📋 Variáveis de ambiente:"
cd /var/www/relm-careplus-prod/backend
if [ -f ".env.production" ]; then
  echo "✅ .env.production existe"
  grep -E "^(DATABASE_URL|PORT|NODE_ENV)" .env.production | sed 's/=.*/=***/' || echo "Variáveis não encontradas"
else
  echo "❌ .env.production não encontrado"
fi

echo ""
echo "===================================="
echo "Diagnóstico completo!"
