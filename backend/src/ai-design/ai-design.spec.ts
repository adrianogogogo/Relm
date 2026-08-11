import { PaginaGerada, paginaDeResposta, sanitizePagina, schemaDe } from './blocks.schema';
import { montarSistema, textoDosFatos } from '../ai-assistant/campanha-prompts';
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

describe('especialista de campanhas', () => {
  const bruta = {
    titulo: 'T',
    subtitulo: 'S',
    paleta: { corPrimaria: '#1B4965', corFundo: '#FFFFFF', corTexto: '#0A1929' },
    hero: { tipo: 'hero' as const, titulo: 'H', subtitulo: 'h', ctaTexto: 'Ir', ctaUrl: '/clube' },
    meio: [],
    cta: { tipo: 'cta' as const, texto: 'C', ctaTexto: 'Ir', ctaUrl: '/clube' },
  };

  const fatos = {
    plusAnnualFee: 299,
    pointValueBrl: 0.05,
    referralBonusPoints: 500,
    birthdayBonusPoints: 200,
    eventParticipationPoints: 100,
    careQuotaAnnualRevisions: 1,
    plusPointsMultiplier: 2,
    plusMonthlyPoints: 1000,
  };

  it('marca todo depoimento vindo do modelo como inventado', () => {
    const prova = { tipo: 'prova' as const, citacao: 'c', autor: 'a', papel: 'p' };
    const pagina = paginaDeResposta({ ...bruta, meio: [prova] });

    const gerado = pagina.blocos.find((b) => b.tipo === 'prova') as any;
    expect(gerado.inventado).toBe(true);
  });

  it('não deixa o hero nem o cta faltarem — são campos, não itens de array', () => {
    for (const email of [false, true]) {
      const schema = schemaDe(email, false) as any;
      expect(schema.required).toContain('hero');
      expect(schema.required).toContain('cta');
    }
  });

  it('só o schema de e-mail pede assunto e preheader', () => {
    expect((schemaDe(true, false) as any).required).toContain('email');
    expect((schemaDe(false, false) as any).required).not.toContain('email');
  });

  it('só a revisão pede notas', () => {
    expect((schemaDe(false, true) as any).required).toContain('notas');
    expect((schemaDe(false, false) as any).required).not.toContain('notas');
  });

  it('injeta os números do banco em vez de literal no prompt', () => {
    const texto = textoDosFatos({ ...fatos, plusMonthlyPoints: 777 });
    expect(texto).toContain('777 pontos por mês');
    expect(texto).toContain('R$ 299,00');
  });

  // O tom é editável em produção: se ele pudesse sobrepor o núcleo, uma edição
  // sem review apagaria a regra que separa Care de Care Plus.
  it('concatena o tom depois do núcleo, sem substituí-lo', () => {
    const sistema = montarSistema('LANDING', fatos, 'Use gírias de ciclista.');

    expect(sistema).toContain('Use gírias de ciclista.');
    expect(sistema).toContain('"Care Plus" é o plano pago');
    expect(sistema.indexOf('"Care Plus" é o plano pago')).toBeLessThan(
      sistema.indexOf('Use gírias de ciclista.'),
    );
  });

  it('dá instruções diferentes para landing e para e-mail', () => {
    const landing = montarSistema('LANDING', fatos);
    const email = montarSistema('EMAIL', fatos);

    expect(email).toContain('quatro alternativas');
    expect(landing).not.toContain('quatro alternativas');
  });
});
