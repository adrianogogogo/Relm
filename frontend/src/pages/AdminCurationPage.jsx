import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdRule } from 'react-icons/md';
import { salesAPI, productsAPI } from '../services/api';
import { Card, PageHeader, Button } from '../components/ui';

const LIMIT = 20;

export default function AdminCurationPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [selections, setSelections] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ['sales-pending-curation', page],
    queryFn: () => salesAPI.getPendingCuration({ page, limit: LIMIT }),
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsAPI.getAll(),
  });

  const linkMutation = useMutation({
    mutationFn: ({ itemId, productId }) => salesAPI.linkItem(itemId, productId),
    onSuccess: (_result, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: ['sales-pending-curation'] });
      setSelections((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    },
  });

  const items = data?.data || [];
  const total = data?.total || 0;
  const pages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Curadoria de Produtos"
          subtitle={`${total} item${total !== 1 ? 's' : ''} pendente${total !== 1 ? 's' : ''} de curadoria`}
        />

        {isLoading ? (
          <div className="text-center py-12 text-gray-500 dark:text-slate-400">
            Carregando itens pendentes...
          </div>
        ) : items.length === 0 ? (
          <Card className="text-center py-12">
            <MdRule className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-slate-400 text-lg">Nenhum item pendente de curadoria.</p>
          </Card>
        ) : (
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/40 border-b border-gray-200 dark:border-slate-800">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase">Data da venda</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase">Cliente</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase">Loja</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase">Nome comercial</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase">Série</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase">Qtd</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase">Vincular ao catálogo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-3 text-gray-500 dark:text-slate-400 text-sm">
                        {item.sale?.saleDate ? new Date(item.sale.saleDate).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="px-6 py-3 text-gray-600 dark:text-slate-400">
                        {item.sale?.customer?.fullName || '—'}
                      </td>
                      <td className="px-6 py-3 text-gray-600 dark:text-slate-400">
                        {item.sale?.store?.tradeName || '—'}
                      </td>
                      <td className="px-6 py-3 font-semibold text-gray-900 dark:text-slate-100">
                        {item.commercialName}
                      </td>
                      <td className="px-6 py-3 font-mono text-sm text-gray-600 dark:text-slate-400">
                        {item.serialNumber || '—'}
                      </td>
                      <td className="px-6 py-3 text-gray-600 dark:text-slate-400">{item.quantity}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <select
                            className="input text-sm"
                            value={selections[item.id] || ''}
                            onChange={(e) =>
                              setSelections((prev) => ({ ...prev, [item.id]: e.target.value }))
                            }
                          >
                            <option value="">Selecione um produto...</option>
                            {(products || []).map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name || p.model} {p.brand ? `— ${p.brand}` : ''}
                              </option>
                            ))}
                          </select>
                          <Button
                            type="button"
                            variant="outlined"
                            disabled={!selections[item.id] || linkMutation.isPending}
                            onClick={() => linkMutation.mutate({ itemId: item.id, productId: selections[item.id] })}
                          >
                            Vincular
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/40 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
                <span>{total} item{total !== 1 ? 's' : ''}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1 rounded-lg border border-gray-300 dark:border-slate-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-slate-800"
                  >
                    ← Anterior
                  </button>
                  <span className="px-3 py-1">Página {page} de {pages}</span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    disabled={page >= pages}
                    className="px-3 py-1 rounded-lg border border-gray-300 dark:border-slate-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-slate-800"
                  >
                    Próxima →
                  </button>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
