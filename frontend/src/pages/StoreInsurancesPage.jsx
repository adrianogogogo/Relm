import { useQuery } from '@tanstack/react-query';
import { insuranceAPI } from '../services/api';
import { FileText } from 'lucide-react';
import { useStoreAuthStore } from '../store/storeAuthStore';
import { Card, PageHeader, StatusChip } from '../components/ui';

export default function StoreInsurancesPage() {
  const storeId = useStoreAuthStore((state) => state.user?.storeId);

  const { data: quotes, isLoading } = useQuery({
    queryKey: ['store-insurances', storeId],
    queryFn: () => insuranceAPI.getAll({ storeId }),
    enabled: !!storeId,
  });

  const total = quotes?.length || 0;

  return (
    <div className="py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Cotações de Seguro"
          subtitle={`${total} cotaç${total !== 1 ? 'ões' : 'ão'}`}
        />

        {isLoading ? (
          <div className="text-center py-12 text-gray-500 dark:text-slate-400">
            Carregando cotações...
          </div>
        ) : !quotes || quotes.length === 0 ? (
          <Card className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-slate-400 text-lg">
              Nenhuma cotação de seguro encontrada.
            </p>
            <p className="text-gray-400 dark:text-slate-500 mt-2 text-sm">
              As cotações realizadas por clientes da loja aparecerão aqui.
            </p>
          </Card>
        ) : (
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/40 border-b border-gray-200 dark:border-slate-800">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase">Protocolo</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase">Cliente</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase">Valor da Bike</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {quotes.map((q) => (
                    <tr key={q.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-3 font-mono text-sm text-gray-900 dark:text-slate-100">{q.protocolNumber}</td>
                      <td className="px-6 py-3 text-gray-700 dark:text-slate-300">{q.customer?.fullName || '—'}</td>
                      <td className="px-6 py-3 text-gray-600 dark:text-slate-400">
                        {q.bikeValue ? `R$ ${parseFloat(q.bikeValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="px-6 py-3">
                        <StatusChip
                          label={q.status === 'PENDING' ? 'Pendente' : q.status}
                          variant="warning"
                        />
                      </td>
                      <td className="px-6 py-3 text-gray-500 dark:text-slate-400 text-sm">
                        {new Date(q.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
