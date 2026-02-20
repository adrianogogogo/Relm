# 🚀 GUIA DE DEPLOY RELM CARE+ - ATUALIZADO

## ✅ Código já está no GitHub!

**Repositório:** https://github.com/adrianogogogo/Relm

---

## 📋 COMANDOS PARA COPIAR E COLAR NO VPS

### 1️⃣ Corrigir Bancos de Dados (se ainda não fez)

```bash
sudo -u postgres psql
```

Dentro do PostgreSQL, execute (SEM os comentários #):

```sql
CREATE DATABASE relm_careplus_prod;
CREATE USER relm_careplus WITH PASSWORD 'SenhaForte123!';
GRANT ALL PRIVILEGES ON DATABASE relm_careplus_prod TO relm_careplus;
GRANT ALL PRIVILEGES ON DATABASE relm_careplus_staging TO relm_careplus;
\q
```

---

### 2️⃣ Clonar Repositório

```bash
# Limpar diretório se existir
cd /var/www
rm -rf relm-careplus-prod/backend/*
rm -rf relm-careplus-prod/frontend/*

# Clonar do GitHub
cd /var/www/relm-careplus-prod
git clone https://github.com/adrianogogogo/Relm.git temp
mv temp/* ./
mv temp/.* ./ 2>/dev/null || true
rm -rf temp

# Verificar
ls -la
```

---

### 3️⃣ Setup Backend

```bash
cd /var/www/relm-careplus-prod/backend

# Instalar dependências
npm install

# Criar .env.production
cat > .env.production << 'EOFENV'
NODE_ENV=production
PORT=3001
DATABASE_URL="postgresql://relm_careplus:SenhaForte123!@localhost:5432/relm_careplus_prod?schema=public"
JWT_SECRET="$(openssl rand -base64 32 | tr -d '\n')"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="$(openssl rand -base64 32 | tr -d '\n')"
JWT_REFRESH_EXPIRES_IN="7d"
CORS_ORIGIN="https://careplus.relmbikes.com.br"
APP_NAME="Relm Care+"
APP_URL="https://careplus.relmbikes.com.br"
API_URL="https://api-careplus.relmbikes.com.br"
EOFENV

# Build
npm run build

# Prisma
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

---

### 4️⃣ PM2

```bash
# Copiar config PM2
cp /var/www/relm-careplus-prod/deployment/ecosystem.config.cjs /var/www/

# Iniciar
pm2 start /var/www/ecosystem.config.cjs --only relm-careplus-prod-backend

# Verificar
pm2 status

# Salvar
pm2 save

# Configurar startup (executar o comando que aparecer)
pm2 startup
```

---

### 5️⃣ Nginx

```bash
# Copiar configuração
cp /var/www/relm-careplus-prod/deployment/prod/relm-careplus-prod.conf \
   /etc/nginx/sites-available/

# Ativar site
ln -s /etc/nginx/sites-available/relm-careplus-prod.conf \
      /etc/nginx/sites-enabled/

# Testar configuração
nginx -t

# Se OK, recarregar
systemctl reload nginx
```

---

### 6️⃣ SSL (Certbot)

```bash
# Certificados SSL
certbot --nginx -d careplus.relmbikes.com.br
certbot --nginx -d api-careplus.relmbikes.com.br
```

---

### 7️⃣ Verificar API

```bash
# Health check
curl https://api-careplus.relmbikes.com.br/api/health

# Deve retornar:
# {"status":"ok","database":"connected",...}
```

**Swagger:** https://api-careplus.relmbikes.com.br/docs

---

### 8️⃣ Frontend (Build Local)

**No seu computador local** (NÃO no VPS):

```bash
# Clonar repositório
git clone https://github.com/adrianogogogo/Relm.git
cd Relm/frontend

# Instalar Flutter dependencies
flutter pub get

# Build para produção
flutter build web --release --web-renderer html \
  --dart-define=API_URL=https://api-careplus.relmbikes.com.br

# Upload para VPS
rsync -avz --delete \
  build/web/ \
  root@191.252.217.190:/var/www/relm-careplus-prod-web/
```

**No VPS, ajustar permissões:**

```bash
chown -R www-data:www-data /var/www/relm-careplus-prod-web
chmod -R 755 /var/www/relm-careplus-prod-web
```

---

## ✅ Verificação Final

### Backend
```bash
# Status PM2
pm2 status

# Logs
pm2 logs relm-careplus-prod-backend --lines 50

# Health
curl https://api-careplus.relmbikes.com.br/api/health
```

### Frontend
**Abrir no navegador:** https://careplus.relmbikes.com.br

---

## 🔑 Credenciais de Teste

Após o seed:

| Email | Senha | Perfil |
|-------|-------|--------|
| admin@relmbikes.com.br | Admin@2024 | ADMIN_RELM |
| gerente@relmbikes.com.br | Gerente@2024 | GERENTE_RELM |
| suporte@relmbikes.com.br | Suporte@2024 | SUPORTE_RELM |

**Login:** https://careplus.relmbikes.com.br/login  
**Swagger:** https://api-careplus.relmbikes.com.br/docs

---

## 🔧 Troubleshooting

### Erro: "Cannot find module"
```bash
cd /var/www/relm-careplus-prod/backend
rm -rf node_modules package-lock.json
npm install
npm run build
pm2 restart relm-careplus-prod-backend
```

### Erro: Prisma
```bash
cd /var/www/relm-careplus-prod/backend
npx prisma generate
npx prisma migrate deploy
pm2 restart relm-careplus-prod-backend
```

### Erro: PM2 não inicia
```bash
pm2 logs relm-careplus-prod-backend --lines 100
# Verificar o erro e corrigir
```

### Erro: Nginx 502
```bash
# Verificar se PM2 está rodando
pm2 status

# Verificar porta
netstat -tulpn | grep 3001

# Ver logs Nginx
tail -f /var/log/nginx/relm-careplus-prod-api-error.log
```

---

## 📞 Links Importantes

- **Repositório:** https://github.com/adrianogogogo/Relm
- **Frontend (prod):** https://careplus.relmbikes.com.br
- **API (prod):** https://api-careplus.relmbikes.com.br
- **Swagger:** https://api-careplus.relmbikes.com.br/docs
- **VPS:** root@191.252.217.190

---

## 🎯 Próximos Passos

1. ✅ Deploy backend (siga os passos acima)
2. ✅ Testar API via Swagger
3. ✅ Deploy frontend
4. ✅ Testar login com credenciais de teste
5. 🔄 Expandir funcionalidades (V2)

---

**Status:** 🚀 Código no GitHub, pronto para deploy!  
**Repositório:** https://github.com/adrianogogogo/Relm  
**Data:** 2026-02-20
