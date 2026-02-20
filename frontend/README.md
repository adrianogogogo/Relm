# 🎨 Relm Care+ Frontend (Flutter Web)

## Quick Start

### Pré-requisitos
- Flutter SDK 3.x
- Chrome (para desenvolvimento)

### Instalação

```bash
flutter pub get
```

### Desenvolvimento

```bash
# Rodar no Chrome (dev local)
flutter run -d chrome --dart-define=API_URL=http://localhost:3003

# Rodar com hot reload
flutter run -d chrome --dart-define=API_URL=http://localhost:3003 --web-renderer html
```

### Build para Produção

```bash
# Produção
flutter build web --release --web-renderer html \
  --dart-define=API_URL=https://api-careplus.relmbikes.com.br

# Staging
flutter build web --release --web-renderer html \
  --dart-define=API_URL=https://staging-api-careplus.relmbikes.com.br
```

Build será gerado em: `build/web/`

## Estrutura

```
lib/
├── main.dart                 # Entry point + routing
├── screens/                  # Todas as telas
│   ├── home/
│   ├── warranty/             # Formulário de garantia
│   ├── benefits/             # Clube de vantagens
│   ├── events/               # Eventos
│   ├── newsletter/           # Newsletter
│   ├── insurance/            # Cotação seguro
│   ├── auth/                 # Login
│   └── admin/                # Dashboard admin
├── services/                 # API e Auth
├── models/                   # Modelos de dados
└── widgets/                  # Componentes reutilizáveis
```

## Paleta de Cores (Relm)

- **Primária (Teal):** `0xFF00BCD4`
- **Secundária (Verde):** `0xFF4CAF50`
- **Background:** `0xFFFFFFFF`
- **Bordas:** `0xFFE0E0E0`

## Rotas

- `/` - Home
- `/garantia` - Formulário garantia
- `/vantagens` - Clube de vantagens
- `/eventos` - Eventos
- `/seguro` - Cotação seguro
- `/newsletter` - Newsletter
- `/login` - Login admin
- `/admin` - Dashboard

## TODO (V2)

- [ ] Expandir formulário de garantia completo
- [ ] Implementar autenticação completa
- [ ] Dashboard admin com tabelas
- [ ] Portal cliente autenticado
- [ ] Portal loja
- [ ] Portal distribuidor
- [ ] Responsividade mobile
- [ ] Testes
