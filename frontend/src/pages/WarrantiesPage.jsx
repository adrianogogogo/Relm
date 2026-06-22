import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MdDescription, MdAccessTime, MdCheckCircle, MdCancel, MdAdd } from 'react-icons/md';
import { warrantyAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import WarrantyReviewModal from '../components/WarrantyReviewModal';
import WarrantyCreateModal from '../components/WarrantyCreateModal';
import { Card, PageHeader, StatusChip, StatCard, Button } from '../components/ui';

export default function WarrantiesPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarranty, setSelectedWarranty] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const canCreate = user?.role === 'ADMIN_RELM' || user?.role === 'GERENTE_RELM';

  const { data: warranties, isLoading, refetch } = useQuery({
    queryKey: ['warranties', statusFilter, searchTerm],
    queryFn: () =>
      warrantyAPI.getAll({
        status: statusFilter || undefined,
        search: searchTerm || undefined,
      }),
  });

  const stats = warranties
    ? {
        total: warranties.length,
        pending: warranties.filter((w) => w.status === 'RECEBIDO' || w.status === 'EM_ANALISE').length,
        approved: warranties.filter((w) => w.status === 'APROVADO').length,
        rejected: warranties.filter((w) => w.status === 'REPROVADO').length,
      }
    : { total: 0, pending: 0, approved: 0, rejected: 0 };

  const statusLabel = {
    RECEBIDO: 'Recebido',
    EM_ANALISE: 'Em Análise',
    AGUARDANDO_CLIENTE: 'Aguardando Cliente',
    APROVADO: 'Aprovado',
    REPROVADO: 'Reprovado',
    FINALIZADO: 'Finalizado',
    CANCELADO: 'Cancelado',
  };

  const statusVariant = {
    RECEBIDO: 'info',
    EM_ANALISE: 'warning',
    AGUARDANDO_CLIENTE: 'warning',
    APROVADO: 'success',
    REPROVADO: 'error',
    FINALIZADO: 'neutral',
    CANCELADO: 'neutral',
  };

  return (
    <div className="py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <PageHeader
          title="Garantias"
          subtitle={`${stats.total} garantia(s) encontrada(s)`}
          action={
            canCreate && (
              <Button icon={MdAdd} onClick={() => setShowCreateModal(true)}>
                Nova Garantia
              </Button>
            )
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total" value={stats.total} icon={MdDescription} color="#2196F3" />
          <StatCard title="Pendentes" value={stats.pending} icon={MdAccessTime} color="#FF9800" />
          <StatCard title="Aprovadas" value={stats.approved} icon={MdCheckCircle} color="#4CAF50" />
          <StatCard title="Reprovadas" value={stats.rejected} icon={MdCancel} color="#F44336" />
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="search" className="label">Buscar</label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Protocolo, cliente, produto..."
                className="input"
              />
            </div>

            <div>
              <label htmlFor="status" className="label">Status</label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input"
              >
                <option value="">Todos os status</option>
                <option value="RECEBIDO">Recebido</option>
                <option value="EM_ANALISE">Em Análise</option>
                <option value="AGUARDANDO_CLIENTE">Aguardando Cliente</option>
                <option value="APROVADO">Aprovado</option>
                <option value="REPROVADO">Reprovado</option>
                <option value="FINALIZADO">Finalizado</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card className="p-0 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-gray-500 dark:text-slate-400">Carregando garantias...</p>
            </div>
          ) : warranties && warranties.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-900/40">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Protocolo</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Produto</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {warranties.map((warranty) => (
                    <tr key={warranty.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-primary dark:text-primary-400">{warranty.protocolNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-slate-100">{warranty.customer?.fullName || 'N/A'}</div>
                        <div className="text-sm text-gray-500 dark:text-slate-400">{warranty.customer?.email || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-slate-100">{warranty.product?.model || 'N/A'}</div>
                        <div className="text-sm text-gray-500 dark:text-slate-400">{warranty.product?.serialNumber || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusChip
                          label={statusLabel[warranty.status] || warranty.status}
                          variant={statusVariant[warranty.status] || 'neutral'}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                        {new Date(warranty.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedWarranty(warranty)}
                          className="text-primary dark:text-primary-400 hover:underline font-semibold"
                        >
                          Revisar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <MdDescription className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-600" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-slate-100">Nenhuma garantia encontrada</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Ajuste os filtros ou aguarde novas solicitações.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Modal de Cadastro */}
      {showCreateModal && (
        <WarrantyCreateModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['warranties'] });
          }}
        />
      )}

      {/* Modal de Revisão */}
      {selectedWarranty && (
        <WarrantyReviewModal
          warranty={selectedWarranty}
          onClose={() => setSelectedWarranty(null)}
          onSuccess={() => {
            setSelectedWarranty(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
