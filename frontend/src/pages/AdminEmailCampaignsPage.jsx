import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdMail, MdAutoAwesome, MdDownload, MdSave } from 'react-icons/md';
import { emailCrmAPI, aiAssistantAPI } from '../services/api';
import { Card, PageHeader, Button } from '../components/ui';
import DepoimentosPendentes from '../components/DepoimentosPendentes';

/**
 * Esta tela NÃO envia e-mail. Ela gera o conteúdo e entrega o HTML pronto; o
 * disparo acontece na ferramenta de e-mail marketing, que é quem tem lista,
 * consentimento, descadastro e tratamento de bounce.
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

function baixar(filename, html) {
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function Preview({ pagina }) {
  const { paleta } = pagina;
  return (
    <div
      className="rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 mx-auto"
      style={{ background: paleta.corFundo, color: paleta.corTexto, maxWidth: 600 }}
    >
      {pagina.imagemUrl && (
        <img src={pagina.imagemUrl} alt="" className="w-full h-44 object-cover" />
      )}
      <div className="p-6 space-y-4">
        {pagina.blocos.map((bloco, i) => (
          <div key={i}>
            {bloco.tipo === 'hero' && (
              <>
                <h2 className="text-xl font-bold">{bloco.titulo}</h2>
                <p className="opacity-80 text-sm">{bloco.subtitulo}</p>
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
                <p className="mb-2 text-sm">{bloco.texto}</p>
                <span
                  className="inline-block px-5 py-2 rounded-lg font-semibold text-sm"
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

export default function AdminEmailCampaignsPage() {
  const queryClient = useQueryClient();
  const [tema, setTema] = useState('');
  const [pagina, setPagina] = useState(null);
  const [assunto, setAssunto] = useState('');
  const [preheader, setPreheader] = useState('');
  const [erro, setErro] = useState(null);

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['email-campaigns'],
    queryFn: emailCrmAPI.getCampaigns,
  });

  const gerar = useMutation({
    mutationFn: () => aiAssistantAPI.gerarPagina({ tema, destino: 'EMAIL' }),
    onSuccess: (res) => {
      setPagina(res);
      // O primeiro assunto vem pré-escolhido; os outros três ficam à mão.
      setAssunto(res.email?.assuntos?.[0] || res.titulo || tema);
      setPreheader(res.email?.preheader || '');
      setErro(null);
    },
    onError: (err) => setErro(err?.response?.data?.message || 'Falha ao gerar.'),
  });

  const salvar = useMutation({
    mutationFn: async () => {
      // bodyHtml não vai daqui: o backend renderiza a partir dos blocos.
      const template = await emailCrmAPI.createTemplate({
        name: pagina.titulo,
        slug: `${slugify(pagina.titulo || tema)}-${Date.now().toString(36)}`,
        subject: assunto,
        preheader,
        blocksJson: pagina,
      });
      return emailCrmAPI.createCampaign({
        title: pagina.titulo,
        templateId: template.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      setPagina(null);
      setTema('');
    },
    onError: (err) => setErro(err?.response?.data?.message || 'Falha ao salvar.'),
  });

  const exportar = useMutation({
    mutationFn: emailCrmAPI.exportHtml,
    onSuccess: (res) => baixar(res.filename, res.html),
    onError: (err) => setErro(err?.response?.data?.message || 'Falha ao exportar.'),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campanhas de E-mail"
        subtitle="Gere o conteúdo aqui e dispare na sua ferramenta de e-mail marketing"
        icon={MdMail}
      />

      <Card className="p-6 space-y-4">
        <textarea
          value={tema}
          onChange={(e) => setTema(e.target.value)}
          rows={3}
          placeholder="Ex.: lembrete de revisão para quem não passa na oficina há 6 meses"
          className="w-full rounded-xl bg-slate-50 border border-slate-300 p-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-cyan-600 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
        />
        <Button
          onClick={() => gerar.mutate()}
          disabled={!tema.trim() || gerar.isPending}
          className="flex items-center gap-2"
        >
          <MdAutoAwesome className="w-5 h-5" />
          {gerar.isPending ? 'Gerando…' : 'Gerar e-mail'}
        </Button>
        {erro && <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{erro}</p>}
      </Card>

      {pagina && (
        <Card className="p-6 space-y-4">
          <h3 className="font-extrabold text-[#0A1929] dark:text-white text-lg">
            Pré-visualização
          </h3>
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
            <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
              Assunto
            </label>
            {/* Quatro ângulos gerados; escolher entre alternativas é onde o
                operador agrega, escrever do zero não. O campo segue editável. */}
            {pagina.email?.assuntos?.length > 0 && (
              <div className="mb-2 space-y-1">
                {pagina.email.assuntos.map((op, i) => (
                  <button
                    key={i}
                    onClick={() => setAssunto(op)}
                    className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition ${
                      assunto === op
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-800 font-bold dark:text-emerald-300'
                        : 'border-slate-300 bg-slate-50 text-slate-700 font-medium hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {op}
                    <span
                      className={`ml-2 text-xs ${op.length > 45 ? 'text-rose-600 font-bold' : 'opacity-60'}`}
                    >
                      {op.length} car.
                    </span>
                  </button>
                ))}
              </div>
            )}
            <input
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-sm text-slate-900 font-bold dark:bg-slate-900 dark:border-slate-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
              Preheader
            </label>
            <input
              value={preheader}
              onChange={(e) => setPreheader(e.target.value)}
              placeholder="Continua o assunto na caixa de entrada, sem repeti-lo"
              className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-sm text-slate-900 font-medium dark:bg-slate-900 dark:border-slate-700 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => salvar.mutate()}
              disabled={!assunto.trim() || salvar.isPending}
              className="flex items-center gap-2"
            >
              <MdSave className="w-5 h-5" />
              {salvar.isPending ? 'Salvando…' : 'Salvar campanha'}
            </Button>
            <Button variant="secondary" onClick={() => setPagina(null)}>
              Descartar
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="font-extrabold text-[#0A1929] dark:text-white text-lg mb-4">
          Campanhas salvas
        </h3>
        {isLoading ? (
          <p className="text-slate-500 font-medium">Carregando…</p>
        ) : campaigns.length === 0 ? (
          <p className="text-slate-500 font-medium text-sm">Nenhuma campanha ainda.</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {campaigns.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-3 gap-4">
                <div className="min-w-0">
                  <p className="text-slate-900 dark:text-slate-100 font-bold text-base truncate">
                    {c.title}
                  </p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                    {c.template?.subject}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => exportar.mutate(c.id)}
                  disabled={exportar.isPending}
                  className="flex items-center gap-2 shrink-0"
                >
                  <MdDownload className="w-5 h-5" />
                  Baixar HTML
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-4 text-xs text-slate-600 dark:text-slate-400 font-medium">
        A plataforma não dispara e-mail em massa. O transporte configurado é o
        SMTP usado pelos e-mails transacionais (redefinição de senha, aprovação de
        loja) — disparar marketing por ele derrubaria os dois.
      </Card>
    </div>
  );
}
