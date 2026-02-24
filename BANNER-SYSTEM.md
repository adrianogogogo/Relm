# RELM Care+ Banner Management System

**Created**: 2024-02-24  
**Status**: ✅ Implemented  
**Commit**: 7c81426

---

## 📋 Visão Geral

Sistema completo de gerenciamento de banners para o site RELM Care+, permitindo que administradores criem, editem, reordenem e controlem a exibição de banners carrossel na página inicial.

---

## 🗄️ Banco de Dados

### Tabela `banners`

```sql
CREATE TABLE IF NOT EXISTS banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    image_url VARCHAR(500) NOT NULL,
    link_url VARCHAR(500),
    link_text VARCHAR(100),
    display_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(active);
CREATE INDEX IF NOT EXISTS idx_banners_order ON banners(display_order);
```

### Modelo Prisma

```prisma
model Banner {
  id           String   @id @default(uuid())
  title        String
  subtitle     String?
  imageUrl     String   @map("image_url")
  linkUrl      String?  @map("link_url")
  linkText     String?  @map("link_text")
  displayOrder Int      @default(0) @map("display_order")
  active       Boolean  @default(true)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @default(now()) @updatedAt @map("updated_at")

  @@index([active])
  @@index([displayOrder])
  @@map("banners")
}
```

### Dados Iniciais

```sql
INSERT INTO banners (title, subtitle, image_url, link_url, link_text, display_order, active)
VALUES
('SERVIÇOS & BIKES','Todos os serviços para sua bike','/uploads/banners/banner1.png','/garantia','Solicitar Garantia',1,true),
('RELM CARE+','Garantia e Proteção Total','/uploads/banners/banner2.png','/vantagens','Ver Vantagens',2,true),
('CYCLE FOREVER','Se inscreva relmbikes.com.br','/uploads/banners/banner3.png','https://relmbikes.com.br','Saiba Mais',3,true);
```

---

## 🔧 Backend (NestJS)

### Estrutura de Arquivos

```
backend/src/banners/
├── dto/
│   ├── create-banner.dto.ts     (validações para criação)
│   └── update-banner.dto.ts     (extends PartialType)
├── banners.controller.ts         (endpoints admin)
├── banners.service.ts            (lógica de negócio)
├── banners.module.ts             (module config)
└── public-banners.controller.ts  (endpoint público)
```

### API Endpoints

#### 🔓 Público (sem autenticação)

```typescript
GET /api/public/banners
// Retorna apenas banners ativos, ordenados por display_order
```

#### 🔐 Admin (requer JWT + Role)

**Roles permitidas**: `ADMIN_RELM`, `GERENTE_RELM`, `SUPORTE_RELM`

```typescript
GET    /api/banners          // Lista todos os banners
GET    /api/banners/:id      // Retorna um banner específico
POST   /api/banners          // Cria novo banner
PATCH  /api/banners/:id      // Atualiza banner
DELETE /api/banners/:id      // Remove banner
```

### DTOs

#### CreateBannerDto

```typescript
{
  title: string;           // obrigatório
  subtitle?: string;       // opcional
  imageUrl: string;        // obrigatório
  linkUrl?: string;        // opcional
  linkText?: string;       // opcional
  displayOrder?: number;   // opcional (default: 0)
  active?: boolean;        // opcional (default: true)
}
```

#### UpdateBannerDto

Todos os campos opcionais (extends `PartialType(CreateBannerDto)`)

### Exemplo de Resposta

```json
{
  "id": "uuid",
  "title": "SERVIÇOS & BIKES",
  "subtitle": "Todos os serviços para sua bike",
  "imageUrl": "/uploads/banners/banner1.png",
  "linkUrl": "/garantia",
  "linkText": "Solicitar Garantia",
  "displayOrder": 1,
  "active": true,
  "createdAt": "2024-02-24T00:00:00.000Z",
  "updatedAt": "2024-02-24T00:00:00.000Z"
}
```

---

## 🎨 Frontend (React)

### Componentes

#### 1. BannerCarousel.jsx

**Localização**: `frontend/src/components/BannerCarousel.jsx`  
**Uso**: Homepage (página inicial)

**Funcionalidades**:
- ✅ Carregamento automático de banners ativos
- ✅ Auto-advance a cada 5 segundos
- ✅ Navegação com setas (anterior/próximo)
- ✅ Dots de navegação
- ✅ Overlay com gradiente
- ✅ Botão de ação customizável
- ✅ Responsivo (mobile/desktop)
- ✅ Loading state
- ✅ Fallback em caso de erro

**Props**: Nenhuma (carrega dados da API)

```jsx
import BannerCarousel from '../components/BannerCarousel';

// Uso
<BannerCarousel />
```

#### 2. BannersPage.jsx

**Localização**: `frontend/src/pages/BannersPage.jsx`  
**Rota**: `/admin/banners`  
**Acesso**: Admin RELM, Gerente RELM

**Funcionalidades**:
- ✅ Listagem de todos os banners
- ✅ Preview de imagem
- ✅ Criar novo banner (formulário inline)
- ✅ Editar banner existente
- ✅ Excluir banner (com confirmação)
- ✅ Toggle ativo/inativo (olho 👁️)
- ✅ Reordenar (setas ↑↓)
- ✅ Form validation
- ✅ Loading states
- ✅ Error handling

### API Service

**Localização**: `frontend/src/services/api.js`

```javascript
export const bannersAPI = {
  // Público
  getActive: () => api.get('/public/banners').then((res) => res.data),
  
  // Admin
  getAll: () => api.get('/banners').then((res) => res.data),
  getById: (id) => api.get(`/banners/${id}`).then((res) => res.data),
  create: (data) => api.post('/banners', data).then((res) => res.data),
  update: (id, data) => api.patch(`/banners/${id}`, data).then((res) => res.data),
  delete: (id) => api.delete(`/banners/${id}`).then((res) => res.data),
};
```

### Rotas

```jsx
// frontend/src/App.jsx

<Route
  path="/admin/banners"
  element={
    <ProtectedRoute allowedRoles={['ADMIN_RELM', 'GERENTE_RELM']}>
      <BannersPage />
    </ProtectedRoute>
  }
/>
```

---

## 📁 Upload de Imagens

### Diretório

```bash
/var/www/relm-careplus-prod-web/uploads/banners/
```

### Permissões

```bash
sudo mkdir -p /var/www/relm-careplus-prod-web/uploads/banners
sudo chown -R www-data:www-data /var/www/relm-careplus-prod-web/uploads
sudo chmod -R 755 /var/www/relm-careplus-prod-web/uploads
```

### URL Pública

```
http://177.153.62.248/uploads/banners/banner1.png
```

### Formato Recomendado

- **Dimensões**: 1920x600 px (proporção 16:4)
- **Formato**: PNG ou JPG
- **Tamanho**: < 2 MB
- **Compressão**: Otimizada para web

---

## 🚀 Deploy em Produção

### Pré-requisitos

✅ 3 banners PNG uploaded para `/var/www/relm-careplus-prod-web/uploads/banners/`  
✅ Database com tabela `banners` criada  
✅ Código commitado e pushed para GitHub

### Passos

```bash
# 1. Entrar no diretório de produção
cd /var/www/relm-careplus-prod

# 2. Pull das últimas alterações
git pull origin feature/insurance-module

# 3. Gerar Prisma Client
cd backend
npx prisma generate

# 4. Restart backend
pm2 restart relm-backend

# 5. Build frontend
cd ../frontend
npm run build

# 6. Deploy frontend
sudo rm -rf /var/www/relm-careplus-prod-web/assets
sudo cp -r dist/assets /var/www/relm-careplus-prod-web/
sudo cp dist/index.html /var/www/relm-careplus-prod-web/
sudo chown -R www-data:www-data /var/www/relm-careplus-prod-web/
sudo chmod -R 755 /var/www/relm-careplus-prod-web/

# 7. Testar
curl http://177.153.62.248:3005/api/health
curl http://177.153.62.248:3005/api/public/banners
```

---

## 🧪 Testes

### Backend

```bash
# Teste de health
curl http://177.153.62.248:3005/api/health

# Teste de banners públicos
curl http://177.153.62.248:3005/api/public/banners

# Teste de banners admin (com token)
curl -H "Authorization: Bearer SEU_TOKEN" \
     http://177.153.62.248:3005/api/banners
```

### Frontend

1. **Homepage**:
   - Acessar: `http://177.153.62.248`
   - Verificar se o carrossel aparece
   - Testar navegação com setas
   - Verificar auto-advance
   - Clicar nos botões de ação

2. **Admin**:
   - Fazer login: `http://177.153.62.248/login`
   - Acessar: `http://177.153.62.248/admin/banners`
   - Criar novo banner
   - Editar banner existente
   - Reordenar banners (↑↓)
   - Toggle ativo/inativo (👁️)
   - Excluir banner

---

## 🔐 Permissões

| Rota | Admin RELM | Gerente RELM | Suporte RELM | Loja | Público |
|------|------------|--------------|--------------|------|---------|
| GET /public/banners | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /banners | ✅ | ✅ | ✅ | ❌ | ❌ |
| POST /banners | ✅ | ✅ | ❌ | ❌ | ❌ |
| PATCH /banners/:id | ✅ | ✅ | ❌ | ❌ | ❌ |
| DELETE /banners/:id | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 📊 Estatísticas

- **Arquivos criados**: 14
- **Linhas adicionadas**: 1,120
- **Backend**: 7 arquivos (controllers, services, DTOs, module)
- **Frontend**: 2 componentes (carousel, admin page)
- **Documentação**: 1 arquivo markdown
- **Scripts**: 1 deployment script

---

## 🔗 Links Úteis

- **Site**: http://177.153.62.248
- **Homepage (com carrossel)**: http://177.153.62.248
- **Admin (banners)**: http://177.153.62.248/admin/banners
- **API (banners públicos)**: http://177.153.62.248:3005/api/public/banners
- **API (health)**: http://177.153.62.248:3005/api/health
- **GitHub**: https://github.com/adrianogogogo/Relm

---

## 📝 TODO (Futuras Melhorias)

- [ ] Upload de imagens via interface (atualmente via FTP/SSH)
- [ ] Preview em tempo real antes de salvar
- [ ] Agendamento de banners (data início/fim)
- [ ] Segmentação por público (cliente/loja/distribuidor)
- [ ] Analytics (cliques, visualizações)
- [ ] A/B testing de banners
- [ ] Biblioteca de imagens
- [ ] Editor visual de banners
- [ ] Versionamento de banners
- [ ] Histórico de alterações

---

## 🐛 Troubleshooting

### Banners não aparecem no carrossel

1. Verificar se há banners ativos: `curl http://177.153.62.248:3005/api/public/banners`
2. Verificar console do navegador (F12) por erros
3. Verificar se as imagens estão acessíveis: `http://177.153.62.248/uploads/banners/banner1.png`
4. Verificar se o backend está rodando: `pm2 list`

### Erro ao criar/editar banner

1. Verificar se está logado como Admin ou Gerente
2. Verificar token no localStorage
3. Verificar console do navegador por erros de validação
4. Verificar logs do backend: `pm2 logs relm-backend --lines 50`

### Imagens não carregam

1. Verificar permissões do diretório: `ls -la /var/www/relm-careplus-prod-web/uploads/banners/`
2. Deve ser `www-data:www-data` com `755`
3. Verificar se o arquivo existe
4. Testar URL diretamente no navegador

---

## 📞 Contato

Para suporte ou dúvidas sobre o sistema de banners:

- **GitHub**: https://github.com/adrianogogogo/Relm
- **Documentação**: `/home/user/webapp/BANNER-SYSTEM.md`

---

✅ Sistema implementado e pronto para uso!
