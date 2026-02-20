#!/bin/bash
# Script de setup rápido para desenvolvimento local

set -e

echo "🚀 Relm Care+ - Setup Desenvolvimento Local"
echo "============================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js 20.x primeiro."
    exit 1
fi

echo "✅ Node.js $(node --version) detectado"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL não encontrado. Instale PostgreSQL 15.x primeiro."
    exit 1
fi

echo "✅ PostgreSQL detectado"
echo ""

# Backend setup
echo "📦 Instalando dependências do backend..."
cd backend
npm install

echo ""
echo "📝 Configurando .env..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ .env criado. EDITE com suas credenciais locais!"
    echo "   DATABASE_URL, JWT_SECRET, etc."
else
    echo "⚠️  .env já existe, pulando..."
fi

echo ""
echo "🗄️  Preparando banco de dados..."
echo "   Certifique-se de que PostgreSQL está rodando e você editou o .env!"
read -p "   Pressione ENTER para continuar ou CTRL+C para cancelar..."

npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed

echo ""
echo "✅ Backend configurado!"
echo ""
echo "🎨 Para configurar o frontend:"
echo "   cd ../frontend"
echo "   flutter pub get"
echo ""
echo "🚀 Para rodar:"
echo "   Backend: npm run start:dev"
echo "   Frontend: flutter run -d chrome"
echo ""
echo "📚 Documentação:"
echo "   - antigravity.md (Source of Truth)"
echo "   - README-DEPLOY.md (Deploy VPS)"
echo "   - Swagger: http://localhost:3003/docs"
echo ""
echo "🎉 Setup concluído!"
