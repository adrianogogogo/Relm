# UI primitives — Fundacao (Fase 0)

Componentes e tokens alinhados ao `DESIGN-SYSTEM.md` da Relm, traduzidos de MUI para **Tailwind**.
As proximas fases (paginas/layouts) devem reutilizar estas primitivas.

## Mapeamento token -> classe Tailwind

### Cores de marca / status
| Conceito (doc) | Hex | Classe Tailwind |
|---|---|---|
| Primario (marca) | `#1565C0` | `bg-primary` / `text-primary` / `ring-primary` / `border-primary` |
| Primario dark | `#42a5f5` | `dark:bg-primary-400` / `dark:text-primary-400` |
| Secundario (slate) | `#2d3a4a` | `bg-secondary` / `text-secondary` |
| Sucesso | `#4CAF50` | `bg-success` / `text-success` / `bg-success/20` |
| Aviso | `#FF9800` | `bg-warning` / `text-warning` / `bg-warning/20` |
| Erro | `#F44336` | `bg-error` / `text-error` / `bg-error/20` |
| Info | `#2196F3` | `bg-info` / `text-info` / `bg-info/20` |

Cada token semantico tem `DEFAULT`, escala leve (`50/100`) e `500/600/700`,
entao `bg-success/15`, `bg-success/20`, `text-success` funcionam.

### Superficies / fundo
| Conceito | Hex | Classe |
|---|---|---|
| Fundo app (claro) | `#f0f4f8` | `bg-app` (ja aplicado no `body`) |
| Superficie (claro) | `#ffffff` | `bg-surface` / `bg-white` |
| Fundo app (dark) | `#0a1929` | `dark:bg-app-dark` |
| Superficie (dark) | `#0d2137` | `dark:bg-surface-dark` |

### Gradientes
| Uso | Classe |
|---|---|
| Sidebar (`180deg #0d2137 -> #1a3a5c`) | `bg-sidebar-gradient` |
| Auth/portal publico (`135deg #0d2137 -> #1565C0`) | `bg-auth-gradient` |

### Raios e sombra
| Conceito | Valor | Classe |
|---|---|---|
| Botao / input | 8px | `rounded-lg` |
| Card | 12px | `rounded-xl` |
| Sombra de card | `0 2px 12px rgba(0,0,0,.06)` | `shadow-card` |

### Classes globais (`index.css`)
- `.btn` + `.btn-primary` / `.btn-secondary` / `.btn-outline`
- `.card` (rounded-xl + shadow-card, sem hover-zoom)
- `.input`, `.label`
- `.bg-header-active` (item de nav ativo: claro = branco + texto primary; dark = branco translucido)

## Componentes

Import limpo:
```jsx
import { Card, PageHeader, StatusChip, StatCard, Button } from '../components/ui';
```

### `<PageHeader title subtitle action />`
Cabecalho de pagina (§7.1). Titulo `text-2xl/3xl font-bold` (fonte de titulo) + subtitulo
`text-sm text-gray-500`; `action` (node) alinhado a direita.
```jsx
<PageHeader title="Garantias" subtitle="12 garantia(s)" action={<Button icon={Plus}>Nova</Button>} />
```

### `<StatusChip label variant|color />`
Pilula de status (§2.6). `variant`: `success | warning | error | info | neutral`.
Ou `color` em hex (tem prioridade). Fundo a 12% (`hex+'20'`), texto na cor cheia.
```jsx
<StatusChip label="Resolvido" variant="success" />
<StatusChip label="Premium" color="#9C27B0" />
```

### `<StatCard title value subtitle icon color />`
Card de KPI (§6.3). `icon` = componente lucide-react; `color` em hex (default `#1565C0`).
```jsx
<StatCard title="Garantias" value={12} subtitle="ativas" icon={Shield} color="#1565C0" />
```

### `<Card className as ...rest />`
Wrapper que aplica `.card`. `className` extende (ex.: `p-0`, `h-full`).

### `<Button variant color icon ...rest />`
`variant`: `contained | outlined | text`. `color`: `primary | secondary | error | success`.
Raio 8px, peso 600, sem caixa alta. `icon` = lucide-react a esquerda.
```jsx
<Button variant="contained" color="primary" icon={Plus}>Nova garantia</Button>
```

## Dark mode
Preservado via classe `dark` (Zustand `themeStore`). Os tokens usam variantes `dark:`
e os overrides globais de `index.css` foram realinhados a paleta nova (`#0a1929` / `#0d2137`).
