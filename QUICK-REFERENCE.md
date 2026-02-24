# 🚀 RELM Care+ - Referência Rápida

## 📦 Arquivos Principais da Solução

### 🎨 Componentes React (frontend/src/components/)
```
AdminLayout.jsx       - Sidebar azul, logo, menu admin
PublicLayout.jsx      - Header + Footer para páginas públicas  
Header.jsx            - Header com logo /logo-relm.png
BannerCarousel.jsx    - Carrossel da homepage
```

### 📄 Páginas (frontend/src/pages/)
```
HomePage.jsx          - Homepage com carrossel
AdminDashboard.jsx    - Dashboard admin
BannersPage.jsx       - CRUD de banners
```

### ⚙️ Configuração
```
frontend/src/App.jsx  - Rotas com PublicLayout e AdminLayout
```

### 🛠️ Scripts
```
verify-structure.sh           - Verifica integridade do projeto
deploy-complete-structure.sh  - Deploy automatizado
```

### 📚 Documentação
```
DEPLOY-READY-SUMMARY.md      - Resumo executivo e guia rápido
LAYOUT-STRUCTURE-FIX.md      - Documentação técnica completa
BANNER-SYSTEM.md             - Sistema de banners
```

---

## 🚀 Comandos Essenciais

### Deploy Completo (no servidor)
```bash
cd /var/www/relm-careplus-prod
./deploy-complete-structure.sh
```

### Verificar Estrutura
```bash
cd /var/www/relm-careplus-prod
./verify-structure.sh
```

### Upload do Logo (do Windows)
```powershell
scp C:\Temp\logo-relm.png root@177.153.62.248:/tmp/
```

### Manual - Backend
```bash
cd /var/www/relm-careplus-prod/backend
npx prisma generate
pm2 restart relm-backend
pm2 list
pm2 logs relm-backend --lines 30
```

### Manual - Frontend
```bash
cd /var/www/relm-careplus-prod/frontend
npm run build
sudo rm -rf /var/www/relm-careplus-prod-web/assets
sudo cp -r dist/assets /var/www/relm-careplus-prod-web/
sudo cp dist/index.html /var/www/relm-careplus-prod-web/
sudo chown -R www-data:www-data /var/www/relm-careplus-prod-web/
sudo chmod -R 755 /var/www/relm-careplus-prod-web/
```

---

## 🔗 URLs Importantes

| Descrição | URL |
|-----------|-----|
| 🏠 Homepage | http://177.153.62.248 |
| 🔐 Login | http://177.153.62.248/login |
| 📊 Admin Dashboard | http://177.153.62.248/admin |
| 🎨 Banners Admin | http://177.153.62.248/admin/banners |
| 🏥 Health API | http://177.153.62.248:3005/api/health |
| 📊 Banners API | http://177.153.62.248:3005/api/public/banners |
| 📖 Docs API | http://177.153.62.248:3005/docs |

---

## 📋 Checklist Rápido Pós-Deploy

- [ ] Logo aparece no header
- [ ] Carrossel funciona
- [ ] Login funciona
- [ ] Admin tem sidebar azul
- [ ] Menu "Banners" aparece
- [ ] `/admin/banners` abre corretamente

---

## 🆘 Troubleshooting Rápido

### Logo não aparece?
```bash
sudo cp /tmp/logo-relm.png /var/www/relm-careplus-prod-web/logo-relm.png
sudo chown www-data:www-data /var/www/relm-careplus-prod-web/logo-relm.png
sudo chmod 644 /var/www/relm-careplus-prod-web/logo-relm.png
```

### Backend não responde?
```bash
pm2 restart relm-backend
pm2 logs relm-backend
curl http://localhost:3005/api/health
```

### Frontend não atualiza?
```bash
# Hard refresh no navegador
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

---

## 📞 Suporte

- **GitHub:** https://github.com/adrianogogogo/Relm
- **Branch:** feature/insurance-module
- **Docs:** Ver DEPLOY-READY-SUMMARY.md e LAYOUT-STRUCTURE-FIX.md
