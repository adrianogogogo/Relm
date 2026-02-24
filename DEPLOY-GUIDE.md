# 🚀 Guia de Deploy - Novas Features Admin

## ⚠️ IMPORTANTE

Este deploy inclui **mudanças significativas no banco de dados**. Certifique-se de fazer backup antes de prosseguir.

---

## 📦 O Que Foi Implementado

✅ **Eventos** - Sistema completo de gerenciamento de eventos
✅ **Seguros** - Apólices ativas e cotações de seguro
✅ **RELM Club** - Clube de benefícios com categorias

---

## 🔧 Passo a Passo do Deploy

### 1️⃣ Backup do Banco de Dados

```bash
# SSH no servidor
ssh root@177.153.62.248

# Criar backup
cd /var/www/relm-careplus-prod
pg_dump -U seu_usuario -d nome_do_banco > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2️⃣ Atualizar Código

```bash
cd /var/www/relm-careplus-prod
git fetch origin feature/insurance-module
git checkout feature/insurance-module
git pull origin feature/insurance-module
```

### 3️⃣ Backend - Migração do Banco

```bash
cd backend

# Gerar Prisma Client
npx prisma generate

# Criar e aplicar migração
npx prisma migrate deploy

# OU criar migração em dev (desenvolvimento)
npx prisma migrate dev --name add_events_insurance_benefits_features

# Verificar status
npx prisma migrate status
```

### 4️⃣ Backend - Restart

```bash
# Verificar se está rodando
pm2 list

# Restart
pm2 restart relm-backend

# Verificar logs
pm2 logs relm-backend --lines 50

# Teste de saúde
curl http://localhost:3005/api/health
```

### 5️⃣ Frontend - Build e Deploy

```bash
cd ../frontend

# Build
npm run build

# Fazer backup do frontend atual
sudo cp -r /var/www/relm-careplus-prod-web/assets /var/www/relm-careplus-prod-web/assets.backup

# Deploy
sudo rm -rf /var/www/relm-careplus-prod-web/assets
sudo cp -r dist/assets /var/www/relm-careplus-prod-web/
sudo cp dist/index.html /var/www/relm-careplus-prod-web/

# Ajustar permissões
sudo chown -R www-data:www-data /var/www/relm-careplus-prod-web/
sudo chmod -R 755 /var/www/relm-careplus-prod-web/
```

---

## 🧪 Testes Pós-Deploy

### 1. Verificar Backend

```bash
# Health check
curl http://177.153.62.248:3005/api/health

# Verificar novos endpoints
curl -X GET http://177.153.62.248:3005/api/public/events
curl -X GET http://177.153.62.248:3005/api/public/benefits
```

### 2. Verificar Frontend

- Acesse: http://177.153.62.248
- Faça login no admin
- Verifique novos itens no menu:
  - ✅ Eventos
  - ✅ Seguros
  - ✅ RELM Club

### 3. Testar Funcionalidades

**Eventos** (`/admin/events`):
- [ ] Criar novo evento
- [ ] Editar evento
- [ ] Excluir evento
- [ ] Verificar lista de eventos

**Seguros** (`/admin/insurance`):
- [ ] Visualizar dashboard de estatísticas
- [ ] Criar apólice
- [ ] Editar apólice
- [ ] Trocar aba para cotações

**RELM Club** (`/admin/benefits`):
- [ ] Visualizar estatísticas
- [ ] Criar benefício
- [ ] Upload de imagem
- [ ] Marcar como destaque

---

## 🐛 Troubleshooting

### Backend não inicia

```bash
# Verificar erros no log
pm2 logs relm-backend

# Limpar cache do TypeScript
cd backend
rm -rf dist/
npm run build

# Verificar se porta 3005 está livre
lsof -i :3005

# Restart forçado
pm2 delete relm-backend
pm2 start ecosystem.config.js
```

### Erro de migração Prisma

```bash
# Verificar status da migração
npx prisma migrate status

# Forçar reset (CUIDADO: apaga dados)
# npx prisma migrate reset

# Aplicar migração específica
npx prisma migrate resolve --applied "nome_da_migracao"
```

### Frontend não atualiza

```bash
# Limpar cache do navegador
# Ctrl + Shift + R (Chrome/Firefox)

# Verificar se arquivos foram copiados
ls -lh /var/www/relm-careplus-prod-web/assets/

# Verificar permissões
sudo chown -R www-data:www-data /var/www/relm-careplus-prod-web/
sudo chmod -R 755 /var/www/relm-careplus-prod-web/

# Restart do Nginx
sudo systemctl restart nginx
```

### Erro 404 nas novas páginas

```bash
# Verificar se index.html foi atualizado
cat /var/www/relm-careplus-prod-web/index.html | grep -i "script"

# Recopiar index.html
cd /var/www/relm-careplus-prod/frontend
sudo cp dist/index.html /var/www/relm-careplus-prod-web/
```

---

## 📊 Estrutura do Banco de Dados

### Novas Tabelas

1. **events**
   - Gestão de eventos RELM
   
2. **event_registrations**
   - Inscrições de clientes em eventos
   
3. **insurance_policies**
   - Apólices de seguro ativas
   
4. **insurance_quotes** (atualizada)
   - Cotações de seguro (com novos campos)
   
5. **benefits** (atualizada)
   - Benefícios RELM Club (com novos campos)
   
6. **benefit_redemptions**
   - Resgates de benefícios

### Novos Enums

- `InsuranceQuoteStatus`
- `InsurancePolicyStatus`
- `BenefitCategory`

---

## 🔐 Segurança

Todos os novos endpoints admin estão protegidos:
- ✅ JWT Authentication
- ✅ Role-based Access Control (RBAC)
- ✅ Roles permitidas: ADMIN_RELM, GERENTE_RELM, SUPORTE_RELM

---

## 📞 Suporte

**Em caso de problemas**:

1. Verifique os logs:
   ```bash
   pm2 logs relm-backend --lines 100
   ```

2. Verifique saúde do backend:
   ```bash
   curl http://localhost:3005/api/health
   ```

3. Consulte documentação completa:
   - `NEW-ADMIN-FEATURES.md`

---

## ✅ Checklist Final

- [ ] Backup do banco criado
- [ ] Código atualizado do GitHub
- [ ] Migração Prisma executada
- [ ] Backend reiniciado e funcionando
- [ ] Frontend buildado e deployado
- [ ] Health check OK
- [ ] Teste de login admin OK
- [ ] Novos menus visíveis
- [ ] Teste de criar evento OK
- [ ] Teste de criar apólice OK
- [ ] Teste de criar benefício OK

---

## 🎉 Pronto!

Seu sistema RELM Care+ agora tem:
- 🎪 Sistema de Eventos
- 🛡️ Gestão de Seguros e Apólices
- 🎁 RELM Club (Clube de Benefícios)

**Commit**: `8c05228`
**Branch**: `feature/insurance-module`
**Data**: 2026-02-24
