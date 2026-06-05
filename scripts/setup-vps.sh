#!/bin/bash
# ============================================
# setup-vps.sh — Configuração inicial do VPS
# Execute UMA VEZ como root no servidor:
#   bash setup-vps.sh
# ============================================

set -e

VPS_IP="177.153.62.248"
PROJECT_DIR="/var/www/relm-careplus-prod"
WEB_DIR="/var/www/relm-careplus-prod-web"
REPO_URL="https://github.com/SEU_ORG/relm-careplus.git"  # ajustar

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[..] $1${NC}"; }

echo ""
echo "==========================================="
echo "  Relm Care+ — Setup Inicial do VPS"
echo "  Servidor: $VPS_IP"
echo "==========================================="
echo ""

# ── 1. Atualizar sistema ──────────────────────
warn "1. Atualizando pacotes do sistema..."
apt-get update -qq && apt-get upgrade -y -qq
log "Sistema atualizado"

# ── 2. Instalar Node.js 20 LTS ────────────────
warn "2. Instalando Node.js 20 LTS..."
if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
log "Node.js $(node --version) instalado"
log "npm $(npm --version) instalado"

# ── 3. Instalar PM2 ──────────────────────────
warn "3. Instalando PM2..."
npm install -g pm2
pm2 startup systemd -u root --hp /root
log "PM2 $(pm2 --version) instalado"

# ── 4. Instalar Nginx ─────────────────────────
warn "4. Instalando Nginx..."
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx
log "Nginx instalado e ativo"

# ── 5. Instalar PostgreSQL 16 ─────────────────
warn "5. Instalando PostgreSQL..."
if ! command -v psql &>/dev/null; then
    apt-get install -y postgresql postgresql-contrib
    systemctl enable postgresql
    systemctl start postgresql
fi
log "PostgreSQL $(psql --version) instalado"

# ── 6. Criar banco de dados ──────────────────
warn "6. Criando banco de dados relm_careplus_prod..."
sudo -u postgres psql -c "CREATE DATABASE relm_careplus_prod;" 2>/dev/null || warn "Banco já existe, continuando..."
sudo -u postgres psql -c "CREATE USER postgres WITH SUPERUSER;" 2>/dev/null || true
log "Banco de dados configurado"

# ── 7. Instalar Git ──────────────────────────
warn "7. Verificando Git..."
apt-get install -y git
log "Git $(git --version) disponível"

# ── 8. Criar diretórios ──────────────────────
warn "8. Criando estrutura de diretórios..."
mkdir -p "$PROJECT_DIR"
mkdir -p "$WEB_DIR"
mkdir -p "$PROJECT_DIR/backend/logs"
chown -R www-data:www-data "$WEB_DIR"
log "Diretórios criados"

# ── 9. Clonar repositório ────────────────────
warn "9. Clonando repositório..."
if [ -d "$PROJECT_DIR/.git" ]; then
    warn "   Repositório já existe, fazendo pull..."
    cd "$PROJECT_DIR" && git pull origin main
else
    git clone "$REPO_URL" "$PROJECT_DIR"
fi
log "Código clonado em $PROJECT_DIR"

# ── 10. Configurar Nginx ─────────────────────
warn "10. Configurando Nginx..."
cp "$PROJECT_DIR/deployment/prod/relm-careplus-prod.conf" \
   /etc/nginx/sites-available/relm-careplus-prod.conf

# Remover default e ativar nossa config
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/relm-careplus-prod.conf \
        /etc/nginx/sites-enabled/relm-careplus-prod.conf

nginx -t
systemctl reload nginx
log "Nginx configurado"

# ── 11. Instalar certbot (para SSL futuro) ────
warn "11. Instalando Certbot (SSL)..."
apt-get install -y certbot python3-certbot-nginx 2>/dev/null || true
log "Certbot disponível (use quando o DNS estiver configurado)"

# ── Firewall ──────────────────────────────────
warn "12. Configurando firewall (UFW)..."
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3005/tcp  # API direta (pode fechar após configurar proxy Nginx)
ufw --force enable
log "Firewall configurado"

echo ""
echo "==========================================="
echo -e "${GREEN}  SETUP CONCLUÍDO!${NC}"
echo "==========================================="
echo ""
echo "Próximos passos:"
echo ""
echo "  1. Editar backend/.env.production com a senha do banco e JWT secrets:"
echo "     nano $PROJECT_DIR/backend/.env.production"
echo ""
echo "  2. Gerar JWT secrets seguros:"
echo "     openssl rand -hex 64  # rodar 2x, uma para cada secret"
echo ""
echo "  3. Definir senha do PostgreSQL:"
echo "     sudo -u postgres psql -c \"ALTER USER postgres PASSWORD 'SUA_SENHA';\" "
echo "     (depois atualizar DATABASE_URL no .env.production)"
echo ""
echo "  4. Executar o deploy:"
echo "     bash $PROJECT_DIR/scripts/deploy.sh"
echo ""
echo "  5. Quando DNS estiver pronto, obter SSL:"
echo "     certbot --nginx -d careplus.relmbikes.com.br"
echo ""
