import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { warrantyAPI } from '../services/api';
import { Search } from 'lucide-react';
import { useStoreAuthStore } from '../store/storeAuthStore';
import { Card, PageHeader, StatusChip } from '../components/ui';

const STATUS_LABEL = {
  RECEBIDO: 'Recebido',
  EM_ANALISE: 'Em Análise',
  AGUARDANDO_CLIENTE: 'Aguardando Cliente',
  APROVADO: 'Aprovado',
  REPROVADO: 'Reprovado',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
};

const STATUS_VARIANT = {
  RECEBIDO: 'info',
  EM_ANALISE: 'warning',
  AGUARDANDO_CLIENTE: 'warning',
  APROVADO: 'success',
  REPROVADO: 'error',
  FINALIZADO: 'neutral',
  CANCELADO: 'neutral',
};

export default function StoreWarrantiesPage() {
  const storeId = useStoreAuthStore((state) => state.user?.storeId);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: warranties, isLoading } = useQuery({
    queryKey: ['store-warranties', storeId],
    queryFn: () => warrantyAPI.getAll({ storeId }),
    enabled: !!storeId,
  });

  const filtered = (warranties || []).filter((w) => {
    const matchSearch = !search ||
      w.protocolNumber?.toLowerCase().includes(search.toLowerCase()) ||
      w.customer?.fullName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || w.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Garantias da Loja"
          subtitle={`${filtered.length} garantia${filtered.length !== 1 ? 's' : ''}`}
        />

        {/* Filtros */}
        <Card className="mb-6 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por protocolo ou cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input md:w-64"
            >
              <option value="">Todos os status</option>
              {Object.entries(STATUS_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </Card>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500 dark:text-slate-400">
            Carregando garantias...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-slate-400">
            Nenhuma garantia encontrada.
          </div>
        ) : (
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/40 border-b border-gray-200 dark:border-slate-800">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase">Protocolo</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase">Cliente</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase">Produto</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {filtered.map((w) => (
                    <tr key={w.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-3 font-mono text-sm text-gray-900 dark:text-slate-100">{w.protocolNumber}</td>
                      <td className="px-6 py-3 text-gray-700 dark:text-slate-300">{w.customer?.fullName || '—'}</td>
                      <td className="px-6 py-3 text-gray-600 dark:text-slate-400 text-sm">{w.product?.model || '—'}</td>
                      <td className="px-6 py-3">
                        <StatusChip
                          label={STATUS_LABEL[w.status] || w.status}
                          variant={STATUS_VARIANT[w.status] || 'neutral'}
                        />
                      </td>
                      <td className="px-6 py-3 text-gray-500 dark:text-slate-400 text-sm">
                        {new Date(w.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/40 text-sm text-gray-500 dark:text-slate-400 border-t border-gray-200 dark:border-slate-800">
              {filtered.length} garantia{filtered.length !== 1 ? 's' : ''}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
