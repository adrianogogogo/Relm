import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdRule, MdAdd, MdDelete, MdCheckCircle, MdWarning } from 'react-icons/md';
import { pointsAPI, productsAPI, clubSettingsAPI } from '../services/api';
import { Card, PageHeader, Button } from '../components/ui';

const MODE_LABEL = {
  FIXO: 'pts por unidade',
  POR_REAL: 'pts por R$ do subtotal',
};

export default function AdminPointsRulesPage() {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState(null);
  const [form, setForm] = useState({ target: 'PRODUCT', productId: '', productType: '', mode: 'FIXO', value: '' });

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['points-rules'],
    queryFn: pointsAPI.listRules,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => productsAPI.getAll(),
  });

  const { data: settings } = useQuery({
    queryKey: ['club-settings-admin'],
    queryFn: clubSettingsAPI.get,
  });

  // Categoria é String livre no Product — a lista de opções sai do que já
  // está cadastrado, senão a regra é criada com um texto que nunca casa.
  const productTypes = Array.from(
    new Set(products.map((p) => p.productType).filter(Boolean)),
  ).sort();

  const show = (type, text) => {
    setFeedback({ type, text });
    if (type === 'success') setTimeout(() => setFeedback(null), 4000);
  };

  const done = (text) => () => {
    queryClient.invalidateQueries({ queryKey: ['points-rules'] });
    show('success', text);
  };
  const fail = (err) =>
    show('error', err.response?.data?.message || 'Não foi possível salvar a regra.');

  const createMutation = useMutation({
    mutationFn: pointsAPI.createRule,
    onSuccess: () => {
      setForm({ target: 'PRODUCT', productId: '', productType: '', mode: 'FIXO', value: '' });
      done('Regra criada.')();
    },
    onError: fail,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => pointsAPI.updateRule(id, data),
    onSuccess: done('Regra atualizada.'),
    onError: fail,
  });

  const deleteMutation = useMutation({
    mutationFn: pointsAPI.deleteRule,
    onSuccess: done('Regra removida.'),
    onError: fail,
  });

  const handleCreate = (e) => {
    e.preventDefault();
    setFeedback(null);
    createMutation.mutate({
      ...(form.target === 'PRODUCT'
        ? { productId: form.productId }
        : { productType: form.productType }),
      mode: form.mode,
      value: Number(form.value),
    });
  };

  const pointValue = Number(settings?.pointValueBrl ?? 0);

  return (
    <div className="py-8 px-6">
      <div className="max-w-5xl mx-auto">
        <PageHeader
          title="Regras de Pontuação"
          subtitle="Quantos pontos cada produto ou categoria gera na venda. Sem regra, o item pontua pelo multiplicador do tier."
        />

        {feedback && (
          <div
            className={`mb-6 rounded-xl p-4 text-sm font-semibold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
            }`}
          >
            {feedback.type === 'success' ? <MdCheckCircle size={20} /> : <MdWarning size={20} />}
            <span>{feedback.text}</span>
          </div>
        )}

        <Card className="mb-6">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100 dark:border-slate-800">
            <div className="p-2.5 rounded-xl bg-[#0A1929] text-[#2196F3] shadow-[2px_2px_4px_#050c14]">
              <MdRule size={22} />
            </div>
            <div>
              <h2 className="font-title font-bold text-lg text-[#0A1929] dark:text-slate-100">
                Nova regra
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Precedência na venda: <strong>produto &gt; categoria &gt; multiplicador do tier</strong>.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div>
              <label className="label">Alvo *</label>
              <select
                className="input"
                value={form.target}
                onChange={(e) =>
                  setForm({ ...form, target: e.target.value, productId: '', productType: '' })
                }
              >
                <option value="PRODUCT">Produto específico</option>
                <option value="TYPE">Categoria</option>
              </select>
            </div>

            <div>
              <label className="label">{form.target === 'PRODUCT' ? 'Produto *' : 'Categoria *'}</label>
              {form.target === 'PRODUCT' ? (
                <select
                  className="input"
                  required
                  value={form.productId}
                  onChange={(e) => setForm({ ...form, productId: e.target.value })}
                >
                  <option value="">Selecione…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  className="input"
                  required
                  value={form.productType}
                  onChange={(e) => setForm({ ...form, productType: e.target.value })}
                >
                  <option value="">Selecione…</option>
                  {productTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="label">Modo *</label>
              <select
                className="input"
                value={form.mode}
                onChange={(e) => setForm({ ...form, mode: e.target.value })}
              >
                <option value="FIXO">Fixo (pts por unidade)</option>
                <option value="POR_REAL">Por real (pts por R$)</option>
              </select>
            </div>

            <div>
              <label className="label">Pontos *</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  className="input font-mono"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  placeholder="0"
                />
                <Button
                  type="submit"
                  variant="primary"
                  loading={createMutation.isPending}
                  className="shrink-0 bg-[#2196F3] hover:bg-[#1e88e5] text-white font-bold"
                >
                  <MdAdd size={20} />
                </Button>
              </div>
            </div>
          </form>
        </Card>

        <Card>
          <h2 className="font-title font-bold text-lg text-[#0A1929] dark:text-slate-100 mb-4">
            Regras cadastradas ({rules.length})
          </h2>

          {isLoading ? (
            <div className="py-8 flex justify-center">
              <span className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : rules.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-slate-400 py-6 text-center">
              Nenhuma regra cadastrada. Todo item pontua pelo multiplicador do tier.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-gray-500 dark:text-slate-400 border-b border-gray-100 dark:border-slate-800">
                    <th className="py-2 pr-4">Alvo</th>
                    <th className="py-2 pr-4">Modo</th>
                    <th className="py-2 pr-4">Pontos</th>
                    <th className="py-2 pr-4">Custo</th>
                    <th className="py-2 pr-4">Estado</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr
                      key={rule.id}
                      className="border-b border-gray-50 dark:border-slate-800/60 last:border-0"
                    >
                      <td className="py-3 pr-4">
                        <span className="font-semibold text-[#0A1929] dark:text-slate-100">
                          {rule.product?.name || rule.productType}
                        </span>
                        <span className="ml-2 text-[11px] text-gray-500 dark:text-slate-400">
                          {rule.productId ? 'produto' : 'categoria'}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <select
                          className="input py-1 text-xs"
                          value={rule.mode}
                          onChange={(e) =>
                            updateMutation.mutate({ id: rule.id, data: { mode: e.target.value } })
                          }
                        >
                          <option value="FIXO">Fixo</option>
                          <option value="POR_REAL">Por real</option>
                        </select>
                      </td>
                      <td className="py-3 pr-4">
                        {/* Decimal do Prisma chega como string — onBlur para não
                            disparar um PATCH por tecla digitada. */}
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          defaultValue={Number(rule.value)}
                          className="input py-1 w-24 font-mono text-xs"
                          onBlur={(e) => {
                            const value = Number(e.target.value);
                            if (value !== Number(rule.value)) {
                              updateMutation.mutate({ id: rule.id, data: { value } });
                            }
                          }}
                        />
                        <span className="ml-2 text-[11px] text-gray-500 dark:text-slate-400">
                          {MODE_LABEL[rule.mode]}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-[11px] text-gray-500 dark:text-slate-400 font-mono">
                        R$ {(Number(rule.value) * pointValue).toFixed(2)}
                      </td>
                      <td className="py-3 pr-4">
                        <button
                          type="button"
                          onClick={() =>
                            updateMutation.mutate({ id: rule.id, data: { active: !rule.active } })
                          }
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                            rule.active
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {rule.active ? 'Ativa' : 'Pausada'}
                        </button>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          title="Excluir regra"
                          onClick={() => {
                            if (
                              window.confirm(
                                'Excluir a regra? O item volta a pontuar pelo multiplicador do tier. Para pausar sem perder, use o botão de estado.',
                              )
                            ) {
                              deleteMutation.mutate(rule.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          <MdDelete size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
