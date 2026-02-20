# 🚀 Deploy do Frontend Flutter Web - Relm Care+

## 📋 Pré-requisitos

- Flutter instalado na máquina local
- Acesso SSH ao VPS (root@191.252.217.190)
- Backend rodando na porta 3005

## 🔧 Opção 1: Deploy Automatizado (Recomendado)

### Script automático que faz tudo:

```bash
cd /home/user/webapp
./scripts/build-and-deploy-frontend.sh
```

O script executa:
1. ✅ Verifica instalação do Flutter
2. ✅ Limpa build anterior
3. ✅ Instala dependências
4. ✅ Build Flutter Web (release mode)
5. ✅ Cria tarball
6. ✅ Upload para VPS via SCP
7. ✅ Extrai arquivos no VPS
8. ✅ Ajusta permissões
9. ✅ Limpa arquivos temporários

**Tempo estimado:** 3-5 minutos

---

## 🛠️ Opção 2: Deploy Manual

### Passo 1: Build local

```bash
cd /home/user/webapp/frontend

# Limpar build anterior
flutter clean

# Instalar dependências
flutter pub get

# Build para web (produção)
flutter build web \
  --release \
  --web-renderer html \
  --dart-define=API_URL=http://191.252.217.190:3005 \
  --base-href /
```

### Passo 2: Criar tarball

```bash
cd build/web
tar -czf ~/relm-frontend.tar.gz .
```

### Passo 3: Upload para VPS

```bash
scp ~/relm-frontend.tar.gz root@191.252.217.190:/tmp/
```

### Passo 4: Deploy no VPS

```bash
ssh root@191.252.217.190

# Criar diretório
mkdir -p /var/www/relm-careplus-prod-web

# Backup (opcional)
if [ -d "/var/www/relm-careplus-prod-web" ]; then
    cp -r /var/www/relm-careplus-prod-web /var/www/relm-careplus-prod-web-backup-$(date +%Y%m%d)
fi

# Extrair
cd /var/www/relm-careplus-prod-web
tar -xzf /tmp/relm-frontend.tar.gz

# Permissões
chown -R www-data:www-data /var/www/relm-careplus-prod-web
chmod -R 755 /var/www/relm-careplus-prod-web

# Limpar
rm /tmp/relm-frontend.tar.gz
```

---

## 🌐 Configuração do Nginx

### Arquivo: `/etc/nginx/sites-available/relm-careplus-prod.conf`

Já existe no projeto em: `deployment/prod/relm-careplus-prod.conf`

```bash
# No VPS
cd /var/www/relm-careplus-prod

# Copiar configuração
sudo cp deployment/prod/relm-careplus-prod.conf /etc/nginx/sites-available/

# Criar symlink
sudo ln -s /etc/nginx/sites-available/relm-careplus-prod.conf /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

---

## 🔐 Configuração SSL (Após DNS configurado)

```bash
# Instalar certbot (se não tiver)
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d careplus.relmbikes.com.br -d api-careplus.relmbikes.com.br

# Renovação automática (já configurado)
sudo certbot renew --dry-run
```

---

## 📡 Configuração DNS

Apontar os seguintes registros para `191.252.217.190`:

| Tipo | Nome | Destino | TTL |
|------|------|---------|-----|
| A | careplus | 191.252.217.190 | 3600 |
| A | api-careplus | 191.252.217.190 | 3600 |

**Tempo de propagação:** 5 minutos a 48 horas

---

## ✅ Verificação Pós-Deploy

### 1. Verificar arquivos no VPS

```bash
ssh root@191.252.217.190
ls -lh /var/www/relm-careplus-prod-web
```

Deve conter:
- `index.html`
- `main.dart.js`
- `flutter.js`
- `assets/`
- `canvaskit/`
- Etc.

### 2. Testar acesso local (VPS)

```bash
curl -I http://localhost/
```

### 3. Testar acesso externo

**Temporário (IP):**
```
http://191.252.217.190
```

**Produção (após DNS + SSL):**
```
https://careplus.relmbikes.com.br
```

### 4. Verificar console do navegador

Abra o DevTools (F12) e verifique:
- ✅ Sem erros de JavaScript
- ✅ API respondendo (Network tab)
- ✅ Assets carregando

---

## 🐛 Troubleshooting

### Erro: "Failed to load resource"

**Causa:** API URL incorreta ou CORS

**Solução:**
```bash
# Verificar API_URL no build
grep -r "191.252.217.190:3005" /var/www/relm-careplus-prod-web/

# Verificar CORS no backend
curl -H "Origin: http://191.252.217.190" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS http://191.252.217.190:3005/api/health -v
```

### Erro: "502 Bad Gateway"

**Causa:** Backend não está rodando

**Solução:**
```bash
pm2 status
pm2 logs relm-careplus-prod-backend
```

### Erro: "403 Forbidden"

**Causa:** Permissões incorretas

**Solução:**
```bash
sudo chown -R www-data:www-data /var/www/relm-careplus-prod-web
sudo chmod -R 755 /var/www/relm-careplus-prod-web
```

### Página em branco

**Causa:** `base-href` incorreto ou arquivos corrompidos

**Solução:**
```bash
# Rebuild com base-href correto
flutter build web --release --base-href /

# Verificar index.html
cat /var/www/relm-careplus-prod-web/index.html | grep base
```

---

## 🔄 Atualização do Frontend

Para atualizar após mudanças no código:

```bash
# Executar script de deploy novamente
cd /home/user/webapp
./scripts/build-and-deploy-frontend.sh
```

O script faz backup automático do deploy anterior.

---

## 📊 Estrutura de Diretórios

```
/var/www/
├── relm-careplus-prod/              # Código fonte
│   ├── backend/                     # Backend NestJS
│   ├── frontend/                    # Código Flutter
│   └── deployment/                  # Configs
│
├── relm-careplus-prod-web/          # Frontend buildado (servido pelo Nginx)
│   ├── index.html
│   ├── main.dart.js
│   ├── flutter.js
│   ├── assets/
│   └── canvaskit/
│
└── ecosystem.config.cjs              # PM2 config
```

---

## 🌐 URLs Finais

| Ambiente | Frontend | API | Swagger |
|----------|----------|-----|---------|
| **Produção** | https://careplus.relmbikes.com.br | https://api-careplus.relmbikes.com.br | https://api-careplus.relmbikes.com.br/docs |
| **Temporário** | http://191.252.217.190 | http://191.252.217.190:3005 | http://191.252.217.190:3005/docs |

---

## 📝 Checklist Final

Antes de considerar o deploy completo:

- [ ] Backend rodando (PM2)
- [ ] Database conectado
- [ ] Frontend buildado
- [ ] Arquivos no VPS
- [ ] Nginx configurado
- [ ] DNS apontado
- [ ] SSL configurado
- [ ] Frontend acessível via navegador
- [ ] API respondendo
- [ ] CORS funcionando
- [ ] Formulários funcionando
- [ ] Login funcionando
- [ ] Testes E2E passando

---

## 📞 Suporte

Em caso de problemas:

1. Verificar logs do backend: `pm2 logs relm-careplus-prod-backend`
2. Verificar logs do Nginx: `tail -f /var/log/nginx/error.log`
3. Verificar console do navegador (F12)
4. Consultar documentação: `/home/user/webapp/README.md`

---

**Deploy criado em:** 2026-02-20  
**Versão:** 1.0.0  
**Status:** ✅ Pronto para produção
