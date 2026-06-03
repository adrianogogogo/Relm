# Relm Care+ Frontend (React + Vite)

Frontend moderno em React para o sistema Relm Care+.

## 🚀 Tecnologias

- **React 18** - UI Library
- **Vite** - Build Tool
- **React Router** - Roteamento
- **TanStack Query** - Data Fetching
- **Zustand** - State Management
- **Tailwind CSS** - Styling
- **Axios** - HTTP Client

## 📦 Instalação

```bash
npm install
```

## 🔧 Desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3003

## 🏗️ Build de Produção

```bash
npm run build
```

Os arquivos serão gerados em `dist/`

## 🌐 Variáveis de Ambiente

Crie um arquivo `.env`:

```
VITE_API_URL=http://191.252.217.190:3005
```

## 📁 Estrutura

```
src/
├── components/     # Componentes reutilizáveis
├── pages/          # Páginas da aplicação
├── services/       # API e serviços
├── store/          # Zustand stores
├── App.jsx         # Componente raiz
└── main.jsx        # Entry point
```

## 🎨 Cores do Tema

- Primary (Teal): #00BCD4
- Secondary (Verde): #4CAF50

## 🔐 Autenticação

O sistema usa JWT com access e refresh tokens armazenados no localStorage.

## 📱 Páginas Implementadas

- ✅ Home
- ✅ Login
- ✅ Garantia (formulário público)
- ✅ Vantagens
- ✅ Eventos
- ✅ Seguro
- ✅ Newsletter
- ✅ Dashboard Admin

## 🚀 Deploy

### Opção 1: Build local e envio via SCP

```bash
npm run build
scp -r dist/* root@191.252.217.190:/var/www/relm-careplus-prod-web/
```

### Opção 2: Build direto no VPS

```bash
cd /var/www/relm-careplus-prod/frontend
npm install
npm run build
cp -r dist/* /var/www/relm-careplus-prod-web/
chown -R www-data:www-data /var/www/relm-careplus-prod-web
```

## 📝 Credenciais de Teste

- **Admin**: admin@relmbikes.com.br / Admin@2024
- **Gerente**: gerente@relmbikes.com.br / Gerente@2024
- **Suporte**: suporte@relmbikes.com.br / Suporte@2024
- **Loja**: loja@bikeshopsp.com.br / Loja@2024

## 🔗 Links

- API: http://191.252.217.190:3005
- Swagger: http://191.252.217.190:3005/docs
