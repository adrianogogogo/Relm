# Design System: Relm Care+
**Project ID:** relm-care-local

Este documento serve como a fonte de verdade para a identidade visual da plataforma **Relm Care+**, garantindo que ela siga exatamente as diretrizes e a atmosfera visual do site oficial da **Relm Tecnologia** (https://www.relm.com.br/).

## 1. Visual Theme & Atmosphere
A plataforma possui uma atmosfera visual **corporativa, segura, limpa e tecnológica**. A experiência do usuário é focada em alta confiabilidade e credibilidade. A estrutura visual baseia-se em um forte contraste entre blocos de conteúdo escuro (azul-marinho profundo) e áreas de leitura claras (branco e cinzas suaves), utilizando imagens limpas e tipografia sem serifa marcante.

## 2. Color Palette & Roles
As cores principais são baseadas diretamente no branding da Relm Tecnologia:

*   **Azul Escuro / Marinho Principal (`#0E1F40`):** Usado como cor de destaque corporativo primário. Presente no cabeçalho (Navbar), rodapé (Footer), menus de navegação lateral (Sidebar) dos painéis administrativo e do cliente, além de botões primários. Transmite segurança, solidez e autoridade.
*   **Ciano / Azul Vibrante Destaque (`#00ADEF`):** Usado como cor de destaque (Accent/Secondary) para chamar a atenção. Presente no logotipo, botões de destaque, links ativos de menu, e elementos interativos. Transmite inovação, modernidade e tecnologia.
*   **Cinza de Fundo Geral (`#F8F9FA` ou `#F3F3F3`):** Usado para planos de fundo de páginas e áreas de inputs. Mantém a interface limpa e descansada para leitura.
*   **Branco Puro (`#FFFFFF`):** Fundo de cartões (Cards), contêineres e áreas de leitura de conteúdo.
*   **Cinza de Texto Principal (`#1F2937`):** Texto principal do corpo de textos em áreas claras para excelente contraste e legibilidade.
*   **Cinza de Texto Secundário (`#666666`):** Descrições, metadados e legendas secundárias.

## 3. Typography Rules
A tipografia deve passar um tom institucional de alta tecnologia:
*   **Font Family:** `Montserrat`, `Inter` ou famílias sem serifa similares (sans-serif).
*   **Títulos Principais (Headers):** Peso negrito/extra-negrito (`font-bold` ou `font-extrabold`), em caixa alta (`uppercase`) em menus e títulos de seções para conferir imponência e estrutura sólida.
*   **Corpo de Texto (Body):** Peso regular (`font-normal`), com bom espaçamento entre linhas (`leading-relaxed`) e espaçamento de texto para leitura prolongada.

## 4. Component Stylings
*   **Buttons (Botões):**
    *   *Primary:* Retangular com cantos levemente arredondados (`rounded-lg`), preenchimento sólido em Azul Escuro (`#0E1F40`), texto em branco e caixa alta.
    *   *Secondary/Accent:* Preenchimento sólido em Ciano Vibrante (`#00ADEF`), texto em branco.
    *   *Outline:* Bordas de 2px em Ciano ou Azul Escuro, texto na respectiva cor, e fundo transparente que preenche no hover.
    *   *Hover/Transition:* Transição suave (`transition-all duration-300`) com leve escurecimento da cor de fundo ou aumento da sombra.
*   **Cards/Containers:**
    *   Fundo branco (`bg-white`), cantos sutilmente arredondados (`rounded-xl` ou `rounded-lg`).
    *   Sombras finas e difusas (`shadow-sm` ou `shadow-md`), que ganham um leve destaque ou escala no hover (`hover:shadow-lg transition-all`).
*   **Inputs/Forms (Campos de Entrada):**
    *   Formatos retangulares bem alinhados, bordas finas em cinza médio-claro (`#D1D5DB`).
    *   Ao focar (focus), a borda deve mudar para o Ciano Vibrante (`#00ADEF`) com um anel sutil de foco (`focus:ring-2 focus:ring-[#00ADEF]`).
    *   Placeholders discretos e alinhados.

## 5. Layout Principles
*   **Seções Horizontais e Margens:** Uso de seções de largura inteira (`w-full`) alternando fundos de destaque escuro (`bg-[#0E1F40]`) e fundos claros (`bg-[#F8F9FA]`), como no site oficial.
*   **Espaçamento (Padding & Margins):** Espaçamento generoso entre blocos de informação (`py-16` ou `py-20` para seções) para criar áreas de respiração visual ("whitespace").
*   **Alinhamento:** Layouts baseados em grid moderno, mantendo cards e textos simétricos e alinhados à esquerda ou centralizados para chamadas principais.
