import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MdCampaign,
  MdAutoAwesome,
  MdOpenInNew,
  MdDelete,
  MdSave,
  MdDesktopWindows,
  MdTabletMac,
  MdPhoneIphone,
  MdFullscreen,
  MdFullscreenExit,
  MdImage,
} from 'react-icons/md';
import { marketingAPI, aiAssistantAPI } from '../services/api';
import { Card, PageHeader, Button } from '../components/ui';
import DepoimentosPendentes from '../components/DepoimentosPendentes';

/**
 * Sem seletor de modelo: ele vive em Configurações > IA. Aqui só se descreve a
 * campanha e se clica em Gerar.
 */
function slugify(texto) {
  return String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function IframePreview({ pagina }) {
  const [device, setDevice] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    marketingAPI
      .previewHtml(pagina)
      .then((res) => {
        if (active) setHtml(res.html);
      })
      .catch((err) => {
        console.error('Erro ao renderizar preview:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [pagina]);

  const deviceWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '390px',
  };

  return (
    <div
      className={`space-y-3 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md p-6 flex flex-col'
          : ''
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-2.5 px-4 text-white shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Dispositivo:
          </span>
          <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
            <button
              type="button"
              onClick={() => setDevice('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition ${
                device === 'desktop'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MdDesktopWindows className="w-4 h-4" /> Desktop
            </button>
            <button
              type="button"
              onClick={() => setDevice('tablet')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition ${
                device === 'tablet'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MdTabletMac className="w-4 h-4" /> Tablet
            </button>
            <button
              type="button"
              onClick={() => setDevice('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition ${
                device === 'mobile'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MdPhoneIphone className="w-4 h-4" /> Mobile
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {pagina?.imagemUrl && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <MdImage className="w-3.5 h-3.5" /> Foto inclusa
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-1 text-xs font-bold text-slate-300 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg transition"
            title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
          >
            {isFullscreen ? (
              <MdFullscreenExit className="w-5 h-5" />
            ) : (
              <MdFullscreen className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      <div
        className={`w-full flex justify-center items-center overflow-hidden rounded-xl bg-slate-950 border border-slate-800 transition-all p-3 shadow-inner ${
          isFullscreen ? 'flex-1 h-full' : 'h-[620px]'
        }`}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 text-slate-400 text-sm font-medium">
            <div className="w-7 h-7 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Renderizando Landing Page em alta fidelidade...</span>
          </div>
        ) : (
          <div
            className="h-full transition-all duration-300 ease-out shadow-2xl rounded-lg overflow-hidden border border-slate-800 bg-white"
            style={{ width: deviceWidths[device], maxWidth: '100%' }}
          >
            <iframe
              title="Landing Page Preview"
              srcDoc={html}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminLandingPagesPage() {
  const queryClient = useQueryClient();
  const [tema, setTema] = useState('');
  const [pagina, setPagina] = useState(null);
  const [slug, setSlug] = useState('');
  const [erro, setErro] = useState(null);

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ['landing-pages'],
    queryFn: marketingAPI.getAll,
  });

  const gerar = useMutation({
    mutationFn: () => aiAssistantAPI.gerarPagina({ tema, destino: 'LANDING' }),
    onSuccess: (res) => {
      setPagina(res);
      setSlug(slugify(res.titulo || tema));
      setErro(null);
    },
    onError: (err) => setErro(err?.response?.data?.message || 'Falha ao gerar.'),
  });

  const salvar = useMutation({
    mutationFn: () =>
      marketingAPI.create({
        title: pagina.titulo,
        slug,
        description: pagina.subtitulo,
        blocksJson: pagina,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
      setPagina(null);
      setTema('');
    },
    onError: (err) => setErro(err?.response?.data?.message || 'Falha ao salvar.'),
  });

  const remover = useMutation({
    mutationFn: marketingAPI.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['landing-pages'] }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Landing Pages"
        subtitle="Descreva a campanha; a IA monta a página e a paleta"
        icon={MdCampaign}
      />

      <Card className="p-6 space-y-4">
        <textarea
          value={tema}
          onChange={(e) => setTema(e.target.value)}
          rows={3}
          placeholder="Ex.: campanha de revisão de inverno com 20% de desconto para membros Plus"
          className="w-full rounded-xl bg-slate-50 border border-slate-300 p-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-cyan-600 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
        />
        <Button onClick={() => gerar.mutate()} disabled={!tema.trim() || gerar.isPending} className="flex items-center gap-2">
          <MdAutoAwesome className="w-5 h-5" />
          {gerar.isPending ? 'Gerando…' : 'Gerar página'}
        </Button>
        {erro && <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{erro}</p>}
      </Card>

      {pagina && (
        <Card className="p-6 space-y-4">
          <h3 className="font-extrabold text-[#0A1929] dark:text-white text-lg">Pré-visualização</h3>

          {pagina.notas?.length > 0 && (
            <div className="rounded-xl border border-sky-300 bg-sky-50 p-4 dark:border-sky-800 dark:bg-sky-950/40">
              <p className="text-sm font-bold text-sky-900 dark:text-sky-200">
                A revisão ajustou {pagina.notas.length}{' '}
                {pagina.notas.length === 1 ? 'ponto' : 'pontos'}
              </p>
              <ul className="mt-2 space-y-1 text-sm text-sky-900/85 dark:text-sky-200/85 list-disc pl-5">
                {pagina.notas.map((nota, i) => (
                  <li key={i}>{nota}</li>
                ))}
              </ul>
            </div>
          )}

          <DepoimentosPendentes pagina={pagina} onChange={setPagina} />

          <IframePreview pagina={pagina} />
          <div>
            <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Endereço da página</label>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-bold text-sm">/lp/</span>
              <input
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                className="flex-1 rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-sm text-slate-900 font-bold dark:bg-slate-900 dark:border-slate-700 dark:text-white"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => salvar.mutate()} disabled={!slug || salvar.isPending} className="flex items-center gap-2">
              <MdSave className="w-5 h-5" />
              {salvar.isPending ? 'Publicando…' : 'Publicar'}
            </Button>
            <Button variant="secondary" onClick={() => setPagina(null)}>
              Descartar
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="font-extrabold text-[#0A1929] dark:text-white text-lg mb-4">Páginas publicadas</h3>
        {isLoading ? (
          <p className="text-slate-500 font-medium">Carregando…</p>
        ) : pages.length === 0 ? (
          <p className="text-slate-500 font-medium text-sm">Nenhuma página ainda.</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {pages.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-slate-900 dark:text-slate-100 font-bold text-base">{p.title}</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    /lp/{p.slug} · {p.viewCount} visualizações
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/lp/${p.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition"
                    title="Abrir"
                  >
                    <MdOpenInNew className="w-5 h-5" />
                  </a>
                  <button
                    onClick={() => remover.mutate(p.id)}
                    className="p-2 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition"
                    title="Excluir"
                  >
                    <MdDelete className="w-5 h-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
