import { Bloco, PaginaGerada, esc } from './blocks.schema';

/**
 * Terceiro consumidor do mesmo contrato de blocos, agora para navegador.
 *
 * Diferente do renderizador de e-mail, aqui CSS moderno é permitido — o veto do
 * Outlook não vale. O que este arquivo existe para resolver e o React não
 * resolvia: as meta tags OG. Robô de WhatsApp e Facebook não executa JavaScript,
 * então uma SPA devolve sempre o mesmo card genérico, qualquer que seja a página.
 *
 * A paleta da IA NÃO é usada crua. São três cores livres, geradas por tema, e
 * nada garante que combinem: já saiu primária #A1D3E0 sobre fundo #F3FCF9
 * (contraste 1.5 — botão invisível). Aqui elas viram um tema derivado, com o
 * contraste do acento e da tinta dos botões calculados, não presumidos.
 */

type RGB = [number, number, number];

function paraRgb(hex: string): RGB {
  const cru = (hex || '').replace('#', '');
  const cheio = cru.length === 3 ? cru.split('').map((c) => c + c).join('') : cru.padEnd(6, '0');
  return [0, 2, 4].map((i) => parseInt(cheio.slice(i, i + 2), 16) || 0) as RGB;
}

function paraHex(rgb: RGB): string {
  return (
    '#' +
    rgb
      .map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0'))
      .join('')
  );
}

function luminancia(hex: string): number {
  const [r, g, b] = paraRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a: string, b: string): number {
  const [alto, baixo] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (alto + 0.05) / (baixo + 0.05);
}

function misturar(a: string, b: string, peso: number): string {
  const ca = paraRgb(a);
  const cb = paraRgb(b);
  return paraHex([0, 1, 2].map((i) => ca[i] + (cb[i] - ca[i]) * peso) as RGB);
}

/** Preto ou branco — o que enxerga melhor sobre `fundo`. 0.179 é o ponto de virada. */
function tintaSobre(fundo: string): string {
  return luminancia(fundo) > 0.179 ? '#0B0B0C' : '#FFFFFF';
}

/**
 * Empurra a cor até ela se descolar do fundo. Sem isso, uma primária pastel
 * escolhida pelo modelo some contra um fundo claro e leva o CTA junto.
 */
function realcar(cor: string, fundo: string): string {
  const alvo = luminancia(fundo) > 0.179 ? '#000000' : '#FFFFFF';
  let saida = cor;
  for (let i = 0; i < 14 && contraste(saida, fundo) < 3; i++) {
    saida = misturar(saida, alvo, 0.08);
  }
  return saida;
}

type Tema = {
  fundo: string;
  tinta: string;
  suave: string;
  acento: string;
  sobreAcento: string;
  superficie: string;
  linha: string;
  inverso: string;
  sobreInverso: string;
};

function derivarTema(paleta: PaginaGerada['paleta']): Tema {
  const fundo = paleta.corFundo;
  const tinta = paleta.corTexto;
  const acento = realcar(paleta.corPrimaria, fundo);
  // Painel de fechamento: o extremo oposto do fundo, para o último CTA bater.
  const inverso = luminancia(fundo) > 0.179 ? misturar(tinta, '#000000', 0.35) : '#FFFFFF';

  return {
    fundo,
    tinta,
    suave: misturar(fundo, tinta, 0.6),
    acento,
    sobreAcento: tintaSobre(acento),
    superficie: misturar(fundo, tinta, 0.05),
    linha: misturar(fundo, tinta, 0.15),
    inverso,
    sobreInverso: tintaSobre(inverso),
  };
}

function botao(texto: string, url: string, classe: string): string {
  return `<a class="btn ${classe}" href="${esc(url)}">
      <span>${esc(texto)}</span>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7"/></svg>
    </a>`;
}

function renderBloco(bloco: Bloco, indice: number, primeiroTexto: boolean): string {
  const atraso = ` style="--atraso:${indice * 90}ms"`;

  switch (bloco.tipo) {
    // O hero é montado em renderLanding: ele carrega a imagem e não é uma faixa.
    case 'hero':
      return '';

    case 'texto':
      return `<section class="faixa"${atraso}>
    <div class="miolo editorial">
      <h2 class="titulo-secao">${esc(bloco.titulo)}</h2>
      <div class="corpo${primeiroTexto ? ' capitular' : ''}"><p>${esc(bloco.corpo)}</p></div>
    </div>
  </section>`;

    case 'lista':
      return `<section class="faixa alt"${atraso}>
    <div class="miolo">
      <h2 class="titulo-secao centro">${esc(bloco.titulo)}</h2>
      <ol class="cartoes">
        ${bloco.itens
          .map(
            (item, i) => `<li style="--atraso:${i * 80}ms">
          <h3>${esc(item.titulo)}</h3>
          <p>${esc(item.descricao)}</p>
        </li>`,
          )
          .join('\n        ')}
      </ol>
    </div>
  </section>`;

    // <details> nativo: acordeão sem uma linha de JS, acessível por teclado e
    // aberto pelo Ctrl+F do navegador.
    case 'faq':
      return `<section class="faixa"${atraso}>
    <div class="miolo estreito">
      <h2 class="titulo-secao centro">${esc(bloco.titulo)}</h2>
      <div class="duvidas">
        ${bloco.itens
          .map(
            (item) => `<details>
          <summary>${esc(item.pergunta)}</summary>
          <p>${esc(item.resposta)}</p>
        </details>`,
          )
          .join('\n        ')}
      </div>
    </div>
  </section>`;

    // `inventado` não é lido: a marcação de depoimento gerado vive no Preview
    // do admin, não na página pública.
    case 'prova':
      return `<section class="faixa alt"${atraso}>
    <figure class="depoimento miolo estreito">
      <blockquote>${esc(bloco.citacao)}</blockquote>
      <figcaption><strong>${esc(bloco.autor)}</strong><span>${esc(bloco.papel)}</span></figcaption>
    </figure>
  </section>`;

    // Sem `url` o bloco não vira uma moldura vazia — some. Página com buraco
    // cinza é pior que página com uma seção a menos.
    case 'imagem':
      if (!bloco.url) return '';
      return `<section class="faixa figura"${atraso}>
    <figure class="miolo">
      <img src="${esc(bloco.url)}" alt="${esc(bloco.descricao)}" loading="lazy" />
      <figcaption>${esc(bloco.legenda)}</figcaption>
    </figure>
  </section>`;

    case 'cta':
      return `<section class="fechamento"${atraso}>
    <div class="miolo centro">
      <p class="chamada">${esc(bloco.texto)}</p>
      ${botao(bloco.ctaTexto, bloco.ctaUrl, 'btn-inverso btn-grande')}
    </div>
  </section>`;
  }
}

/**
 * `baseUrl` precisa ser absoluto: og:image relativo é ignorado por todo
 * crawler, e o card sai sem imagem mesmo com a imagem existindo.
 */
/**
 * A loja parceira que compartilha a página. Só o que a moldura de marca usa —
 * a página é material da Relm assinado pela loja, não o contrário.
 */
export type LojaMarca = { tradeName: string; logoUrl?: string | null };

export function renderLanding(
  pagina: PaginaGerada,
  baseUrl = '',
  loja?: LojaMarca | null,
): string {
  const t = derivarTema(pagina.paleta);
  // Caminho relativo vira absoluto: crawler de WhatsApp/Facebook ignora relativo,
  // e o logo da loja pode ter sido gravado como caminho local.
  const absoluta = (u?: string | null) => (u?.startsWith('/') ? `${baseUrl}${u}` : u);
  const imagemAbsoluta = absoluta(pagina.imagemUrl);
  const logoLoja = absoluta(loja?.logoUrl);

  const hero = pagina.blocos.find((b) => b.tipo === 'hero') as
    | Extract<Bloco, { tipo: 'hero' }>
    | undefined;
  const fecho = [...pagina.blocos].reverse().find((b) => b.tipo === 'cta') as
    | Extract<Bloco, { tipo: 'cta' }>
    | undefined;
  const meio = pagina.blocos.filter((b) => b.tipo !== 'hero');

  let jaTeveTexto = false;
  const corpo = meio
    .map((bloco, i) => {
      const primeiro = bloco.tipo === 'texto' && !jaTeveTexto;
      if (primeiro) jaTeveTexto = true;
      return renderBloco(bloco, i, primeiro);
    })
    .join('\n  ');

  // A barra fixa só faz sentido se existir para onde mandar o visitante.
  const destino = fecho?.ctaUrl || hero?.ctaUrl;
  const textoBarra = fecho?.ctaTexto || hero?.ctaTexto;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(pagina.titulo)} — Relm Care+</title>
<meta name="description" content="${esc(pagina.subtitulo)}" />
<meta name="theme-color" content="${t.acento}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${esc(pagina.titulo)}" />
<meta property="og:description" content="${esc(pagina.subtitulo)}" />
<meta property="og:site_name" content="Relm Care+" />
${imagemAbsoluta ? `<meta property="og:image" content="${esc(imagemAbsoluta)}" />` : ''}
<meta name="twitter:card" content="${imagemAbsoluta ? 'summary_large_image' : 'summary'}" />
<style>
/* Fontes servidas por nos, nunca por CDN de terceiro: a landing e publica, e
   carregar tipografia de fora entrega o IP de cada visitante numa plataforma
   que controla consentimento — alem de deixar a pagina refem da rede alheia.
   O preco do auto-hospedado e o eixo de largura: o fontsource publica um eixo
   variavel por arquivo, entao fica o peso (usado na pagina inteira) e sai o
   font-stretch. */
@font-face{
  font-family:'Archivo';font-style:normal;font-weight:400 900;font-display:swap;
  src:url('${baseUrl}/fonts/archivo-latin-wght-normal.woff2') format('woff2-variations');
}
@font-face{
  font-family:'Newsreader';font-style:normal;font-weight:300 600;font-display:swap;
  src:url('${baseUrl}/fonts/newsreader-latin-wght-normal.woff2') format('woff2-variations');
}
:root{
  --fundo:${t.fundo}; --tinta:${t.tinta}; --suave:${t.suave};
  --acento:${t.acento}; --sobre-acento:${t.sobreAcento};
  --superficie:${t.superficie}; --linha:${t.linha};
  --inverso:${t.inverso}; --sobre-inverso:${t.sobreInverso};
  --display:'Archivo','Archivo Black',Helvetica,sans-serif;
  --leitura:'Newsreader',Georgia,serif;
  --miolo:1180px;
}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{
  background:var(--fundo);color:var(--tinta);
  font-family:var(--leitura);font-size:18px;line-height:1.65;
  -webkit-font-smoothing:antialiased;overflow-x:hidden;
  padding-bottom:calc(84px + env(safe-area-inset-bottom));
}
@media(min-width:861px){body{padding-bottom:0}}

/* Grão: tira o aspecto de bloco de cor chapada que fundo sólido sempre tem. */
body::after{
  content:'';position:fixed;inset:0;z-index:9;pointer-events:none;opacity:.42;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.32'/%3E%3C/svg%3E");
  mix-blend-mode:multiply;
}

.miolo{max-width:var(--miolo);margin:0 auto;padding:0 clamp(20px,5vw,48px);width:100%}
.centro{text-align:center}

/* ---------- topo ---------- */
.topo{
  position:absolute;top:0;left:0;right:0;z-index:4;
  display:flex;align-items:center;justify-content:space-between;gap:16px;
  padding:22px clamp(20px,5vw,48px);color:#fff;
}
.marcas{display:flex;align-items:center;gap:14px;min-width:0}
.marca{
  font-family:var(--display);font-weight:900;
  font-size:15px;letter-spacing:.22em;text-transform:uppercase;white-space:nowrap;
}
/* Divisor e logo da loja: a página é material da Relm que a loja assina. */
.marcas .risco{width:1px;height:22px;background:rgba(255,255,255,.45);flex:none}
.logo-loja{
  max-height:30px;max-width:132px;width:auto;object-fit:contain;
  filter:brightness(0) invert(1);opacity:.92;
}
.selo{
  font-family:var(--display);font-weight:700;font-size:11px;letter-spacing:.18em;
  text-transform:uppercase;padding:7px 14px;border:1px solid rgba(255,255,255,.55);
  border-radius:999px;backdrop-filter:blur(6px);white-space:nowrap;
}
/* No celular o selo espremia a marca ate sobrar "RELM" — e a pagina circula por
   WhatsApp, entao essa e a tela da maioria. Entre dizer de quem e a pagina e
   dizer que a campanha tem prazo, a marca ganha: o prazo o texto repete. */
@media(max-width:600px){.selo{display:none}}

/* ---------- herói ---------- */
.heroi{
  position:relative;min-height:min(92svh,860px);display:flex;align-items:flex-end;
  overflow:hidden;isolation:isolate;
}
.heroi-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2}
.heroi-fundo{
  position:absolute;inset:0;z-index:-2;
  background:
    radial-gradient(120% 90% at 15% 10%,var(--acento) 0%,transparent 60%),
    radial-gradient(100% 80% at 85% 90%,var(--tinta) 0%,transparent 65%),
    var(--superficie);
}
.heroi::before{
  content:'';position:absolute;inset:0;z-index:-1;
  background:linear-gradient(180deg,rgba(6,8,10,.62) 0%,rgba(6,8,10,.18) 34%,rgba(6,8,10,.72) 78%,rgba(6,8,10,.94) 100%);
}
.heroi .miolo{padding-top:120px;padding-bottom:clamp(44px,7vw,80px);color:#fff}
.chapeu{
  display:inline-flex;align-items:center;gap:12px;margin-bottom:22px;
  font-family:var(--display);font-weight:700;font-size:12px;letter-spacing:.24em;
  text-transform:uppercase;color:#fff;
}
.chapeu::before{content:'';width:44px;height:2px;background:var(--acento)}
.heroi h1{
  font-family:var(--display);font-weight:900;font-stretch:112%;
  font-size:clamp(2.7rem,8.2vw,6.4rem);line-height:.92;letter-spacing:-.025em;
  text-wrap:balance;max-width:16ch;text-shadow:0 2px 40px rgba(0,0,0,.35);
}
.heroi .isca{
  margin-top:20px;max-width:46ch;font-size:clamp(1.05rem,2.2vw,1.4rem);
  line-height:1.5;color:rgba(255,255,255,.9);
}
.acoes{display:flex;flex-wrap:wrap;gap:14px;align-items:center;margin-top:34px}
.ancora{
  font-family:var(--display);font-size:13px;font-weight:700;letter-spacing:.14em;
  text-transform:uppercase;color:rgba(255,255,255,.82);text-decoration:none;
  padding:16px 4px;border-bottom:2px solid transparent;transition:.25s;
}
.ancora:hover{color:#fff;border-bottom-color:var(--acento)}

/* ---------- botões ---------- */
.btn{
  display:inline-flex;align-items:center;gap:12px;
  padding:17px 30px;border-radius:6px;text-decoration:none;
  background:var(--acento);color:var(--sobre-acento);
  font-family:var(--display);font-weight:800;font-stretch:105%;
  font-size:15px;letter-spacing:.06em;text-transform:uppercase;
  box-shadow:0 10px 0 -4px rgba(0,0,0,.18);
  transition:transform .22s cubic-bezier(.2,.8,.2,1),box-shadow .22s;
}
.btn svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;transition:transform .22s}
.btn:hover{transform:translateY(-3px);box-shadow:0 14px 0 -4px rgba(0,0,0,.22)}
.btn:hover svg{transform:translateX(5px)}
.btn:focus-visible{outline:3px solid var(--acento);outline-offset:4px}
.btn-grande{padding:21px 40px;font-size:17px}
.btn-inverso{background:var(--fundo);color:var(--tinta)}

/* ---------- faixa de oferta ---------- */
.oferta{
  background:var(--acento);color:var(--sobre-acento);
  padding:15px 0;overflow:hidden;white-space:nowrap;
  border-top:1px solid rgba(0,0,0,.12);border-bottom:1px solid rgba(0,0,0,.12);
}
.oferta ul{display:inline-flex;gap:52px;padding-right:52px;list-style:none;animation:desliza 26s linear infinite}
.oferta li{
  font-family:var(--display);font-weight:800;font-stretch:108%;
  font-size:14px;letter-spacing:.16em;text-transform:uppercase;
  display:flex;align-items:center;gap:52px;
}
.oferta li::after{content:'◆';font-size:9px;opacity:.6}
@keyframes desliza{to{transform:translateX(-50%)}}

/* ---------- faixas de conteúdo ---------- */
.faixa{padding:clamp(64px,9vw,124px) 0;position:relative}
.faixa.alt{background:var(--superficie)}
.titulo-secao{
  font-family:var(--display);font-weight:800;font-stretch:106%;
  font-size:clamp(1.9rem,4.2vw,3.1rem);line-height:1.04;letter-spacing:-.02em;
  text-wrap:balance;
}
.titulo-secao.centro{margin:0 auto clamp(38px,5vw,58px);max-width:22ch}

.editorial{display:grid;gap:clamp(24px,4vw,56px);align-items:start}
@media(min-width:861px){
  .editorial{grid-template-columns:5fr 7fr}
  .editorial .titulo-secao{position:sticky;top:52px}
}
.corpo p{font-size:clamp(1.08rem,1.9vw,1.32rem);line-height:1.72;color:var(--suave)}
.corpo.capitular p::first-letter{
  float:left;font-family:var(--display);font-weight:900;font-stretch:112%;
  font-size:4.1em;line-height:.78;margin:.06em .12em 0 0;color:var(--acento);
}

/* ---------- cartões ---------- */
.cartoes{list-style:none;counter-reset:c;display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(248px,1fr))}
.cartoes li{
  counter-increment:c;position:relative;isolation:isolate;overflow:hidden;
  background:var(--fundo);border:1px solid var(--linha);border-radius:14px;
  padding:34px 26px 30px;transition:transform .3s cubic-bezier(.2,.8,.2,1),border-color .3s;
}
.cartoes li::before{
  content:counter(c,decimal-leading-zero);position:absolute;top:-14px;right:8px;z-index:-1;
  font-family:var(--display);font-weight:900;font-size:6.4rem;
  line-height:1;color:var(--acento);opacity:.14;
}
.cartoes li:hover{transform:translateY(-6px);border-color:var(--acento)}
.cartoes h3{
  font-family:var(--display);font-weight:800;font-stretch:104%;
  font-size:1.18rem;line-height:1.25;letter-spacing:-.01em;margin-bottom:9px;
}
.cartoes p{font-size:1rem;line-height:1.6;color:var(--suave)}

/* ---------- dúvidas ---------- */
.estreito{max-width:820px}
.duvidas{border-top:1px solid var(--linha)}
.duvidas details{border-bottom:1px solid var(--linha)}
.duvidas summary{
  list-style:none;cursor:pointer;display:flex;align-items:center;gap:18px;
  padding:24px 0;font-family:var(--display);font-weight:700;font-stretch:104%;
  font-size:clamp(1.02rem,2vw,1.2rem);line-height:1.35;transition:color .2s;
}
.duvidas summary::-webkit-details-marker{display:none}
.duvidas summary::after{
  content:'+';margin-left:auto;flex:none;
  font-family:var(--display);font-weight:400;font-size:1.7rem;line-height:1;
  color:var(--acento);transition:transform .28s cubic-bezier(.2,.8,.2,1);
}
.duvidas details[open] summary::after{transform:rotate(45deg)}
.duvidas summary:hover{color:var(--acento)}
.duvidas summary:focus-visible{outline:2px solid var(--acento);outline-offset:3px}
.duvidas details p{padding:0 46px 26px 0;color:var(--suave);font-size:1.05rem;line-height:1.7}

/* ---------- depoimento ---------- */
.depoimento{position:relative;text-align:center;padding-top:26px}
.depoimento::before{
  content:'\\201C';position:absolute;top:-26px;left:50%;transform:translateX(-50%);
  font-family:var(--display);font-weight:900;font-size:8rem;line-height:1;
  color:var(--acento);opacity:.2;
}
.depoimento blockquote{
  font-size:clamp(1.3rem,3.2vw,2rem);line-height:1.45;font-style:italic;
  text-wrap:balance;max-width:24ch;margin:0 auto;
}
.depoimento figcaption{margin-top:26px}
.depoimento figcaption strong{
  display:block;font-family:var(--display);font-weight:800;font-size:14px;
  letter-spacing:.12em;text-transform:uppercase;
}
.depoimento figcaption span{display:block;margin-top:4px;font-size:14px;color:var(--suave)}

/* ---------- fechamento ---------- */
.fechamento{
  background:var(--inverso);color:var(--sobre-inverso);
  padding:clamp(76px,11vw,150px) 0;position:relative;overflow:hidden;
}
.fechamento::before{
  content:'';position:absolute;left:50%;top:-46%;width:min(130vw,1100px);aspect-ratio:1;
  transform:translateX(-50%);border-radius:50%;
  background:radial-gradient(circle,var(--acento) 0%,transparent 62%);opacity:.2;
}
.fechamento .miolo{position:relative}
.chamada{
  font-family:var(--display);font-weight:900;font-stretch:112%;
  font-size:clamp(2.1rem,5.6vw,4.2rem);line-height:1;letter-spacing:-.028em;
  text-wrap:balance;max-width:18ch;margin:0 auto clamp(30px,4vw,44px);
}
.fechamento .btn-inverso{background:var(--acento);color:var(--sobre-acento)}

/* ---------- barra fixa (mobile) ---------- */
.barra{
  position:fixed;left:0;right:0;bottom:0;z-index:10;
  display:flex;align-items:center;gap:14px;
  padding:12px 16px calc(12px + env(safe-area-inset-bottom));
  background:var(--fundo);border-top:1px solid var(--linha);
  box-shadow:0 -8px 30px rgba(0,0,0,.13);
}
.barra .resumo{flex:1;min-width:0}
.barra .resumo strong{display:block;font-family:var(--display);font-weight:800;font-size:13px;letter-spacing:.04em;text-transform:uppercase}
.barra .resumo span{display:block;font-size:12.5px;color:var(--suave);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.barra .btn{padding:14px 20px;font-size:13px;white-space:nowrap}
@media(min-width:861px){.barra{display:none}}

/* ---------- figura ---------- */
.figura figure{margin:0}
.figura img{
  display:block;width:100%;height:auto;aspect-ratio:16/9;object-fit:cover;
  border-radius:18px;background:var(--superficie);
}
.figura figcaption{
  margin-top:14px;font-size:14.5px;line-height:1.5;color:var(--suave);
  text-align:center;font-style:italic;
}

/* ---------- rodapé ---------- */
/* Navy da marca, não a cor do tema: o rodapé é assinatura da Relm, e assinatura
   não muda de cor a cada campanha. Ver .claude/skills/relm-landing-design. */
footer{
  background:#0E1F40;padding:clamp(44px,6vw,64px) 0;text-align:center;
  font-size:14px;color:rgba(255,255,255,.66);
}
footer strong{
  display:block;font-family:var(--display);font-weight:900;
  font-size:13px;letter-spacing:.22em;text-transform:uppercase;color:#fff;margin-bottom:8px;
}
footer .loja-assina{
  display:block;margin-top:18px;padding-top:18px;font-size:13px;
  border-top:1px solid rgba(255,255,255,.14);color:rgba(255,255,255,.52);
}

/* ---------- entrada ---------- */
/* No herói o relógio é o gatilho certo: ele já está na tela quando a página abre. */
@keyframes surge{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
.heroi .chapeu,.heroi h1,.heroi .isca,.heroi .acoes{animation:surge .85s cubic-bezier(.2,.8,.2,1) both}
.heroi h1{animation-delay:.08s}
.heroi .isca{animation-delay:.18s}
.heroi .acoes{animation-delay:.28s}

/* Abaixo da dobra o gatilho é o scroll. Com animation-delay, as seções
   terminavam de animar antes de o visitante chegar nelas — ninguém via a
   entrada. A classe js-revelar só existe se o script rodar: sem JS o conteúdo
   nasce visível e continua visível. */
.js-revelar .faixa,.js-revelar .fechamento,.js-revelar .cartoes li{
  opacity:0;transform:translateY(22px);
  transition:opacity .7s cubic-bezier(.2,.8,.2,1),transform .7s cubic-bezier(.2,.8,.2,1);
  transition-delay:var(--atraso,0ms);
}
.js-revelar .visivel{opacity:1;transform:none}

@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto}
  .js-revelar .faixa,.js-revelar .fechamento,.js-revelar .cartoes li{opacity:1;transform:none}
}
</style>
<script>
/* Orçamento de movimento da landing: isto, e nada além. Sem biblioteca, sem
   request externo. Roda no head para marcar o html antes da primeira pintura —
   marcar depois faria a seção aparecer e sumir. */
(function(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  if(!('IntersectionObserver' in window))return;
  document.documentElement.className+=' js-revelar';
  addEventListener('DOMContentLoaded',function(){
    var o=new IntersectionObserver(function(itens){
      itens.forEach(function(i){
        if(i.isIntersecting){i.target.classList.add('visivel');o.unobserve(i.target)}
      });
    },{rootMargin:'0px 0px -12% 0px'});
    document.querySelectorAll('.faixa,.fechamento,.cartoes li').forEach(function(el){o.observe(el)});
  });
})();
</script>
</head>
<body>

<header class="topo">
  <div class="marcas">
    <span class="marca">Relm Care+</span>
    ${
      logoLoja
        ? `<span class="risco" aria-hidden="true"></span>
    <img class="logo-loja" src="${esc(logoLoja)}" alt="${esc(loja!.tradeName)}" loading="lazy" />`
        : ''
    }
  </div>
  <span class="selo">Campanha por tempo limitado</span>
</header>

<section class="heroi">
  ${
    imagemAbsoluta
      ? `<img class="heroi-img" src="${esc(imagemAbsoluta)}" alt="" fetchpriority="high" />`
      : '<div class="heroi-fundo"></div>'
  }
  <div class="miolo">
    <p class="chapeu">${esc(pagina.titulo)}</p>
    <h1>${esc(hero?.titulo || pagina.titulo)}</h1>
    <p class="isca">${esc(hero?.subtitulo || pagina.subtitulo)}</p>
    <div class="acoes">
      ${hero ? botao(hero.ctaTexto, hero.ctaUrl, 'btn-grande') : ''}
      <a class="ancora" href="#detalhes">Ver como funciona</a>
    </div>
  </div>
</section>

<div class="oferta" aria-hidden="true">
  <ul>
    ${Array.from({ length: 8 }, () => `<li>${esc(pagina.subtitulo)}</li>`).join('')}
  </ul>
</div>

<main id="detalhes">
  ${corpo}
</main>

<footer>
  <strong>Relm Care+</strong>
  Clube de assinatura e garantias para ciclistas — Relm Bikes.
  ${loja ? `<span class="loja-assina">Campanha compartilhada por ${esc(loja.tradeName)}</span>` : ''}
</footer>

${
  destino && textoBarra
    ? `<div class="barra">
  <div class="resumo">
    <strong>${esc(pagina.titulo)}</strong>
    <span>${esc(pagina.subtitulo)}</span>
  </div>
  ${botao(textoBarra, destino, '')}
</div>`
    : ''
}

</body>
</html>`;
}
