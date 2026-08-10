import { PaginaGerada, sanitizePagina } from './blocks.schema';
import { renderEmail } from './email-renderer';

function pagina(overrides: Partial<PaginaGerada> = {}): PaginaGerada {
  return {
    titulo: 'Campanha de inverno',
    subtitulo: 'Pedale no frio',
    paleta: { corPrimaria: '#1B4965', corFundo: '#FFFFFF', corTexto: '#0A1929' },
    blocos: [
      {
        tipo: 'hero',
        titulo: 'Inverno na trilha',
        subtitulo: 'Revisão inclusa antes da temporada',
        ctaTexto: 'Quero o Care Plus',
        ctaUrl: '/clube',
      },
    ],
    ...overrides,
  };
}

describe('sanitizePagina — fronteira entre modelo e navegador', () => {
  it('derruba href que não é http(s) nem caminho relativo', () => {
    const suja = pagina({
      blocos: [
        {
          tipo: 'cta',
          texto: 'Clique',
          ctaTexto: 'Ir',
          ctaUrl: 'javascript:alert(document.cookie)',
        },
      ],
    });
    const limpa = sanitizePagina(suja);
    expect((limpa.blocos[0] as any).ctaUrl).toBe('#');
  });

  it('mantém https e caminho relativo', () => {
    const limpa = sanitizePagina(
      pagina({
        blocos: [
          { tipo: 'cta', texto: 'a', ctaTexto: 'b', ctaUrl: 'https://relmbikes.com.br' },
          { tipo: 'cta', texto: 'c', ctaTexto: 'd', ctaUrl: '/clube' },
        ],
      }),
    );
    expect((limpa.blocos[0] as any).ctaUrl).toBe('https://relmbikes.com.br');
    expect((limpa.blocos[1] as any).ctaUrl).toBe('/clube');
  });

  it('cor que não é hex vira o default em vez de entrar no style', () => {
    const limpa = sanitizePagina(
      pagina({
        paleta: {
          corPrimaria: 'red; background:url(javascript:1)',
          corFundo: '#FFFFFF',
          corTexto: '#000000',
        },
      }),
    );
    expect(limpa.paleta.corPrimaria).toBe('#2196F3');
  });

  it('paleta ausente não estoura', () => {
    const limpa = sanitizePagina({ ...pagina(), paleta: undefined as any });
    expect(limpa.paleta.corFundo).toBe('#FFFFFF');
  });
});

describe('renderEmail', () => {
  it('escapa conteúdo do modelo — nada de tag injetada no corpo', () => {
    const html = renderEmail(
      pagina({
        blocos: [
          { tipo: 'texto', titulo: '<script>alert(1)</script>', corpo: 'ok & bom' },
        ],
      }),
    );
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('ok &amp; bom');
  });

  it('usa tabela e CSS inline — sem flexbox, sem <style> no head', () => {
    // Outlook ignora os dois; se aparecerem, o layout quebra só na caixa do
    // cliente, onde ninguém testa.
    const html = renderEmail(pagina());
    expect(html).toContain('<table');
    expect(html).not.toContain('display:flex');
    expect(html).not.toContain('<style');
  });

  it('renderiza cada tipo de bloco', () => {
    const html = renderEmail(
      pagina({
        blocos: [
          { tipo: 'hero', titulo: 'H', subtitulo: 'S', ctaTexto: 'C', ctaUrl: '/x' },
          { tipo: 'texto', titulo: 'T', corpo: 'B' },
          { tipo: 'lista', titulo: 'L', itens: [{ titulo: 'I1', descricao: 'D1' }] },
          { tipo: 'cta', texto: 'P', ctaTexto: 'Go', ctaUrl: '/y' },
        ],
      }),
    );
    for (const esperado of ['H', 'T', 'I1', 'D1', 'Go']) {
      expect(html).toContain(esperado);
    }
  });

  it('aplica a paleta gerada, não uma cor fixa', () => {
    const html = renderEmail(pagina());
    expect(html).toContain('#1B4965');
  });
});
