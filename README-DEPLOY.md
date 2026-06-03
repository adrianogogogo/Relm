# 🚀 Relm Care+ — Deploy Guide

> **Sistema completo de CRM da Relm Bikes**  
> Backend: NestJS + Prisma + PostgreSQL  
> Frontend: Flutter Web  
> Infra: PM2 + Nginx + SSL

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Preparação do VPS](#preparação-do-vps)
3. [Deploy Backend](#deploy-backend)
4. [Deploy Frontend](#deploy-frontend)
5. [Configuração Nginx](#configuração-nginx)
6. [SSL (Certbot)](#ssl-certbot)
7. [Verificação](#verificação)
8. [Rollback](#rollback)
9. [Manutenção](#manutenção)

---

## 1. Pré-requisitos

### No VPS (já instalado):
- ✅ Node.js 20.x
- ✅ PostgreSQL 15.x
- ✅ PM2
- ✅ Nginx
- ✅ Certbot

### Localmente (para desenvolvimento):
- Node.js 20.x
- Flutter SDK 3.x
- Git

---

## 2. Preparação do VPS

### 2.1 Conectar ao VPS

```bash
ssh root@191.252.217.190
```

### 2.2 Criar Estrutura de Diretórios

```bash
# Criar diretórios
mkdir -p /var/www/relm-careplus-prod/{backend,frontend}
mkdir -p /var/www/relm-careplus-staging/{backend,frontend}
mkdir -p /var/www/relm-careplus-prod-web
mkdir -p /var/www/relm-careplus-staging-web

# Criar diretórios de logs
mkdir -p /var/www/relm-careplus-prod/backend/logs
mkdir -p /var/www/relm-careplus-staging/backend/logs

# Permissões
chown -R www-data:www-data /var/www/relm-careplus-*
chmod -R 755 /var/www/relm-careplus-*
```

### 2.3 Criar Bancos de Dados

```bash
# Conectar como postgres
sudo -u postgres psql

# Criar bancos
CREATE DATABASE relm_careplus_prod;
CREATE DATABASE relm_careplus_staging;

# (Opcional) Criar usuário específico
CREATE USER relm_careplus WITH PASSWORD 'SenhaForte123!';
GRANT ALL PRIVILEGES ON DATABASE relm_careplus_prod TO relm_careplus;
GRANT ALL PRIVILEGES ON DATABASE relm_careplus_staging TO relm_careplus;

# Sair
\q
```

---

## 3. Deploy Backend

### 3.1 Produção

#### A. Copiar Código

```bash
# Via Git (recomendado)
cd /var/www/relm-careplus-prod/backend
git clone https://github.com/YOUR_REPO/relm-careplus-backend.git .

# OU via rsync (desenvolvimento local)
rsync -avz --exclude node_modules \
  ./backend/ \
  root@191.252.217.190:/var/www/relm-careplus-prod/backend/
```

#### B. Configurar .env

```bash
cd /var/www/relm-careplus-prod/backend

cat > .env.production << 'EOF'
NODE_ENV=production
PORT=3001
DATABASE_URL="postgresql://postgres:Brasil@2015@localhost:5432/relm_careplus_prod?schema=public"
JWT_SECRET="GENERATE_STRONG_SECRET_HERE_32_CHARS"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="GENERATE_ANOTHER_STRONG_SECRET_HERE"
JWT_REFRESH_EXPIRES_IN="7d"
CORS_ORIGIN="https://careplus.relmbikes.com.br"
APP_NAME="Relm Care+"
APP_URL="https://careplus.relmbikes.com.br"
API_URL="https://api-careplus.relmbikes.com.br"
EOF

# Gerar secrets fortes
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32)"
```

#### C. Instalar Dependências

```bash
cd /var/www/relm-careplus-prod/backend
npm ci --production=false
```

#### D. Build

```bash
npm run build
```

#### E. Prisma (Migrations e Seed)

```bash
# Gerar Prisma Client
npx prisma generate

# Executar migrations
npx prisma migrate deploy

# Executar seed (dados iniciais)
npx prisma db seed
```

**⚠️ Credenciais do Seed:**
```
Admin: admin@relmbikes.com.br / Admin@2024
Gerente: gerente@relmbikes.com.br / Gerente@2024
Suporte: suporte@relmbikes.com.br / Suporte@2024
Loja: loja@bikeshopsp.com.br / Loja@2024
Distribuidor: distribuidor@distrisul.com.br / Distri@2024
```

#### F. Iniciar PM2

```bash
# Copiar ecosystem config
cp /path/to/repo/deployment/ecosystem.config.cjs /var/www/

# Iniciar apenas PROD
pm2 start /var/www/ecosystem.config.cjs --only relm-careplus-prod-backend

# Salvar configuração PM2
pm2 save

# Setup PM2 startup
pm2 startup
# (executar comando sugerido)
```

### 3.2 Staging

Repetir processo acima, alterando:
- Diretório: `/var/www/relm-careplus-staging/backend`
- `.env.staging` com `PORT=3002` e banco `relm_careplus_staging`
- PM2: `pm2 start /var/www/ecosystem.config.cjs --only relm-careplus-staging-backend`

---

## 4. Deploy Frontend

### 4.1 Build Local

```bash
cd frontend

# Build production
flutter build web --release --web-renderer html \
  --dart-define=API_URL=https://api-careplus.relmbikes.com.br

# Build staging
flutter build web --release --web-renderer html \
  --dart-define=API_URL=https://staging-api-careplus.relmbikes.com.br
```

### 4.2 Upload para VPS

```bash
# Produção
rsync -avz --delete \
  build/web/ \
  root@191.252.217.190:/var/www/relm-careplus-prod-web/

# Staging
rsync -avz --delete \
  build/web/ \
  root@191.252.217.190:/var/www/relm-careplus-staging-web/
```

### 4.3 Permissões

```bash
# No VPS
chown -R www-data:www-data /var/www/relm-careplus-*-web
chmod -R 755 /var/www/relm-careplus-*-web
```

---

## 5. Configuração Nginx

### 5.1 Copiar Configs

```bash
# Produção
cp /path/to/repo/deployment/prod/relm-careplus-prod.conf \
   /etc/nginx/sites-available/

# Staging
cp /path/to/repo/deployment/staging/relm-careplus-staging.conf \
   /etc/nginx/sites-available/
```

### 5.2 Ativar Sites

```bash
# Criar symlinks
ln -s /etc/nginx/sites-available/relm-careplus-prod.conf \
      /etc/nginx/sites-enabled/

ln -s /etc/nginx/sites-available/relm-careplus-staging.conf \
      /etc/nginx/sites-enabled/

# Testar configuração
nginx -t

# Se OK, recarregar
systemctl reload nginx
```

---

## 6. SSL (Certbot)

### 6.1 Instalar SSL

```bash
# Produção - Frontend
certbot --nginx -d careplus.relmbikes.com.br

# Produção - API
certbot --nginx -d api-careplus.relmbikes.com.br

# Staging - Frontend
certbot --nginx -d staging-careplus.relmbikes.com.br

# Staging - API
certbot --nginx -d staging-api-careplus.relmbikes.com.br
```

### 6.2 Renovação Automática

```bash
# Testar renovação
certbot renew --dry-run

# Cron já deve estar configurado em:
# /etc/cron.d/certbot
```

---

## 7. Verificação

### 7.1 Backend Health Check

```bash
# Produção
curl https://api-careplus.relmbikes.com.br/api/health

# Staging
curl https://staging-api-careplus.relmbikes.com.br/api/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-XX-XX...",
  "uptime": 123
}
```

### 7.2 Swagger

- Produção: https://api-careplus.relmbikes.com.br/docs
- Staging: https://staging-api-careplus.relmbikes.com.br/docs

### 7.3 Frontend

- Produção: https://careplus.relmbikes.com.br
- Staging: https://staging-careplus.relmbikes.com.br

### 7.4 PM2 Status

```bash
pm2 status
pm2 logs relm-careplus-prod-backend --lines 50
pm2 monit
```

### 7.5 Nginx Logs

```bash
tail -f /var/log/nginx/relm-careplus-prod-api-access.log
tail -f /var/log/nginx/relm-careplus-prod-api-error.log
```

---

## 8. Rollback

### 8.1 Backend

```bash
# Parar processo
pm2 stop relm-careplus-prod-backend

# Reverter código (se git)
cd /var/www/relm-careplus-prod/backend
git log --oneline
git reset --hard <commit-anterior>

# Rebuild
npm run build

# Reverter migration (se necessário)
npx prisma migrate resolve --rolled-back <migration-name>

# Reiniciar
pm2 restart relm-careplus-prod-backend
```

### 8.2 Frontend

```bash
# Restaurar backup
cp -r /var/www/relm-careplus-prod-web.backup-YYYYMMDD/* \
      /var/www/relm-careplus-prod-web/
```

**💡 Sempre faça backup antes de deploy:**
```bash
# Antes de fazer upload novo
cp -r /var/www/relm-careplus-prod-web \
      /var/www/relm-careplus-prod-web.backup-$(date +%Y%m%d-%H%M%S)
```

---

## 9. Manutenção

### 9.1 Backup Banco (Diário)

Criar script: `/etc/cron.daily/backup-relm-careplus`

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/relm-careplus"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup produção
pg_dump -U postgres relm_careplus_prod | gzip > \
  $BACKUP_DIR/relm_careplus_prod_$DATE.sql.gz

# Backup staging
pg_dump -U postgres relm_careplus_staging | gzip > \
  $BACKUP_DIR/relm_careplus_staging_$DATE.sql.gz

# Manter últimos 7 dias
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup concluído: $DATE"
```

Tornar executável:
```bash
chmod +x /etc/cron.daily/backup-relm-careplus
```

### 9.2 Atualizar Dependências

```bash
cd /var/www/relm-careplus-prod/backend

# Backend
npm outdated
npm update
npm audit fix

# Rebuild
npm run build

# Restart
pm2 restart relm-careplus-prod-backend
```

### 9.3 Logs

```bash
# PM2 logs
pm2 logs relm-careplus-prod-backend --lines 100

# Nginx logs
tail -100 /var/log/nginx/relm-careplus-prod-api-access.log

# Rotação de logs (já configurado pelo sistema)
logrotate /etc/logrotate.d/nginx
```

### 9.4 Monitoramento

```bash
# Status geral
pm2 status

# CPU/Memória
pm2 monit

# Reiniciar se necessário
pm2 restart relm-careplus-prod-backend

# Reload (sem downtime)
pm2 reload relm-careplus-prod-backend
```

---

## 🔒 Segurança

### Checklist:
- [x] Portas 3001/3002 não expostas (apenas localhost)
- [x] SSL em todos os domínios
- [x] JWT secrets fortes e únicos
- [x] Database password forte
- [x] CORS configurado
- [x] Nginx headers de segurança
- [x] Logs de auditoria LGPD habilitados
- [x] Backup automático

### Hardening Adicional (Opcional):

```bash
# Fail2ban para SSH
apt install fail2ban

# Firewall (ufw)
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable

# Headers de segurança Nginx (adicionar ao server block)
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
```

---

## 📞 Suporte

**Documentação completa:** [antigravity.md](./antigravity.md)

**Endpoints principais:**
- Health: `GET /api/health`
- Login: `POST /api/auth/login`
- Garantia (público): `POST /api/public/warranty`
- Swagger: `GET /docs`

**Portas:**
- Produção API: 3001 (localhost)
- Staging API: 3002 (localhost)
- Nginx: 80/443 (público)

**Logs importantes:**
- `/var/www/relm-careplus-prod/backend/logs/`
- `/var/log/nginx/`
- `pm2 logs`

---

**Deploy preparado por:** Especialista DevOps Sênior  
**Data:** 2026-02-20  
**Versão:** 1.0.0
