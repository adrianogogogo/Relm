# 🚀 DEPLOY DOS NOVOS MÓDULOS BACKEND

## ✅ O QUE FOI ADICIONADO

### 1. **Módulo Events (Admin)**
- ✅ Controller: `/api/admin/events`
- ✅ CRUD completo: Create, Read, Update, Delete
- ✅ Estatísticas: Total eventos, ativos, próximos, inscrições
- ✅ Listagem de inscrições por evento
- ✅ Filtros: active, upcoming
- ✅ Guards: JWT + RBAC (ADMIN_RELM, GERENTE_RELM, SUPORTE_RELM)

### 2. **Módulo Insurance Policies (Admin)**
- ✅ Controller: `/api/admin/insurance-policies`
- ✅ CRUD completo para apólices
- ✅ Estatísticas: Total, ativas, expirando em 30 dias, por status
- ✅ Filtros: status, customerId, active
- ✅ Guards: JWT + RBAC

### 3. **Módulo Benefits (Admin)**
- ✅ Controller: `/api/admin/benefits`
- ✅ CRUD completo para benefícios
- ✅ Estatísticas: Total, ativos, resgates
- ✅ Filtros: active, targetRole
- ✅ Guards: JWT + RBAC

---

## 📋 DEPLOY NO SERVIDOR

### Passo 1: Baixar atualizações

```bash
cd /var/www/relm-careplus-prod
git fetch --all
git checkout feature/admin-pages-only
git pull origin feature/admin-pages-only
```

### Passo 2: Instalar dependências (se necessário)

```bash
cd backend
npm install
```

### Passo 3: Regenerar Prisma Client

```bash
npx prisma generate
```

### Passo 4: Reiniciar Backend

```bash
pm2 restart relm-backend
sleep 5
```

### Passo 5: Verificar

```bash
# Health check
curl http://localhost:3005/api/health

# Ver logs
pm2 logs relm-backend --lines 30 --nostream

# Verificar rotas disponíveis (opcional)
curl http://localhost:3005/api/docs
```

---

## 🎯 ENDPOINTS DISPONÍVEIS

### **Events Admin**
- `POST /api/admin/events` - Criar evento
- `GET /api/admin/events` - Listar eventos
- `GET /api/admin/events/statistics` - Estatísticas
- `GET /api/admin/events/:id` - Detalhes do evento
- `GET /api/admin/events/:id/registrations` - Inscrições
- `PATCH /api/admin/events/:id` - Atualizar evento
- `DELETE /api/admin/events/:id` - Deletar evento

### **Insurance Policies Admin**
- `POST /api/admin/insurance-policies` - Criar apólice
- `GET /api/admin/insurance-policies` - Listar apólices
- `GET /api/admin/insurance-policies/statistics` - Estatísticas
- `GET /api/admin/insurance-policies/:id` - Detalhes
- `PATCH /api/admin/insurance-policies/:id` - Atualizar
- `DELETE /api/admin/insurance-policies/:id` - Deletar

### **Benefits Admin**
- `POST /api/admin/benefits` - Criar benefício
- `GET /api/admin/benefits` - Listar benefícios
- `GET /api/admin/benefits/statistics` - Estatísticas
- `GET /api/admin/benefits/:id` - Detalhes
- `PATCH /api/admin/benefits/:id` - Atualizar
- `DELETE /api/admin/benefits/:id` - Deletar

---

## ✅ VERIFICAÇÕES PÓS-DEPLOY

Execute estes comandos para verificar:

```bash
# 1. Verificar se backend está rodando
pm2 list

# 2. Health check
curl http://localhost:3005/api/health

# 3. Testar endpoint de estatísticas (exemplo)
curl -H "Authorization: Bearer SEU_TOKEN" \
  http://localhost:3005/api/admin/events/statistics

# 4. Ver logs em tempo real (Ctrl+C para sair)
pm2 logs relm-backend
```

---

## 🔴 SE DER ERRO

### Erro 1: Backend não sobe

```bash
# Ver erros
pm2 logs relm-backend --err --lines 50

# Possíveis causas:
# - Falta dependências: npm install
# - Prisma desatualizado: npx prisma generate
# - Guards faltando: verificar se jwt-auth.guard.ts existe
```

### Erro 2: TypeScript compilation error

```bash
# Limpar e reinstalar
cd /var/www/relm-careplus-prod/backend
rm -rf dist node_modules/.cache
npm run build

# Se funcionar, reiniciar
pm2 restart relm-backend
```

### Erro 3: Rollback para main

```bash
cd /var/www/relm-careplus-prod
git checkout main
cd backend
npx prisma generate
pm2 restart relm-backend
```

---

## 📊 CÓDIGO ADICIONADO

- **5 arquivos** no módulo Events
- **5 arquivos** no módulo Insurance Policies  
- **5 arquivos** no módulo Benefits
- **1 arquivo** atualizado: app.module.ts

**Total**: 16 arquivos, ~730 linhas de código

---

**🚀 Pronto para deploy!**
