---
name: relm-landing-design
description: Regras de design das landing pages e e-mails de campanha do Relm Care+. Use ao mexer em backend/src/ai-design/ (landing-renderer.ts, email-renderer.ts, blocks.schema.ts), ao criar um tipo novo de página, ao alterar paleta, tipografia, moldura de marca ou movimento, e ao revisar qualquer peça gerada antes de publicar.
---

# Design das campanhas Relm Care+

O que este arquivo governa: as páginas públicas e os e-mails que o gerador de
campanhas produz. Não governa o painel administrativo (React + Tailwind) — lá
vale o CSS do frontend.

## 0. O alvo de render (leia antes de escrever CSS)

A landing **não é React**. `renderLanding()` devolve um documento HTML completo,
com `<style>` embutido, montado no backend. Não existe Tailwind, não existe
build step, não existe componente. Toda classe utilitária que você conhece tem
que virar CSS escrito à mão.

O e-mail é outro alvo ainda: `renderEmail()` usa **tabela e CSS inline**, sem
`<style>` no head e sem flexbox — o Outlook derruba as duas coisas. O que serve
para a landing quase nunca serve para o e-mail; são dois renderizadores porque
são dois meios, não por descuido.

Os dois leem o mesmo tipo de bloco (`blocks.schema.ts`). Se um bloco novo não
tiver tradução possível para tabela, ele precisa nascer sabendo que o e-mail vai
ignorá-lo — e o teste tem que provar que ignora sem quebrar.

## 1. Moldura de marca — fixa, não negociável

Estes elementos são **sempre** os mesmos, em qualquer campanha, qualquer tema,
qualquer tipo de página:

| Elemento | Regra |
|---|---|
| Topo | Fundo `#0E1F40`, logo Relm (`logo-white.png`) à esquerda |
| Logo da loja | Quando a página tem `storeId`, o logo da loja aparece no topo ao lado do da Relm, separado por um divisor de 1px |
| Botão primário | Fundo `#00ADEF`, texto branco |
| Módulo de planos | Care e Care Plus sempre na paleta da marca, nunca na paleta do tema |
| Rodapé | Fundo `#0E1F40`, texto branco, assinatura "Relm Care+" |

Motivo: a página é compartilhada pela loja parceira como material da Relm. Se
cada campanha tiver uma marca diferente, ela deixa de construir a imagem da
Relm — que é o objetivo declarado do produto.

## 2. Paleta do tema — só no miolo

A IA gera três cores por campanha (`paleta`). Elas pintam **apenas** o miolo:
destaques de seção, fundos alternados, detalhes. Nunca a moldura da seção 1.

A paleta gerada **não é usada crua**. `landing-renderer.ts` deriva um tema com
contraste calculado, porque o modelo já produziu combinação com contraste 1.5
(botão invisível). Se você mexer no cálculo, mantenha o piso:

- Texto sobre fundo: **mínimo 4.5:1**
- Acento sobre fundo: **mínimo 3:1** (a função `realcar()` empurra até chegar lá)
- Tinta do botão: preto ou branco, o que enxergar melhor (`tintaSobre()`)

Cor que chega do modelo passa por `sanitizePagina()` antes de entrar em `style`.
Nunca interpole cor de modelo direto em CSS.

## 3. Tipografia

- **Títulos:** `Archivo` (variável, `wdth 75..125`, `wght 400..900`).
- **Corpo:** `Newsreader` (serifada, óptica variável). A serifa é escolha
  deliberada: dá voz editorial à campanha e a separa do painel administrativo,
  que é sans (Inter/Space Grotesk). Não unifique os dois — não são o mesmo meio
  nem o mesmo público.
- **Auto-hospedadas.** A landing é pública e o projeto controla consentimento
  (`PrivacyConsent`): nenhuma requisição a `fonts.googleapis.com`, que entregaria
  o IP do visitante a terceiro e quebraria a tipografia se a rede falhar. Os
  `.woff2` vêm do pacote `@fontsource/*` e são servidos pelo próprio backend.
- Escala fluida com `clamp()`. Nada de tamanho fixo em px para título.
- No **e-mail**, webfont não vale: use a pilha de sistema. Cliente de e-mail
  ignora `@font-face` com frequência suficiente para não valer o risco.

## 4. Movimento

Orçamento: **~15 linhas de JavaScript inline**, sem biblioteca, sem request
externo. Um `IntersectionObserver` que revela seções ao rolar.

Regras que não se negociam:
- O conteúdo nasce **visível**; o JS só adiciona o efeito. Se o script falhar,
  a página continua legível — nunca `opacity: 0` no CSS base.
- `@media (prefers-reduced-motion: reduce)` desliga toda transição de entrada.
- `animation-timeline: view()` sozinho não serve: não roda no Safari estável, e
  essas páginas circulam por WhatsApp, ou seja, majoritariamente iPhone.
- Transição usa `cubic-bezier(.2,.8,.2,1)`, nunca `linear` nem `ease-in-out`.
- **Zero JS no e-mail.** Sempre.

## 5. Os seis tipos de página

Cada tipo tem schema próprio, prompt próprio e layout próprio. Tipo e layout são
o mesmo eixo — não existe "layout X aplicado ao tipo Y".

| Tipo | Conteúdo que só ele tem | Fato real do banco |
|---|---|---|
| **Produto** | Preço, faixa por volume, ficha técnica, galeria | `Product` |
| **Linha** | Conjunto de produtos, argumento da linha, cores do universo | `Product` (por tipo) |
| **Evento** | Data, local, vagas, inscrição | `Event` |
| **Clube** | Comparativo Care × Care Plus, anuidade, pontos | `ClubSettings` + `ENTITLEMENTS` |
| **Parceria** | Parceiro, benefício, compra coletiva | `Partner` |
| **Benefício/sazonal** | Vigência, condição, resgate | `Benefit` |

Regra que vale para todos: **número vem do banco, nunca do prompt.** O padrão
está em `textoDosFatos()` — regra de clube muda pela tela de Configurações, e
literal escrito no prompt vira mentira no dia seguinte sem ninguém perceber.

## 6. O que reprova uma peça

Antes de publicar, a peça falha se:

1. Contraste abaixo do piso da seção 2 em qualquer par texto/fundo.
2. Moldura de marca pintada com cor do tema.
3. Fonte carregada de CDN externo.
4. Conteúdo invisível sem JavaScript.
5. Número, prazo, desconto ou condição que não veio do banco nem do briefing.
6. Benefício exclusivo do plano pago atribuído a "Care+" ou a "Care" — os três
   nomes não são sinônimos (ver `VOCABULARIO` em `campanha-prompts.ts`).
7. Depoimento gerado publicado sem alguém confirmar. Todo `prova` nasce marcado
   `inventado: true` de propósito.
8. Página sem imagem de ciclismo ligada ao tema.
9. `h-screen`/`100vh` em seção de altura cheia — use `100dvh`, senão o Safari do
   iPhone pula no scroll.
10. Layout assimétrico que não colapsa para coluna única abaixo de 768px.

## 7. Como verificar

- Screenshot de cada tipo em **375px e 1280px**. Julgamento de aparência é
  humano; a captura existe para que a pessoa julgue o que vai ao ar.
- Teste automatizado de contraste reprovando qualquer par abaixo do piso — é o
  erro que passa despercebido em screenshot bonito.
- Os testes de `ai-design.spec.ts` cobrem segurança e contrato (href hostil, cor
  não-hex, escape, e-mail sem flexbox). Tipo novo entra com teste ali.

## 8. Estética: o que buscar

A referência de acabamento é agência, não template: profundidade por camada e
não por sombra dura, espaçamento generoso entre blocos, tipografia grande e
confiante no hero, hierarquia por peso e tamanho antes de por cor.

O que denuncia página gerada por IA, e que esta skill existe para evitar:
sombra cinza genérica em tudo, três colunas simétricas sem respiro, ícone de
traço grosso, borda `1px solid #ddd` como único recurso de separação, gradiente
roxo-azul de stock, e todo botão com o mesmo peso visual.

Variação entre tipos é obrigatória: se as seis páginas puderem trocar de CSS
entre si sem ninguém notar, o trabalho não foi feito.
