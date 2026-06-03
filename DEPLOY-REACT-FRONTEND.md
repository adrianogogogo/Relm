# 🚀 Deploy Frontend React no VPS - Guia Rápido

## ✅ Pré-requisitos
- Backend rodando na porta 3005
- Node.js instalado no VPS
- Git instalado no VPS

## 📦 Deploy Completo (5 minutos)

Execute esses comandos **NO VPS**:

```bash
# 1. Atualizar código do repositório
cd /var/www/relm-careplus-prod
git pull origin main

# 2. Instalar dependências do frontend
cd frontend
npm install

# 3. Build de produção
npm run build

# 4. Criar diretório web (se não existir)
mkdir -p /var/www/relm-careplus-prod-web

# 5. Backup do deploy anterior (se existir)
if [ -d "/var/www/relm-careplus-prod-web" ] && [ "$(ls -A /var/www/relm-careplus-prod-web)" ]; then
    mv /var/www/relm-careplus-prod-web /var/www/relm-careplus-prod-web-backup-$(date +%Y%m%d-%H%M%S)
    mkdir -p /var/www/relm-careplus-prod-web
fi

# 6. Copiar build para diretório web
cp -r dist/* /var/www/relm-careplus-prod-web/

# 7. Ajustar permissões
chown -R www-data:www-data /var/www/relm-careplus-prod-web
chmod -R 755 /var/www/relm-careplus-prod-web

# 8. Configurar Nginx (se ainda não fez)
cp /var/www/relm-careplus-prod/deployment/prod/relm-careplus-prod.conf /etc/nginx/sites-available/
ln -sf /etc/nginx/sites-available/relm-careplus-prod.conf /etc/nginx/sites-enabled/

# 9. Testar e recarregar Nginx
nginx -t
systemctl reload nginx

echo ""
echo "✅ Deploy concluído!"
echo "🌐 Acesse: http://191.252.217.190"
```

## 🎯 Comando Único (Copy & Paste)

```bash
cd /var/www/relm-careplus-prod && \
git pull origin main && \
cd frontend && \
npm install && \
npm run build && \
mkdir -p /var/www/relm-careplus-prod-web && \
rm -rf /var/www/relm-careplus-prod-web/* && \
cp -r dist/* /var/www/relm-careplus-prod-web/ && \
chown -R www-data:www-data /var/www/relm-careplus-prod-web && \
chmod -R 755 /var/www/relm-careplus-prod-web && \
cp /var/www/relm-careplus-prod/deployment/prod/relm-careplus-prod.conf /etc/nginx/sites-available/ && \
ln -sf /etc/nginx/sites-available/relm-careplus-prod.conf /etc/nginx/sites-enabled/ && \
nginx -t && \
systemctl reload nginx && \
echo "" && \
echo "✅ Deploy concluído!" && \
echo "🌐 Acesse: http://191.252.217.190"
```

## ✅ Verificações

```bash
# Ver arquivos no diretório web
ls -lh /var/www/relm-careplus-prod-web/

# Testar acesso local
curl -I http://localhost/

# Ver logs do Nginx
tail -f /var/log/nginx/relm-careplus-prod-front-access.log
```

## 🌐 URLs de Acesso

- **Frontend**: http://191.252.217.190
- **API**: http://191.252.217.190:3005
- **Swagger**: http://191.252.217.190:3005/docs

## 🔐 Credenciais de Teste

Após acessar o frontend, use:

- **Admin**: admin@relmbikes.com.br / Admin@2024
- **Gerente**: gerente@relmbikes.com.br / Gerente@2024
- **Suporte**: suporte@relmbikes.com.br / Suporte@2024
- **Loja**: loja@bikeshopsp.com.br / Loja@2024

## 📱 Páginas Disponíveis

Após o deploy, você terá acesso a:

- ✅ **Home** (/) - Página inicial com cards de funcionalidades
- ✅ **Garantia** (/garantia) - Formulário público de solicitação
- ✅ **Vantagens** (/vantagens) - Lista de benefícios do clube
- ✅ **Eventos** (/eventos) - Eventos da Relm Bikes
- ✅ **Seguro** (/seguro) - Cotação de seguros (em desenvolvimento)
- ✅ **Newsletter** (/newsletter) - Inscrição na newsletter
- ✅ **Login** (/login) - Autenticação com JWT
- ✅ **Dashboard** (/admin) - Área administrativa (protegida)

## 🎨 Características do Frontend

- ⚡ **Vite** - Build extremamente rápido (~10s)
- 🎨 **Tailwind CSS** - Estilização moderna
- 🔐 **JWT Auth** - Autenticação segura
- 📱 **Responsivo** - Funciona em mobile e desktop
- 🚀 **React 18** - Performance otimizada
- 🔄 **React Query** - Cache automático de dados
- 📦 **Zustand** - Gerenciamento de estado leve
- 🎯 **React Router** - Navegação SPA

## 🔄 Atualizações Futuras

Para atualizar o frontend após mudanças:

```bash
cd /var/www/relm-careplus-prod
git pull origin main
cd frontend
npm run build
rm -rf /var/www/relm-careplus-prod-web/*
cp -r dist/* /var/www/relm-careplus-prod-web/
chown -R www-data:www-data /var/www/relm-careplus-prod-web
systemctl reload nginx
```

## 🐛 Troubleshooting

### Erro: "Cannot find module"
```bash
cd /var/www/relm-careplus-prod/frontend
rm -rf node_modules package-lock.json
npm install
```

### Erro: "EACCES: permission denied"
```bash
sudo chown -R $USER:$USER /var/www/relm-careplus-prod/frontend
```

### Frontend não carrega (página em branco)
```bash
# Verificar se os arquivos foram copiados
ls -lh /var/www/relm-careplus-prod-web/

# Verificar logs do Nginx
tail -f /var/log/nginx/relm-careplus-prod-front-error.log

# Verificar permissões
sudo chown -R www-data:www-data /var/www/relm-careplus-prod-web
```

### API não responde
```bash
# Verificar se backend está rodando
pm2 status

# Ver logs do backend
pm2 logs relm-careplus-prod-backend

# Reiniciar backend
pm2 restart relm-careplus-prod-backend
```

## 📊 Comparação Flutter vs React

| Aspecto | Flutter Web | React + Vite |
|---------|-------------|--------------|
| **Build Time** | ~5-10 min | ~10-20 seg |
| **Tamanho** | ~15-20 MB | ~500 KB |
| **Complexidade** | Alta | Baixa |
| **Deps no VPS** | Flutter SDK (~600MB) | Node.js (já instalado) |
| **Hot Reload** | Sim | Sim |
| **SEO** | Ruim | Bom |
| **Performance** | Boa | Excelente |

## 🎉 Status Final

Após executar o deploy, você terá:

✅ Frontend React rodando em http://191.252.217.190  
✅ API backend rodando em http://191.252.217.190:3005  
✅ Todas as páginas funcionais  
✅ Autenticação JWT funcionando  
✅ Integração com API completa  
✅ UI moderna e responsiva  

**Tempo total: ~5 minutos** 🚀

---

**Pronto para começar?** Execute o comando único acima e me avise quando terminar! 🎯
