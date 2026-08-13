import { Bloco, PaginaGerada, esc } from './blocks.schema';

/**
 * Segundo renderizador do mesmo contrato de blocos: tabela + CSS inline, que é
 * o que cliente de e-mail entende. Outlook ignora flexbox, grid, `<style>` no
 * head e metade do CSS moderno — por isso nada disso aparece aqui.
 *
 * Largura fixa em 600px porque é o teto seguro no painel de leitura do Outlook.
 */

function botao(texto: string, url: string, cor: string): string {
  // Botão como tabela, não <a> com padding: Outlook não respeita padding em
  // elemento inline, e o retângulo clicável some.
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px auto;">
  <tr><td align="center" bgcolor="${cor}" style="border-radius:8px;">
    <a href="${esc(url)}" style="display:inline-block;padding:14px 32px;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;">${esc(texto)}</a>
  </td></tr>
</table>`;
}

function renderBloco(bloco: Bloco, p: PaginaGerada): string {
  const { corPrimaria, corTexto } = p.paleta;
  const base = `font-family:Arial,sans-serif;color:${corTexto};`;

  switch (bloco.tipo) {
    case 'hero':
      return `<tr><td style="padding:40px 32px 8px 32px;text-align:center;">
  ${p.imagemUrl ? `<img src="${esc(p.imagemUrl)}" width="536" style="display:block;width:100%;max-width:536px;height:auto;border-radius:8px;margin:0 auto 20px auto;" alt="" />` : ''}
  <h1 style="${base}font-size:30px;line-height:1.25;margin:0 0 12px 0;">${esc(bloco.titulo)}</h1>
  <p style="${base}font-size:17px;line-height:1.5;margin:0;opacity:0.85;">${esc(bloco.subtitulo)}</p>
  ${botao(bloco.ctaTexto, bloco.ctaUrl, corPrimaria)}
</td></tr>`;

    case 'texto':
      return `<tr><td style="padding:16px 32px;">
  <h2 style="${base}font-size:21px;margin:0 0 8px 0;">${esc(bloco.titulo)}</h2>
  <p style="${base}font-size:16px;line-height:1.6;margin:0;">${esc(bloco.corpo)}</p>
</td></tr>`;

    case 'lista':
      return `<tr><td style="padding:16px 32px;">
  <h2 style="${base}font-size:21px;margin:0 0 12px 0;">${esc(bloco.titulo)}</h2>
  ${bloco.itens
    .map(
      (item) => `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:12px;">
    <tr><td style="border-left:3px solid ${corPrimaria};padding-left:12px;">
      <strong style="${base}font-size:16px;">${esc(item.titulo)}</strong><br/>
      <span style="${base}font-size:15px;line-height:1.5;opacity:0.85;">${esc(item.descricao)}</span>
    </td></tr>
  </table>`,
    )
    .join('\n  ')}
</td></tr>`;

    // Sem <details> aqui: cliente de e-mail não abre acordeão. Vira pergunta em
    // negrito com a resposta abaixo. O schema de e-mail nem gera faq — este
    // caso existe para o template salvo a partir de uma landing.
    case 'faq':
      return `<tr><td style="padding:16px 32px;">
  <h2 style="${base}font-size:21px;margin:0 0 12px 0;">${esc(bloco.titulo)}</h2>
  ${bloco.itens
    .map(
      (item) => `<p style="${base}font-size:15px;line-height:1.55;margin:0 0 12px 0;">
    <strong>${esc(item.pergunta)}</strong><br/>
    <span style="opacity:0.85;">${esc(item.resposta)}</span>
  </p>`,
    )
    .join('\n  ')}
</td></tr>`;

    case 'prova':
      return `<tr><td style="padding:20px 32px;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr><td style="border-left:4px solid ${corPrimaria};padding:6px 0 6px 16px;">
      <p style="${base}font-size:17px;line-height:1.55;font-style:italic;margin:0 0 10px 0;">“${esc(bloco.citacao)}”</p>
      <strong style="${base}font-size:14px;">${esc(bloco.autor)}</strong>
      <span style="${base}font-size:14px;opacity:0.7;"> — ${esc(bloco.papel)}</span>
    </td></tr>
  </table>
</td></tr>`;

    case 'cta':
      return `<tr><td style="padding:24px 32px 40px 32px;text-align:center;">
  <p style="${base}font-size:18px;line-height:1.5;margin:0;">${esc(bloco.texto)}</p>
  ${botao(bloco.ctaTexto, bloco.ctaUrl, corPrimaria)}
</td></tr>`;
  }
}

/**
 * `baseUrl` não é opcional na prática: cliente de e-mail não resolve caminho
 * relativo, então uma imagem em "/uploads/..." simplesmente não aparece. Fica
 * com default vazio só para o caso sem imagem.
 */
export function renderEmail(entrada: PaginaGerada, baseUrl = ''): string {
  const pagina: PaginaGerada = {
    ...entrada,
    imagemUrl: entrada.imagemUrl?.startsWith('/')
      ? `${baseUrl}${entrada.imagemUrl}`
      : entrada.imagemUrl,
  };
  const { corFundo, corTexto } = pagina.paleta;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(pagina.titulo)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;">
  ${
    pagina.email?.preheader
      ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f4f4f4;">${esc(pagina.email.preheader)}</div>`
      : ''
  }
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f4f4;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:100%;background-color:${corFundo};border-radius:12px;overflow:hidden;color:${corTexto};">
<!-- Faixa da marca, sempre no navy Relm e nunca na cor do tema: na caixa de
     entrada a peca disputa atencao com dezenas de outras, e quem identifica o
     remetente e a marca, nao a paleta da campanha do mes. Ver a skill
     .claude/skills/relm-landing-design, secao 1. -->
<tr><td style="background-color:#0E1F40;padding:18px 32px;">
  <span style="font-family:Arial,Helvetica,sans-serif;font-weight:bold;font-size:14px;letter-spacing:2.5px;text-transform:uppercase;color:#ffffff;">Relm Care+</span>
</td></tr>
${pagina.blocos.map((bloco) => renderBloco(bloco, pagina)).join('\n')}
      </table>
      <p style="font-family:Arial,sans-serif;font-size:12px;color:#888888;margin:16px 0 0 0;">
        Relm Bikes — você recebe este e-mail porque faz parte do clube Relm Care.
      </p>
    </td></tr>
  </table>
</body>
</html>`;
}
