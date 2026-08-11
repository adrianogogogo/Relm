import { Bloco, PaginaGerada, esc } from './blocks.schema';

/**
 * Terceiro consumidor do mesmo contrato de blocos, agora para navegador.
 *
 * Diferente do renderizador de e-mail, aqui CSS moderno é permitido — o veto do
 * Outlook não vale. O que este arquivo existe para resolver e o React não
 * resolvia: as meta tags OG. Robô de WhatsApp e Facebook não executa JavaScript,
 * então uma SPA devolve sempre o mesmo card genérico, qualquer que seja a página.
 */

function botao(texto: string, url: string, cor: string, corTexto: string): string {
  return `<a class="btn" href="${esc(url)}" style="background:${cor};color:${corTexto};">${esc(texto)}</a>`;
}

function renderBloco(bloco: Bloco, p: PaginaGerada): string {
  const { corPrimaria, corFundo } = p.paleta;

  switch (bloco.tipo) {
    case 'hero':
      return `<section class="hero">
  ${p.imagemUrl ? `<img class="hero-img" src="${esc(p.imagemUrl)}" alt="" />` : ''}
  <h1>${esc(bloco.titulo)}</h1>
  <p class="lead">${esc(bloco.subtitulo)}</p>
  ${botao(bloco.ctaTexto, bloco.ctaUrl, corPrimaria, corFundo)}
</section>`;

    case 'texto':
      return `<section>
  <h2>${esc(bloco.titulo)}</h2>
  <p>${esc(bloco.corpo)}</p>
</section>`;

    case 'lista':
      return `<section>
  <h2>${esc(bloco.titulo)}</h2>
  <ul class="itens">
    ${bloco.itens
      .map(
        (item) => `<li style="border-left-color:${corPrimaria};">
      <strong>${esc(item.titulo)}</strong>
      <span>${esc(item.descricao)}</span>
    </li>`,
      )
      .join('\n    ')}
  </ul>
</section>`;

    case 'cta':
      return `<section class="cta">
  <p class="lead">${esc(bloco.texto)}</p>
  ${botao(bloco.ctaTexto, bloco.ctaUrl, corPrimaria, corFundo)}
</section>`;
  }
}

/**
 * `baseUrl` precisa ser absoluto: og:image relativo é ignorado por todo
 * crawler, e o card sai sem imagem mesmo com a imagem existindo.
 */
export function renderLanding(pagina: PaginaGerada, baseUrl = ''): string {
  const { corPrimaria, corFundo, corTexto } = pagina.paleta;
  const imagemAbsoluta = pagina.imagemUrl?.startsWith('/')
    ? `${baseUrl}${pagina.imagemUrl}`
    : pagina.imagemUrl;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(pagina.titulo)} — Relm Care+</title>
<meta name="description" content="${esc(pagina.subtitulo)}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${esc(pagina.titulo)}" />
<meta property="og:description" content="${esc(pagina.subtitulo)}" />
<meta property="og:site_name" content="Relm Care+" />
${imagemAbsoluta ? `<meta property="og:image" content="${esc(imagemAbsoluta)}" />` : ''}
<meta name="twitter:card" content="${imagemAbsoluta ? 'summary_large_image' : 'summary'}" />
<style>
*{box-sizing:border-box}
body{margin:0;background:${corFundo};color:${corTexto};font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;line-height:1.6}
main{max-width:760px;margin:0 auto;padding:0 20px 64px}
header{padding:20px;text-align:center;font-weight:800;letter-spacing:.08em;font-size:14px;opacity:.7}
section{padding:28px 0}
h1{font-size:clamp(28px,6vw,44px);line-height:1.15;margin:0 0 12px}
h2{font-size:clamp(20px,4vw,26px);margin:0 0 10px}
p{margin:0 0 8px}
.lead{font-size:clamp(16px,2.6vw,19px);opacity:.85}
.hero,.cta{text-align:center}
.hero-img{display:block;width:100%;height:auto;border-radius:14px;margin:0 auto 24px}
.btn{display:inline-block;margin-top:20px;padding:14px 32px;border-radius:10px;font-weight:700;text-decoration:none}
.itens{list-style:none;padding:0;margin:0;display:grid;gap:14px}
.itens li{border-left:3px solid;padding-left:14px}
.itens strong{display:block}
.itens span{opacity:.85}
footer{text-align:center;padding:32px 20px;font-size:13px;opacity:.6}
</style>
</head>
<body>
<header>RELM CARE+</header>
<main>
${pagina.blocos.map((bloco) => renderBloco(bloco, { ...pagina, imagemUrl: imagemAbsoluta })).join('\n')}
</main>
<footer>Relm Bikes — clube de assinatura e garantias para ciclistas.</footer>
</body>
</html>`;
}
