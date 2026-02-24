# 🔧 GUIA DE CORREÇÃO RÁPIDA - Backend em Produção

## ⚠️ Problema Identificado

O Prisma Client está desatualizado/corrompido, causando erros de TypeScript no build.

## ✅ SOLUÇÃO COMPLETA (Execute no Servidor)

```bash
# 1. Parar o backend temporariamente
pm2 stop relm-backend

# 2. Ir para o diretório do projeto
cd /var/www/relm-careplus-prod

# 3. Puxar últimas atualizações
git reset --hard  # Descartar mudanças locais
git pull origin feature/insurance-module

# 4. Ir para o backend
cd backend

# 5. Executar o script de correção
bash fix-production.sh

# 6. Verificar se precisa de npm install
npm ls @nestjs/passport passport-jwt bcrypt || npm install

# 7. Reiniciar o backend
pm2 restart relm-backend

# 8. Aguardar 5 segundos
sleep 5

# 9. Verificar logs
pm2 logs relm-backend --lines 30

# 10. Testar health endpoint
curl http://localhost:3005/api/health
```

## 🚨 Se ainda houver erro de TypeScript

Execute manualmente:

```bash
cd /var/www/relm-careplus-prod/backend

# Remover completamente node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install

# Limpar cache do Prisma
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

# Regenerar Prisma Client
npx prisma generate

# Reiniciar
pm2 restart relm-backend
sleep 3
pm2 logs relm-backend --err --lines 50
```

## ✅ O que foi corrigido

1. **Guards e Decorators de Auth**: Criados arquivos faltantes
   - `src/auth/guards/jwt-auth.guard.ts`
   - `src/auth/guards/roles.guard.ts`
   - `src/auth/decorators/roles.decorator.ts`

2. **Prisma Schema**: Corrigido para match com produção
   - Campo `id` de Banner mantido como UUID
   - Campo `status` de InsuranceQuote mantido como String
   - Todos os campos existentes preservados

3. **Prisma Client**: Script para limpar e regenerar
   - Remove cache antigo
   - Gera novo client baseado no schema correto

## 📊 Verificação Final

Após executar, você deve ver:

```bash
# pm2 list
┌─────┬───────────────┬─────────┬─────────┬────────┐
│ id  │ name          │ status  │ cpu     │ memory │
├─────┼───────────────┼─────────┼─────────┼────────┤
│ 0   │ relm-backend  │ online  │ 0%      │ 45 MB  │
└─────┴───────────────┴─────────┴─────────┴────────┘

# curl http://localhost:3005/api/health
{"status":"ok","database":"connected","timestamp":"2024-02-24T..."}
```

## 🎯 Endpoints Admin Novos

Após o deploy, você terá acesso a:

- **Eventos**: `http://177.153.62.248/admin/events`
- **Seguros**: `http://177.153.62.248/admin/insurance`
- **RELM Club**: `http://177.153.62.248/admin/benefits`

## 📞 Se precisar de ajuda

1. Envie os logs de erro: `pm2 logs relm-backend --err --lines 100`
2. Verifique o schema: `head -50 /var/www/relm-careplus-prod/backend/prisma/schema.prisma`
3. Teste conexão DB: `cd /var/www/relm-careplus-prod/backend && npx prisma db pull --preview-feature`
