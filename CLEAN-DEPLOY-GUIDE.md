# 🚀 DEPLOY LIMPO - Eventos, Seguros e RELM Club

## ✅ O QUE FOI FEITO

1. **SQL Direto**: Script que adiciona apenas as NOVAS tabelas sem modificar existentes
2. **Prisma Schema**: Adicionados apenas os novos modelos ao final
3. **Sem Conflitos**: Nenhuma tabela existente será modificada

## 📋 INSTRUÇÕES PARA O SERVIDOR

### 1️⃣ Criar as Novas Tabelas no Banco

```bash
cd /var/www/relm-careplus-prod
git pull origin feature/admin-events-insurance-benefits-clean

# Executar SQL diretamente no PostgreSQL
sudo -u postgres psql relm_careplus_prod < backend/add-new-features.sql
```

### 2️⃣ Atualizar o Prisma Client

```bash
cd backend

# Gerar novo Prisma Client (agora com os novos modelos)
npx prisma generate

# Reiniciar backend
pm2 restart relm-backend
sleep 3

# Verificar
curl http://localhost:3005/api/health
```

### 3️⃣ Verificar Backend

```bash
pm2 logs relm-backend --lines 30
```

Você deve ver:
```
✅ Nest application successfully started
✅ Application is running on: http://localhost:3005
```

## 📊 NOVAS TABELAS CRIADAS

1. **events** - Eventos da Relm
2. **event_registrations** - Inscrições em eventos
3. **insurance_policies** - Apólices de seguro ativas
4. **benefits** - Benefícios do RELM Club  
5. **benefit_redemptions** - Resgates de benefícios

## ⚠️ POR QUE ESTE MÉTODO É SEGURO

✅ **SQL Direto**: Cria tabelas SEM tocar nas existentes  
✅ **IF NOT EXISTS**: Se a tabela já existe, não faz nada  
✅ **Sem Migrations**: Não usa sistema de migrations que pode conflitar  
✅ **Rollback Fácil**: Se der problema, basta dropar as novas tabelas

## 🔄 SE DER ERRO

```bash
# Ver o erro
pm2 logs relm-backend --err --lines 50

# Rollback: remover as novas tabelas
sudo -u postgres psql relm_careplus_prod <<'SQL'
DROP TABLE IF EXISTS benefit_redemptions CASCADE;
DROP TABLE IF EXISTS benefits CASCADE;
DROP TABLE IF EXISTS insurance_policies CASCADE;
DROP TABLE IF EXISTS event_registrations CASCADE;
DROP TABLE IF EXISTS events CASCADE;
SQL

# Voltar para main
cd /var/www/relm-careplus-prod
git checkout main
cd backend
npx prisma generate
pm2 restart relm-backend
```

## 🎯 PRÓXIMOS PASSOS APÓS SUCESSO

1. ✅ Backend funcionando com novos modelos
2. ⏭️ Criar os módulos NestJS (Controllers, Services, DTOs)
3. ⏭️ Criar as páginas React no frontend
4. ⏭️ Deploy final

---

**Aguardando execução no servidor!** 🚀
