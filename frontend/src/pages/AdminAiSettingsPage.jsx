import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdAutoAwesome, MdImage, MdSave, MdCheckCircle, MdWarning } from 'react-icons/md';
import { aiAssistantAPI } from '../services/api';
import { Card, PageHeader, Button } from '../components/ui';

/**
 * Único lugar onde se escolhe modelo. As telas de criação não perguntam — elas
 * só têm o botão Gerar. Trocar de modelo aqui vale para todo mundo.
 *
 * A lista de opções vem do backend junto com o valor atual: o catálogo é curado
 * lá, então modelo novo aparece aqui sem deploy do frontend.
 */
export default function AdminAiSettingsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    textModel: '',
    imageModel: '',
    imageQuality: 'padrao',
    tomLanding: '',
    tomEmail: '',
  });
  const [feedback, setFeedback] = useState(null);

  const { data: config, isLoading } = useQuery({
    queryKey: ['ai-config'],
    queryFn: aiAssistantAPI.getConfig,
  });

  useEffect(() => {
    if (config) {
      setForm({
        textModel: config.textModel,
        imageModel: config.imageModel,
        imageQuality: config.imageQuality,
        tomLanding: config.tomLanding || '',
        tomEmail: config.tomEmail || '',
      });
    }
  }, [config]);

  const mutation = useMutation({
    mutationFn: aiAssistantAPI.setConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-config'] });
      setFeedback({ ok: true, msg: 'Configuração salva.' });
    },
    onError: (err) =>
      setFeedback({
        ok: false,
        msg: err?.response?.data?.message || 'Não foi possível salvar.',
      }),
  });

  if (isLoading) {
    return <div className="p-6 text-slate-400">Carregando…</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inteligência Artificial"
        subtitle="Modelos usados para gerar landing pages e e-mails de campanha"
        icon={MdAutoAwesome}
      />

      <Card className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
            Modelo de texto
          </label>
          <select
            value={form.textModel}
            onChange={(e) => setForm({ ...form, textModel: e.target.value })}
            className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-slate-900 font-extrabold focus:outline-none focus:border-cyan-600 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
          >
            {(config?.textModels || []).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
            Escreve o texto e escolhe a paleta da campanha.
          </p>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
            <MdImage className="inline mb-0.5 mr-1 text-cyan-600 dark:text-cyan-400" />
            Modelo de imagem
          </label>
          <select
            value={form.imageModel}
            onChange={(e) => setForm({ ...form, imageModel: e.target.value })}
            className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-slate-900 font-extrabold focus:outline-none focus:border-cyan-600 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
          >
            {(config?.imageModels || []).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
            A conta da OpenAI precisa ter acesso ao modelo escolhido. Se a imagem
            falhar, a página é gerada mesmo assim e você pode subir uma foto.
          </p>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
            Qualidade da imagem
          </label>
          <div className="flex gap-3">
            {[
              { v: 'padrao', label: 'Padrão', hint: 'mais barata' },
              { v: 'alta', label: 'Alta', hint: 'várias vezes mais cara' },
            ].map((op) => (
              <button
                key={op.v}
                type="button"
                onClick={() => setForm({ ...form, imageQuality: op.v })}
                className={`flex-1 rounded-xl border px-4 py-3 text-left transition font-bold ${
                  form.imageQuality === op.v
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30'
                    : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                <span className="block font-bold">{op.label}</span>
                <span className="block text-xs font-medium opacity-80">{op.hint}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
            O tamanho não é configurável: vem do destino — landing page usa
            imagem horizontal, e-mail usa uma que cabe em 600px.
          </p>
        </div>

        <div className="border-t border-slate-200 pt-6 dark:border-slate-800">
          <h3 className="font-extrabold text-[#0A1929] dark:text-white text-lg">
            Tom dos especialistas
          </h3>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 font-medium">
            O que você escrever aqui é <strong>somado</strong> às regras fixas, nunca as
            substitui. Idioma, contrato dos blocos, proibição de URL inventada e a
            diferença entre Care, Care Plus e Care+ ficam no código — não dá para
            desligá-las por esta tela. Só ADMIN_RELM salva estes dois campos.
          </p>

          {[
            {
              campo: 'tomLanding',
              label: 'Landing pages',
              dica: 'Ex.: fale como mecânico de bike, não como agência. Evite superlativo.',
            },
            {
              campo: 'tomEmail',
              label: 'E-mails',
              dica: 'Ex.: assunto sempre no benefício direto, nunca em pergunta retórica.',
            },
          ].map(({ campo, label, dica }) => (
            <div key={campo} className="mt-4">
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                {label}
              </label>
              <textarea
                value={form[campo]}
                onChange={(e) => setForm({ ...form, [campo]: e.target.value })}
                rows={4}
                maxLength={2000}
                placeholder={dica}
                className="w-full rounded-xl bg-slate-50 border border-slate-300 p-3 text-sm text-slate-900 font-medium focus:outline-none focus:border-cyan-600 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
              />
              <p className="mt-1 text-xs text-slate-500 font-medium">
                {form[campo].length}/2000
              </p>
            </div>
          ))}
        </div>

        {feedback && (
          <div
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold ${
              feedback.ok
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
            }`}
          >
            {feedback.ok ? <MdCheckCircle /> : <MdWarning />}
            {feedback.msg}
          </div>
        )}

        <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending} className="flex items-center gap-2">
          <MdSave className="w-5 h-5" />
          {mutation.isPending ? 'Salvando…' : 'Salvar'}
        </Button>
      </Card>

      <Card className="p-4 text-xs text-slate-600 dark:text-slate-400 font-medium">
        A chave da API fica no <code className="text-slate-900 dark:text-slate-200 font-bold">.env</code> do
        servidor, não aqui — ela tem cobrança atrelada e backup de banco não é
        lugar para isso.
      </Card>
    </div>
  );
}
