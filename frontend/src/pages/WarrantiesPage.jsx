import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { MdDescription, MdAccessTime, MdCheckCircle, MdCancel, MdAdd, MdDelete } from 'react-icons/md';
import { warrantyAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import WarrantyReviewModal from '../components/WarrantyReviewModal';
import WarrantyCreateModal from '../components/WarrantyCreateModal';
import Dialog from '../components/Dialog';
import { Card, PageHeader, StatusChip, StatCard, Button } from '../components/ui';

export default function WarrantiesPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarranty, setSelectedWarranty] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();

  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const canCreate = user?.role === 'ADMIN_RELM' || user?.role === 'GERENTE_RELM';
  const isSuperAdmin = user?.userType === 'ADMIN_RELM' || user?.role === 'ADMIN_RELM';

  const [deleteTarget, setDeleteTarget] = useState(null);

  const deleteMutation = useMutation({
    mutationFn: (id) => warrantyAPI.deleteClaim(id),
    onSuccess: (data) => {
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['warranties'] });
      alert(`✅ Garantia ${data.protocolNumber} excluída com sucesso.`);
    },
    onError: (error) => {
      alert(`❌ Erro ao excluir: ${error.response?.data?.message || error.message}`);
    },
  });

  const { data: warranties, isLoading, refetch } = useQuery({
    queryKey: ['warranties', statusFilter, searchTerm],
    queryFn: () =>
      warrantyAPI.getAll({
        statusId: statusFilter || undefined,
        search: searchTerm || undefined,
      }),
  });

  const { data: statuses = [] } = useQuery({
    queryKey: ['warranty-statuses'],
    queryFn: () => warrantyAPI.getStatuses(),
    staleTime: 5 * 60 * 1000,
  });

  // Deep-link: ?claim=<id> abre automaticamente o modal de revisão da garantia.
  // Usa a garantia já carregada na lista, ou busca por id se ainda não estiver lá.
  const claimId = searchParams.get('claim');
  useEffect(() => {
    if (!claimId || selectedWarranty) return;
    const fromList = warranties?.find((w) => String(w.id) === String(claimId));
    if (fromList) {
      setSelectedWarranty(fromList);
      return;
    }
    let cancelled = false;
    warrantyAPI
      .getById(claimId)
      .then((data) => {
        if (!cancelled && data) setSelectedWarranty(data);
      })
      .catch(() => {
        // Garantia inexistente/sem acesso: limpa o param para não tentar de novo.
        if (!cancelled) setSearchParams({});
      });
    return () => {
      cancelled = true;
    };
  }, [claimId, warranties, selectedWarranty, setSearchParams]);

  const closeReviewModal = () => {
    setSelectedWarranty(null);
    if (searchParams.get('claim')) setSearchParams({});
  };

  // Verdito da garantia no novo workflow:
  //  aprovada  = já passou pelo gate (approvedAt preenchido)
  //  reprovada = foi para Fechado(10) sem aprovação
  //  pendente  = ainda antes/na análise (status 1–4)
  const verdict = (w) => {
    if (w.approvedAt) return 'aprovada';
    if (w.statusId === 10) return 'reprovada';
    return 'pendente';
  };

  const stats = warranties
    ? {
        total: warranties.length,
        pending: warranties.filter((w) => verdict(w) === 'pendente').length,
        approved: warranties.filter((w) => verdict(w) === 'aprovada').length,
        rejected: warranties.filter((w) => verdict(w) === 'reprovada').length,
      }
    : { total: 0, pending: 0, approved: 0, rejected: 0 };

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
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
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
                        <button
                          onClick={() => setSelectedWarranty(warranty)}
                          className="text-sm font-bold text-primary dark:text-primary-400 hover:underline text-left focus:outline-none"
                        >
                          {warranty.protocolNumber}
                        </button>
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
                        {warranty.statusDef ? (
                          <div className="flex flex-col gap-0.5">
                            <StatusChip label={warranty.statusDef.name} color={warranty.statusDef.color} />
                            <span className="text-[11px] text-gray-400 dark:text-slate-500">
                              etapa {warranty.statusDef.sortOrder}/10
                            </span>
                          </div>
                        ) : (
                          <StatusChip label="—" variant="neutral" />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                        {new Date(warranty.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedWarranty(warranty)}
                            className="text-primary dark:text-primary-400 hover:underline font-semibold"
                          >
                            Revisar
                          </button>
                          {isSuperAdmin && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteTarget(warranty); }}
                              className="text-gray-400 hover:text-error transition-colors p-1 rounded"
                              title="Excluir garantia"
                            >
                              <MdDelete size={18} />
                            </button>
                          )}
                        </div>
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
          onClose={closeReviewModal}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

      {/* Dialog de confirmação de exclusão */}
      {deleteTarget && (
        <Dialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Excluir Garantia"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-slate-300">
              Tem certeza que deseja excluir permanentemente a garantia{' '}
              <strong>{deleteTarget.protocolNumber}</strong>?
            </p>
            <p className="text-xs text-error font-medium">
              ⚠️ Esta ação é irreversível. Todos os dados, anexos, soluções, tarefas e histórico serão apagados.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteTarget(null)}
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-error hover:bg-error-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Excluindo…' : 'Excluir permanentemente'}
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
