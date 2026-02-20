# 🎯 GUIA RÁPIDO DE DEPLOY — Relm Care+

## ✅ O que foi entregue

### 📦 Backend NestJS Completo
- ✅ 15+ tabelas Prisma (customers, products, warranty, benefits, etc.)
- ✅ 10 módulos funcionais (auth, customers, products, warranty, benefits, insurance, events, newsletter, content, reports)
- ✅ JWT auth (access + refresh tokens)
- ✅ RBAC com 6 perfis
- ✅ FSM para garantia (7 estados)
- ✅ Swagger em `/docs`
- ✅ Seeds com usuários, lojas, produtos, eventos

### 🎨 Frontend Flutter Web (Básico)
- ✅ Home com hero + grid de serviços
- ✅ Telas públicas (garantia, vantagens, eventos, seguro, newsletter)
- ✅ Telas auth (login, admin dashboard - stubs)
- ✅ Services (API + Auth)
- ✅ Paleta teal/verde Relm

### 🔧 Infraestrutura
- ✅ PM2 config (prod port 3001, staging port 3002)
- ✅ Nginx configs separados
- ✅ .env examples
- ✅ Scripts de setup

### 📚 Documentação
- ✅ **antigravity.md** (40KB+ Source of Truth)
- ✅ **README-DEPLOY.md** (Guia completo VPS)
- ✅ **README.md** (Visão geral)

---

## 🚀 Deploy Rápido no VPS

### 1. Conectar ao VPS

```bash
ssh root@191.252.217.190
```

### 2. Clonar Repositório

```bash
cd /var/www
git clone <SEU_REPOSITORIO_GIT> relm-careplus-prod

# Ou copiar via rsync se local:
rsync -avz --exclude node_modules \
  ./relm-careplus/ \
  root@191.252.217.190:/var/www/relm-careplus-prod/
```

### 3. Backend Setup

```bash
cd /var/www/relm-careplus-prod/backend

# Install
npm ci --production=false

# Criar .env.production
cat > .env.production << 'EOF'
NODE_ENV=production
PORT=3001
DATABASE_URL="postgresql://postgres:Brasil@2015@localhost:5432/relm_careplus_prod?schema=public"
JWT_SECRET="$(openssl rand -base64 32)"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="$(openssl rand -base64 32)"
JWT_REFRESH_EXPIRES_IN="7d"
CORS_ORIGIN="https://careplus.relmbikes.com.br"
APP_NAME="Relm Care+"
APP_URL="https://careplus.relmbikes.com.br"
API_URL="https://api-careplus.relmbikes.com.br"
EOF

# Build
npm run build

# Prisma
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

### 4. Criar Banco

```bash
sudo -u postgres psql
CREATE DATABASE relm_careplus_prod;
\q
```

### 5. PM2

```bash
# Copiar config
cp /var/www/relm-careplus-prod/deployment/ecosystem.config.cjs /var/www/

# Iniciar
pm2 start /var/www/ecosystem.config.cjs --only relm-careplus-prod-backend

# Salvar
pm2 save

# Startup
pm2 startup
# (executar comando sugerido)
```

### 6. Nginx

```bash
# Copiar config
cp /var/www/relm-careplus-prod/deployment/prod/relm-careplus-prod.conf \
   /etc/nginx/sites-available/

# Ativar
ln -s /etc/nginx/sites-available/relm-careplus-prod.conf \
      /etc/nginx/sites-enabled/

# Testar
nginx -t

# Reload
systemctl reload nginx
```

### 7. SSL

```bash
certbot --nginx -d careplus.relmbikes.com.br
certbot --nginx -d api-careplus.relmbikes.com.br
```

### 8. Frontend Build & Deploy

**Local (sua máquina):**

```bash
cd frontend
flutter build web --release --web-renderer html \
  --dart-define=API_URL=https://api-careplus.relmbikes.com.br
```

**Upload:**

```bash
rsync -avz --delete \
  build/web/ \
  root@191.252.217.190:/var/www/relm-careplus-prod-web/
```

**VPS:**

```bash
chown -R www-data:www-data /var/www/relm-careplus-prod-web
chmod -R 755 /var/www/relm-careplus-prod-web
```

---

## ✅ Verificação

### Backend

```bash
curl https://api-careplus.relmbikes.com.br/api/health
# Deve retornar: {"status":"ok","database":"connected",...}
```

**Swagger:** https://api-careplus.relmbikes.com.br/docs

### Frontend

**Abrir:** https://careplus.relmbikes.com.br

### PM2

```bash
pm2 status
pm2 logs relm-careplus-prod-backend --lines 50
```

---

## 🔑 Credenciais de Teste

Após seed:

| Email | Senha | Perfil |
|-------|-------|--------|
| admin@relmbikes.com.br | Admin@2024 | ADMIN_RELM |
| gerente@relmbikes.com.br | Gerente@2024 | GERENTE_RELM |
| suporte@relmbikes.com.br | Suporte@2024 | SUPORTE_RELM |

---

## 📂 Estrutura VPS Final

```
/var/www/
├── relm-careplus-prod/
│   ├── backend/            # Código NestJS
│   │   ├── dist/           # Build
│   │   ├── prisma/
│   │   ├── .env.production
│   │   └── logs/
│   └── frontend/           # Código Flutter (source)
├── relm-careplus-prod-web/ # Build Flutter (servido pelo Nginx)
│   ├── index.html
│   ├── main.dart.js
│   └── ...
└── ecosystem.config.cjs    # PM2 config

/etc/nginx/sites-available/
└── relm-careplus-prod.conf
```

---

## 🔧 Comandos Úteis

```bash
# Restart backend
pm2 restart relm-careplus-prod-backend

# Ver logs
pm2 logs relm-careplus-prod-backend

# Reload Nginx
systemctl reload nginx

# Testar Nginx
nginx -t

# Ver status PM2
pm2 status

# Monitorar
pm2 monit
```

---

## 📞 Suporte

- **Documentação completa:** [README-DEPLOY.md](./README-DEPLOY.md)
- **Source of Truth:** [antigravity.md](./antigravity.md)
- **Credenciais VPS:** root@191.252.217.190

---

## 🎯 Próximos Passos (V2)

1. Expandir formulário de garantia (todos os campos)
2. Implementar autenticação completa (login funcional)
3. Dashboard admin com tabelas e FSM
4. Portal cliente autenticado
5. Portal loja e distribuidor
6. Responsividade mobile completa
7. Testes E2E
8. CI/CD pipeline

---

**Status:** ✅ MVP Backend + Frontend Básico Pronto para Deploy  
**Data:** 2026-02-20  
**Versão:** 1.0.0
