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
  const [form, setForm] = useState({ textModel: '', imageModel: '', imageQuality: 'padrao' });
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
          <label className="block text-sm font-semibold text-slate-200 mb-2">
            Modelo de texto
          </label>
          <select
            value={form.textModel}
            onChange={(e) => setForm({ ...form, textModel: e.target.value })}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100"
          >
            {(config?.textModels || []).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <p className="mt-2 text-xs text-slate-400">
            Escreve o texto e escolhe a paleta da campanha.
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-2">
            <MdImage className="inline mb-0.5 mr-1" />
            Modelo de imagem
          </label>
          <select
            value={form.imageModel}
            onChange={(e) => setForm({ ...form, imageModel: e.target.value })}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100"
          >
            {(config?.imageModels || []).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <p className="mt-2 text-xs text-slate-400">
            A conta da OpenAI precisa ter acesso ao modelo escolhido. Se a imagem
            falhar, a página é gerada mesmo assim e você pode subir uma foto.
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-2">
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
                className={`flex-1 rounded-lg border px-4 py-3 text-left transition ${
                  form.imageQuality === op.v
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-700 bg-slate-800 text-slate-300'
                }`}
              >
                <span className="block font-semibold">{op.label}</span>
                <span className="block text-xs opacity-70">{op.hint}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            O tamanho não é configurável: vem do destino — landing page usa
            imagem horizontal, e-mail usa uma que cabe em 600px.
          </p>
        </div>

        {feedback && (
          <div
            className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
              feedback.ok
                ? 'bg-emerald-500/10 text-emerald-300'
                : 'bg-red-500/10 text-red-300'
            }`}
          >
            {feedback.ok ? <MdCheckCircle /> : <MdWarning />}
            {feedback.msg}
          </div>
        )}

        <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending}>
          <MdSave className="mr-2" />
          {mutation.isPending ? 'Salvando…' : 'Salvar'}
        </Button>
      </Card>

      <Card className="p-4 text-xs text-slate-400">
        A chave da API fica no <code className="text-slate-300">.env</code> do
        servidor, não aqui — ela tem cobrança atrelada e backup de banco não é
        lugar para isso.
      </Card>
    </div>
  );
}
