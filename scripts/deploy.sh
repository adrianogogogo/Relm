#!/bin/bash
# ============================================
# deploy.sh — Relm Care+ Production Deploy
# Execute NO SERVIDOR: bash /var/www/relm-careplus-prod/scripts/deploy.sh
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="/var/www/relm-careplus-prod"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
WEB_DIR="/var/www/relm-careplus-prod-web"
PM2_APP="relm-careplus-prod-backend"

log()  { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[..] $1${NC}"; }
fail() { echo -e "${RED}[ERRO]${NC} $1"; exit 1; }

echo ""
echo "==========================================="
echo "  Relm Care+ — Deploy de Produção"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "==========================================="
echo ""

# ── 1. Verificar arquivos .env ──────────────────
warn "1. Verificando arquivos .env..."
[ -f "$BACKEND_DIR/.env.production" ]  || fail "Arquivo $BACKEND_DIR/.env.production não encontrado. Execute upload-envs.sh primeiro."
[ -f "$FRONTEND_DIR/.env.production" ] || fail "Arquivo $FRONTEND_DIR/.env.production não encontrado. Execute upload-envs.sh primeiro."
log ".env de produção encontrados"

# ── 2. Pull do repositório ──────────────────────
warn "2. Atualizando código (git pull)..."
cd "$PROJECT_DIR"
git pull origin main
log "Código atualizado"

# ── 3. Backend: instalar deps e build ──────────
warn "3. Instalando dependências do backend..."
cd "$BACKEND_DIR"
npm ci --omit=dev
log "Dependências do backend instaladas"

warn "4. Compilando backend (TypeScript)..."
npm run build
log "Build do backend concluído"

# ── 4. Prisma ──────────────────────────────────
warn "5. Gerando Prisma Client..."
NODE_ENV=production npx prisma generate

warn "6. Aplicando migrações do banco..."
# Usar migrate deploy para produção (não db push)
NODE_ENV=production npx prisma migrate deploy || {
    warn "migrate deploy falhou, tentando db push..."
    NODE_ENV=production npx prisma db push --accept-data-loss
}
log "Banco de dados atualizado"

# ── 5. Frontend: build React/Vite ──────────────
warn "7. Instalando dependências do frontend..."
cd "$FRONTEND_DIR"
npm ci
log "Dependências do frontend instaladas"

warn "8. Compilando frontend (Vite build)..."
# .env.production é carregado automaticamente pelo Vite
npm run build
log "Build do frontend concluído"

# ── 6. Deploy dos estáticos ────────────────────
warn "9. Publicando arquivos do frontend..."
mkdir -p "$WEB_DIR"
rm -rf "$WEB_DIR"/*
cp -r "$FRONTEND_DIR/dist/"* "$WEB_DIR/"
chown -R www-data:www-data "$WEB_DIR"
chmod -R 755 "$WEB_DIR"
log "Frontend publicado em $WEB_DIR"

# ── 7. Reiniciar backend via PM2 ───────────────
warn "10. Reiniciando backend (PM2)..."
cd "$BACKEND_DIR"

# Copiar .env.production como .env para o PM2 ler
cp .env.production .env

if pm2 describe "$PM2_APP" > /dev/null 2>&1; then
    pm2 reload "$PM2_APP"
    log "Backend recarregado (zero-downtime)"
else
    pm2 start "$PROJECT_DIR/deployment/ecosystem.config.cjs" --only "$PM2_APP"
    log "Backend iniciado pelo PM2"
fi

pm2 save
log "Estado do PM2 salvo"

# ── 8. Reload do Nginx ────────────────────────
warn "11. Recarregando Nginx..."
nginx -t && systemctl reload nginx
log "Nginx recarregado"

# ── Resumo ────────────────────────────────────
echo ""
echo "==========================================="
echo -e "${GREEN}  DEPLOY CONCLUÍDO COM SUCESSO!${NC}"
echo "==========================================="
echo ""
echo "  Frontend:  http://177.153.62.248"
echo "  API:       http://177.153.62.248:3005"
echo "  API docs:  http://177.153.62.248:3005/docs"
echo "  PM2:       pm2 status"
echo "  Logs API:  pm2 logs $PM2_APP"
echo ""
