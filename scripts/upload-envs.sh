#!/bin/bash
# ============================================
# upload-envs.sh — Copia arquivos .env para o VPS
# Execute na sua máquina LOCAL:
#   bash scripts/upload-envs.sh
# ============================================

set -e

VPS_USER="root"
VPS_HOST="177.153.62.248"
PROJECT_DIR="/var/www/relm-careplus-prod"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[..] $1${NC}"; }
fail() { echo -e "${RED}[ERRO]${NC} $1"; exit 1; }

# Detectar diretório raiz do projeto (onde o script está localizado)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo ""
echo "==========================================="
echo "  Relm Care+ — Upload de .env para VPS"
echo "  Destino: $VPS_USER@$VPS_HOST"
echo "==========================================="
echo ""

# ── Verificar arquivos locais ─────────────────
warn "Verificando arquivos .env locais..."

BACKEND_ENV="$ROOT_DIR/backend/.env.production"
FRONTEND_ENV="$ROOT_DIR/frontend/.env.production"

[ -f "$BACKEND_ENV" ]  || fail "Não encontrado: $BACKEND_ENV"
[ -f "$FRONTEND_ENV" ] || fail "Não encontrado: $FRONTEND_ENV"

# Verificar se ainda tem placeholders no backend .env
if grep -q "SUBSTITUIR_AQUI\|SENHA_DO_POSTGRES_AQUI\|GERAR_COM_openssl" "$BACKEND_ENV"; then
    echo ""
    echo -e "${RED}ATENÇÃO: backend/.env.production contém valores placeholder!${NC}"
    echo ""
    echo "Você precisa editar o arquivo e substituir:"
    echo "  - SENHA_DO_POSTGRES_AQUI  → senha real do PostgreSQL"
    echo "  - JWT_SECRET              → gerar com: openssl rand -hex 64"
    echo "  - JWT_REFRESH_SECRET      → gerar com: openssl rand -hex 64 (diferente)"
    echo ""
    read -p "Deseja continuar mesmo assim? (não recomendado) [s/N] " -n 1 -r
    echo ""
    [[ $REPLY =~ ^[Ss]$ ]] || { echo "Abortado."; exit 0; }
fi

log "Arquivos .env encontrados"

# ── Upload via SCP ────────────────────────────
warn "Enviando backend/.env.production..."
scp "$BACKEND_ENV" "$VPS_USER@$VPS_HOST:$PROJECT_DIR/backend/.env.production"
log "backend/.env.production enviado"

warn "Enviando frontend/.env.production..."
scp "$FRONTEND_ENV" "$VPS_USER@$VPS_HOST:$PROJECT_DIR/frontend/.env.production"
log "frontend/.env.production enviado"

# ── Verificar no servidor ─────────────────────
warn "Verificando arquivos no servidor..."
ssh "$VPS_USER@$VPS_HOST" "ls -la $PROJECT_DIR/backend/.env.production $PROJECT_DIR/frontend/.env.production"
log "Arquivos confirmados no servidor"

echo ""
echo "==========================================="
echo -e "${GREEN}  Upload concluído!${NC}"
echo "==========================================="
echo ""
echo "  Agora execute no servidor:"
echo "    ssh $VPS_USER@$VPS_HOST"
echo "    bash $PROJECT_DIR/scripts/deploy.sh"
echo ""
