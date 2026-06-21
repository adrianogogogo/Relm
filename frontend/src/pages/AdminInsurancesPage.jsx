import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { insuranceAPI } from '../services/api';
import { MdDescription, MdSearch } from 'react-icons/md';
import { Card, PageHeader, StatusChip } from '../components/ui';

export default function AdminInsurancesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: quotes, isLoading } = useQuery({
    queryKey: ['admin-insurances'],
    queryFn: () => insuranceAPI.getAll(),
  });

  const filtered = (quotes || []).filter((q) => {
    const matchSearch =
      !search ||
      q.protocolNumber?.toLowerCase().includes(search.toLowerCase()) ||
      q.customer?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      q.customer?.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Cotações de Seguro"
          subtitle={`${filtered.length} cotação(ões) — recebidas pelo formulário público`}
        />

        {/* Filters */}
        <Card className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por protocolo, cliente ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input md:w-56"
          >
            <option value="">Todos os status</option>
            <option value="PENDING">Pendente</option>
            <option value="SENT_TO_HELMDESK">Enviado</option>
          </select>
        </Card>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500 dark:text-slate-400">Carregando cotações...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <MdDescription className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-slate-400 text-lg">Nenhuma cotação encontrada.</p>
          </div>
        ) : (
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/40 border-b border-gray-200 dark:border-slate-800">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Protocolo</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Cliente</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">E-mail</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Valor da Bike</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Localização</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {filtered.map((q) => (
                    <tr key={q.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm font-bold text-primary dark:text-primary-400">{q.protocolNumber}</td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-slate-100">{q.customer?.fullName || '—'}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-slate-400 text-sm">{q.customer?.email || '—'}</td>
                      <td className="px-6 py-4 text-gray-700 dark:text-slate-300">
                        {q.bikeValue
                          ? `R$ ${parseFloat(q.bikeValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-slate-400 text-sm">
                        {q.city && q.state ? `${q.city} - ${q.state}` : q.city || q.state || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <StatusChip
                          label={q.status === 'PENDING' ? 'Pendente' : q.status === 'SENT_TO_HELMDESK' ? 'Enviado' : q.status}
                          variant={q.status === 'PENDING' ? 'warning' : 'success'}
                        />
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-slate-400 text-sm">
                        {new Date(q.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/40 text-sm text-gray-500 dark:text-slate-400 border-t border-gray-200 dark:border-slate-800">
                {filtered.length} cotaç{filtered.length !== 1 ? 'ões' : 'ão'}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
