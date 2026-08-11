import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdCampaign, MdAutoAwesome, MdOpenInNew, MdDelete, MdSave } from 'react-icons/md';
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

function Preview({ pagina }) {
  const { paleta } = pagina;
  return (
    <div
      className="rounded-xl overflow-hidden border border-slate-700"
      style={{ background: paleta.corFundo, color: paleta.corTexto }}
    >
      {pagina.imagemUrl && (
        <img src={pagina.imagemUrl} alt="" className="w-full h-48 object-cover" />
      )}
      <div className="p-6 space-y-4">
        {pagina.blocos.map((bloco, i) => (
          <div key={i}>
            {bloco.tipo === 'hero' && (
              <>
                <h2 className="text-2xl font-bold">{bloco.titulo}</h2>
                <p className="opacity-80">{bloco.subtitulo}</p>
              </>
            )}
            {bloco.tipo === 'texto' && (
              <>
                <h3 className="font-semibold">{bloco.titulo}</h3>
                <p className="opacity-80 text-sm">{bloco.corpo}</p>
              </>
            )}
            {bloco.tipo === 'lista' && (
              <>
                <h3 className="font-semibold">{bloco.titulo}</h3>
                <ul className="text-sm space-y-1 mt-1">
                  {bloco.itens.map((item, j) => (
                    <li
                      key={j}
                      style={{ borderLeft: `3px solid ${paleta.corPrimaria}` }}
                      className="pl-2"
                    >
                      <strong>{item.titulo}</strong>{' '}
                      <span className="opacity-75">{item.descricao}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {bloco.tipo === 'faq' && (
              <>
                <h3 className="font-semibold">{bloco.titulo}</h3>
                <dl className="text-sm space-y-2 mt-1">
                  {bloco.itens.map((item, j) => (
                    <div key={j}>
                      <dt className="font-semibold">{item.pergunta}</dt>
                      <dd className="opacity-75">{item.resposta}</dd>
                    </div>
                  ))}
                </dl>
              </>
            )}
            {bloco.tipo === 'prova' && (
              <figure
                className="text-sm"
                style={{ borderLeft: `3px solid ${paleta.corPrimaria}`, paddingLeft: 12 }}
              >
                <blockquote className="italic">“{bloco.citacao}”</blockquote>
                <figcaption className="opacity-75 mt-1">
                  {bloco.autor} — {bloco.papel}
                </figcaption>
              </figure>
            )}
            {bloco.tipo === 'cta' && (
              <div className="text-center pt-2">
                <p className="mb-2">{bloco.texto}</p>
                <span
                  className="inline-block px-5 py-2 rounded-lg font-semibold"
                  style={{ background: paleta.corPrimaria, color: paleta.corFundo }}
                >
                  {bloco.ctaTexto}
                </span>
              </div>
            )}
          </div>
        ))}
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

          <Preview pagina={pagina} />
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
