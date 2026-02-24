# 🎨 Sistema de Upload de Banners - Documentação

**Data:** 2026-02-24  
**Versão:** 2.0  
**Feature:** Upload de Imagens pela Interface Admin

---

## 🎯 **O Que Foi Implementado**

### ✅ **Backend**

#### **1. BannerUploadController** (`backend/src/banners/banner-upload.controller.ts`)
- **Endpoint:** `POST /api/banners/upload`
- **Autenticação:** JWT + Roles (ADMIN_RELM, GERENTE_RELM)
- **Funcionalidades:**
  - Upload de imagens (JPG, PNG, GIF, WebP)
  - Validação de tipo e tamanho (máx. 5MB)
  - Geração automática de nomes únicos com timestamp
  - Armazenamento em `/var/www/relm-careplus-prod-web/uploads/banners/`
  - Retorna URL relativa da imagem

#### **2. Atualização do BannersModule**
- Registro do novo controller
- Integração com Multer (@nestjs/platform-express)

---

### ✅ **Frontend**

#### **BannersPage.jsx Melhorado**
- **Interface de Upload:**
  - Botão de upload com área de drag-and-drop
  - Preview da imagem antes de salvar
  - Barra de progresso durante upload
  - Validação client-side (tipo e tamanho)
  - Opção de URL manual (fallback)
  
- **Funcionalidades Novas:**
  - Upload direto de arquivos
  - Preview em tempo real
  - Remoção de imagem selecionada
  - Feedback visual de upload
  - Tratamento de erros amigável

---

## 📸 **Como Usar**

### **1. Criar Novo Banner com Upload**

1. Acesse: http://177.153.62.248/admin/banners
2. Clique em **"Novo Banner"**
3. **Upload da Imagem:**
   - Clique na área de upload
   - Selecione uma imagem (JPG, PNG, GIF ou WebP)
   - Aguarde o upload (aparecerá um spinner)
   - A imagem será previewed automaticamente
4. Preencha os outros campos:
   - **Título*** (obrigatório)
   - **Subtítulo** (opcional)
   - **URL do Link** (opcional)
   - **Texto do Botão** (opcional)
   - **Ordem** (número)
   - **Ativo** (checkbox)
5. Clique em **"Criar Banner"**

### **2. Editar Banner e Trocar Imagem**

1. Na lista de banners, clique em **✏️ Editar**
2. **Para trocar a imagem:**
   - Clique no **X** vermelho sobre a imagem atual
   - Faça upload de uma nova imagem
   - Aguarde o upload completar
3. Modifique outros campos se necessário
4. Clique em **"Atualizar Banner"**

### **3. Validações Automáticas**

**O sistema valida:**
- ✅ Tipo de arquivo (apenas imagens)
- ✅ Tamanho máximo (5MB)
- ✅ Campos obrigatórios (título, imagem)
- ✅ Autenticação e permissões

**Mensagens de Erro:**
- ❌ "Por favor, selecione uma imagem válida (JPG, PNG, GIF ou WebP)"
- ❌ "A imagem deve ter no máximo 5MB"
- ❌ "Título e imagem são obrigatórios"
- ❌ "Erro ao fazer upload da imagem. Tente novamente."

---

## 🔧 **Especificações Técnicas**

### **Endpoint de Upload**

**URL:** `POST /api/banners/upload`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body (FormData):**
```
file: [arquivo de imagem]
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "imageUrl": "/uploads/banners/banner-1708789234-abc123.png",
  "filename": "banner-1708789234-abc123.png",
  "size": 245678,
  "mimetype": "image/png"
}
```

**Erros:**
- **400** - Arquivo inválido ou muito grande
- **401** - Não autenticado
- **403** - Sem permissão

### **Formato de Nome dos Arquivos**

```
banner-{timestamp}-{random}.{ext}

Exemplo:
banner-1708789234-abc123.png
```

**Componentes:**
- `banner-` - Prefixo fixo
- `1708789234` - Timestamp Unix (milissegundos)
- `abc123` - String aleatória (6 caracteres)
- `.png` - Extensão original

### **Diretório de Armazenamento**

```
/var/www/relm-careplus-prod-web/uploads/banners/
```

**Permissões necessárias:**
- Dono: `www-data:www-data`
- Permissões: `755` (diretório), `644` (arquivos)

### **Tipos de Arquivo Suportados**

| Tipo | MIME Type | Extensão |
|------|-----------|----------|
| JPEG | image/jpeg | .jpg, .jpeg |
| PNG | image/png | .png |
| GIF | image/gif | .gif |
| WebP | image/webp | .webp |

### **Limites**

- **Tamanho máximo:** 5MB (5.242.880 bytes)
- **Dimensões recomendadas:** 1920x600px (16:9)
- **Compressão:** Recomendado otimizar antes do upload

---

## 🚀 **Deploy**

### **1. Instalar Dependências do Backend**

O pacote `@nestjs/platform-express` já está instalado e inclui Multer.

Se necessário:
```bash
cd /var/www/relm-careplus-prod/backend
npm install
```

### **2. Criar Diretório de Upload**

```bash
# SSH no servidor
ssh root@177.153.62.248

# Criar diretório
sudo mkdir -p /var/www/relm-careplus-prod-web/uploads/banners/

# Ajustar permissões
sudo chown -R www-data:www-data /var/www/relm-careplus-prod-web/uploads/
sudo chmod -R 755 /var/www/relm-careplus-prod-web/uploads/
```

### **3. Deploy Completo**

```bash
# No servidor
cd /var/www/relm-careplus-prod

# Pull das atualizações
git pull origin feature/insurance-module

# Backend - Gerar Prisma e Restart
cd backend
npx prisma generate
pm2 restart relm-backend

# Frontend - Build e Deploy
cd ../frontend
npm run build
sudo rm -rf /var/www/relm-careplus-prod-web/assets
sudo cp -r dist/assets /var/www/relm-careplus-prod-web/
sudo cp dist/index.html /var/www/relm-careplus-prod-web/
sudo chown -R www-data:www-data /var/www/relm-careplus-prod-web/
sudo chmod -R 755 /var/www/relm-careplus-prod-web/

# Teste
curl http://localhost:3005/api/health
```

---

## 🧪 **Testes**

### **1. Testar Upload via Curl**

```bash
# Obter token
TOKEN="seu_token_aqui"

# Upload de teste
curl -X POST http://localhost:3005/api/banners/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/caminho/para/imagem.png"
```

### **2. Testar na Interface**

1. Login: http://177.153.62.248/login
2. Banners: http://177.153.62.248/admin/banners
3. Clique em "Novo Banner"
4. Faça upload de uma imagem de teste
5. Verifique se o preview aparece
6. Salve e verifique na homepage

### **3. Verificar Arquivo no Servidor**

```bash
# Listar uploads
ls -lh /var/www/relm-careplus-prod-web/uploads/banners/

# Ver última imagem
ls -lt /var/www/relm-careplus-prod-web/uploads/banners/ | head -n 2

# Verificar permissões
stat /var/www/relm-careplus-prod-web/uploads/banners/banner-*.png
```

---

## 🆘 **Troubleshooting**

### **Erro: "Erro ao fazer upload da imagem"**

**Possíveis causas:**
1. **Permissões incorretas:**
   ```bash
   sudo chown -R www-data:www-data /var/www/relm-careplus-prod-web/uploads/
   sudo chmod -R 755 /var/www/relm-careplus-prod-web/uploads/
   ```

2. **Diretório não existe:**
   ```bash
   sudo mkdir -p /var/www/relm-careplus-prod-web/uploads/banners/
   ```

3. **Backend não reiniciado:**
   ```bash
   pm2 restart relm-backend
   pm2 logs relm-backend
   ```

### **Erro: "Cannot find module 'multer'"**

```bash
cd /var/www/relm-careplus-prod/backend
npm install
pm2 restart relm-backend
```

### **Erro: 401 Unauthorized**

- Verifique se está logado
- Token pode ter expirado
- Faça logout e login novamente

### **Erro: 403 Forbidden**

- Usuário não tem permissão (não é ADMIN_RELM ou GERENTE_RELM)
- Verificar role no banco de dados

### **Imagem não aparece após upload**

1. **Verificar se foi salva:**
   ```bash
   ls -lh /var/www/relm-careplus-prod-web/uploads/banners/
   ```

2. **Testar URL diretamente:**
   ```
   http://177.153.62.248/uploads/banners/banner-{timestamp}-{random}.png
   ```

3. **Verificar Nginx:**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

---

## 📊 **Melhorias Futuras**

### **Curto Prazo**
- [ ] Drag-and-drop de arquivos
- [ ] Crop/resize de imagens
- [ ] Múltiplos uploads simultâneos
- [ ] Gerenciamento de mídia (galeria de imagens)

### **Médio Prazo**
- [ ] CDN para imagens
- [ ] Compressão automática de imagens
- [ ] Versionamento de imagens
- [ ] Backup automático de uploads

### **Longo Prazo**
- [ ] Integração com serviços de imagem (Cloudinary, ImageKit)
- [ ] AI para otimização automática
- [ ] Suporte a vídeos
- [ ] Editor de imagens integrado

---

## 📁 **Arquivos Modificados/Criados**

### **Backend**
```
backend/src/banners/
├── banner-upload.controller.ts  ✨ NOVO - Controller de upload
├── upload-banner.dto.ts         ✨ NOVO - DTO para upload
├── banners.module.ts            🔄 Atualizado - Registra novo controller
├── banners.controller.ts        (sem alteração)
├── banners.service.ts           (sem alteração)
└── dto/
    ├── create-banner.dto.ts
    └── update-banner.dto.ts
```

### **Frontend**
```
frontend/src/pages/
└── BannersPage.jsx              🔄 Refatorado - Interface com upload
```

---

## 📞 **Suporte**

- **GitHub:** https://github.com/adrianogogogo/Relm
- **Branch:** feature/insurance-module
- **Documentação:** Ver BANNER-SYSTEM.md e LAYOUT-STRUCTURE-FIX.md

---

**🎉 Sistema de Upload de Banners Pronto para Uso!**
