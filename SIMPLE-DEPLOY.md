# 🚀 DEPLOY SIMPLES - Apólices de Seguro

## ✅ O QUE VAI SER FEITO

Adicionar **APENAS** a tabela `insurance_policies` ao banco de dados.

As tabelas `events` e `benefits` **JÁ EXISTEM** e estão funcionando.

---

## 📋 PASSO A PASSO NO SERVIDOR

### 1️⃣ Criar a Tabela de Apólices

```bash
cd /var/www/relm-careplus-prod
git fetch --all
git checkout feature/admin-pages-only
git pull origin feature/admin-pages-only

# Criar a tabela insurance_policies
sudo -u postgres psql relm_careplus_prod < backend/add-insurance-policies.sql
```

### 2️⃣ Atualizar Prisma Client

```bash
cd backend

# Regenerar Prisma Client (agora com InsurancePolicy)
npx prisma generate

# Reiniciar backend
pm2 restart relm-backend
sleep 3

# Verificar
curl http://localhost:3005/api/health
```

---

## ✅ O QUE FOI ADICIONADO

1. **Nova Tabela**: `insurance_policies`
2. **Novo Modelo Prisma**: `InsurancePolicy`
3. **Campos**:
   - `policy_number` (único)
   - `customer_id`, `product_id`
   - `insurance_company`
   - `policy_value`, `coverage_amount`
   - `start_date`, `end_date`
   - `status` (ACTIVE, SUSPENDED, CANCELLED, EXPIRED)
   - `monthly_payment`, `payment_day`
   - `notes`

---

## 🔄 SE DER ERRO

```bash
# Remover a tabela
sudo -u postgres psql relm_careplus_prod -c "DROP TABLE IF EXISTS insurance_policies CASCADE;"

# Voltar para main
cd /var/www/relm-careplus-prod
git checkout main
cd backend
npx prisma generate
pm2 restart relm-backend
```

---

## 🎯 PRÓXIMOS PASSOS

Após a tabela ser criada com sucesso:

1. ✅ Criar módulo NestJS para Insurance Policies
2. ✅ Criar controllers e services
3. ✅ Criar páginas admin no frontend
4. ✅ Deploy final

---

**Aguardando execução no servidor!** 🚀
