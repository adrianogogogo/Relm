# Insurance Module - Frontend Pages

**Created**: 2024-02-24  
**Status**: ✅ Complete  
**Branch**: `feature/insurance-module`

## 📦 Páginas Criadas

### 1. InsurancePage.jsx
**Localização**: `frontend/src/pages/InsurancePage.jsx`

**Funcionalidades**:
- Dashboard principal com abas "Cotações" e "Apólices"
- Cards de estatísticas (Total, Pendentes, Aprovadas, Ativas)
- Busca e filtros por status
- Lista com paginação
- Navegação para detalhes
- Botão "Nova Apólice"

**Recursos**:
- Status badges coloridos
- Ícones da biblioteca `lucide-react`
- Integração com `react-query`
- Responsive design

---

### 2. QuoteDetailPage.jsx
**Localização**: `frontend/src/pages/QuoteDetailPage.jsx`

**Funcionalidades**:
- Visualização completa dos dados da cotação
- Ações condicionais por status:
  - **PENDING**: Aprovar ou Rejeitar
  - **APPROVED**: Converter em Apólice
- Informações organizadas em cards:
  - Dados do Cliente
  - Dados da Bike
  - Detalhes da Cotação
- Modals de confirmação para ações

**Recursos**:
- Mutations com `useMutation` (react-query)
- Validação de dados antes de aprovar
- Navegação de volta para dashboard
- Status visual com cores

---

### 3. PolicyDetailPage.jsx
**Localização**: `frontend/src/pages/PolicyDetailPage.jsx`

**Funcionalidades**:
- Visualização completa da apólice
- Ações disponíveis:
  - **Imprimir**: Gera versão para impressão
  - **Renovar**: Renova por mais 12 meses
  - **Cancelar**: Cancela a apólice
- Alerta de vencimento (30 dias antes)
- Informações organizadas:
  - Segurado
  - Seguradora
  - Valores (Bike, Cobertura, Prêmios, Franquia)
  - Cobertura
  - Vigência
  - Observações

**Recursos**:
- Print-friendly CSS (`@media print`)
- Status com cores diferenciadas
- Cálculo automático de dias até vencimento
- Modals de confirmação

---

### 4. PolicyFormPage.jsx
**Localização**: `frontend/src/pages/PolicyFormPage.jsx`

**Funcionalidades**:
- Criação manual de nova apólice
- Conversão de cotação em apólice (via `?quoteId=xxx`)
- Pré-preenchimento automático de dados da cotação
- Validação completa de formulário
- Cálculo automático do prêmio anual (12x mensal)
- Seleção de cliente existente
- Campos organizados em seções:
  - Cliente
  - Seguradora
  - Valores
  - Vigência
  - Observações

**Recursos**:
- Validação de campos obrigatórios
- Validação de datas (término > início)
- Validação de valores numéricos
- Estados de erro por campo
- Auto-cálculo de valores
- Integração com `customerAPI`

---

## 🔗 Rotas Necessárias (App.jsx)

```jsx
import InsurancePage from './pages/InsurancePage';
import QuoteDetailPage from './pages/QuoteDetailPage';
import PolicyDetailPage from './pages/PolicyDetailPage';
import PolicyFormPage from './pages/PolicyFormPage';

// Dentro de <Routes>
<Route path="/admin/seguros" element={<InsurancePage />} />
<Route path="/admin/seguros/cotacoes/:id" element={<QuoteDetailPage />} />
<Route path="/admin/seguros/apolices/:id" element={<PolicyDetailPage />} />
<Route path="/admin/seguros/apolices/nova" element={<PolicyFormPage />} />
```

---

## 🛠 APIs Utilizadas (src/services/api.js)

As páginas esperam as seguintes funções em `insuranceAPI`:

```javascript
export const insuranceAPI = {
  // Quotes
  getQuotes: () => api.get('/insurance/quotes'),
  getQuoteById: (id) => api.get(`/insurance/quotes/${id}`),
  approveQuote: (id, data) => api.post(`/insurance/quotes/${id}/approve`, data),
  rejectQuote: (id) => api.post(`/insurance/quotes/${id}/reject`),
  convertToPolicy: (id) => api.post(`/insurance/quotes/${id}/convert-to-policy`),
  
  // Policies
  getPolicies: () => api.get('/insurance/policies'),
  getPolicyById: (id) => api.get(`/insurance/policies/${id}`),
  createPolicy: (data) => api.post('/insurance/policies', data),
  cancelPolicy: (id) => api.post(`/insurance/policies/${id}/cancel`),
  renewPolicy: (id) => api.post(`/insurance/policies/${id}/renew`)
};

export const customerAPI = {
  getAll: () => api.get('/customers')
};
```

---

## 📋 Checklist de Deploy

### Backend (já deployado ✅)
- [x] Tabela `insurance_policies` criada
- [x] Prisma schema atualizado
- [x] DTOs criados
- [x] InsuranceService implementado
- [x] InsuranceController com 13 endpoints
- [x] Build e PM2 restart

### Frontend (próximos passos)
- [x] 4 páginas criadas
- [ ] Atualizar `App.jsx` com rotas
- [ ] Atualizar `src/services/api.js` com endpoints
- [ ] Adicionar link "Seguros" no menu lateral (AdminLayout)
- [ ] Build frontend: `npm run build`
- [ ] Deploy para `/var/www/relm-careplus-prod-web/`

---

## 🎨 Componentes Externos Necessários

**Bibliotecas utilizadas**:
- `react-router-dom` (navegação)
- `@tanstack/react-query` (data fetching)
- `lucide-react` (ícones)
- `tailwindcss` (estilos)

Todas já devem estar instaladas no projeto.

---

## 🚀 Próximos Passos no Servidor

1. **Pull das mudanças**:
```bash
cd /var/www/relm-careplus-prod
git pull origin feature/insurance-module
```

2. **Atualizar api.js** (adicionar endpoints do Insurance)

3. **Atualizar App.jsx** (adicionar rotas)

4. **Build frontend**:
```bash
cd frontend
npm install  # se necessário
npm run build
```

5. **Deploy**:
```bash
sudo rm -rf /var/www/relm-careplus-prod-web/*
sudo cp -r dist/* /var/www/relm-careplus-prod-web/
sudo chown -R www-data:www-data /var/www/relm-careplus-prod-web/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 📝 Notas

- Todas as páginas usam `async/await` com `react-query`
- Tratamento de erros implementado
- Validação de formulários completa
- UI responsiva e acessível
- Print-friendly na PolicyDetailPage

---

## 🔗 Pull Request

**PR #1**: https://github.com/adrianogogogo/Relm/pull/1

**Título**: Insurance Module Implementation  
**Status**: Open  
**Branch**: feature/insurance-module → main

**Commits**:
1. Add insurance module deployment scripts and documentation
2. Add frontend pages for Insurance Module

---

**Criado por**: GenSpark AI Developer  
**Data**: 2024-02-24
