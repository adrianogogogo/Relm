import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MdDelete, MdAdd, MdStore, MdCheckCircle, MdBlock, MdPeople } from 'react-icons/md';
import { storesAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Card, PageHeader, StatusChip, StatCard, Button } from '../components/ui';

export default function StoresPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN_RELM';
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('true');

  const { data: stores, isLoading } = useQuery({
    queryKey: ['stores', searchTerm, stateFilter, activeFilter],
    queryFn: () =>
      storesAPI.getAll({
        search: searchTerm || undefined,
        state: stateFilter || undefined,
        active: activeFilter || undefined,
      }),
  });

  const states = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
  ];

  const handleDelete = async (store) => {
    if (!confirm(`Excluir permanentemente a loja "${store.tradeName}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await storesAPI.delete(store.id);
      queryClient.invalidateQueries(['stores']);
    } catch (error) {
      alert(error.response?.data?.message || 'Erro ao excluir loja.');
    }
  };

  const stats = stores
    ? {
        total: stores.length,
        active: stores.filter((s) => s.active).length,
        inactive: stores.filter((s) => !s.active).length,
        totalCustomers: stores.reduce((sum, s) => sum + (s._count?.customers || 0), 0),
      }
    : { total: 0, active: 0, inactive: 0, totalCustomers: 0 };

  return (
    <div className="py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <PageHeader
          title="Lojas Parceiras"
          subtitle={`${stats.total} loja(s) encontrada(s)`}
          action={
            <Link to="/admin/stores/new">
              <Button icon={MdAdd}>Nova Loja</Button>
            </Link>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total de Lojas" value={stats.total} icon={MdStore} color="#1565C0" />
          <StatCard title="Lojas Ativas" value={stats.active} icon={MdCheckCircle} color="#4CAF50" />
          <StatCard title="Lojas Inativas" value={stats.inactive} icon={MdBlock} color="#666666" />
          <StatCard title="Clientes Total" value={stats.totalCustomers} icon={MdPeople} color="#9C27B0" />
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="label">Buscar</label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nome, cidade, CNPJ..."
                className="input"
              />
            </div>

            <div>
              <label htmlFor="state" className="label">Estado</label>
              <select
                id="state"
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="input"
              >
                <option value="">Todos os estados</option>
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="active" className="label">Status</label>
              <select
                id="active"
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="input"
              >
                <option value="">Todos</option>
                <option value="true">Ativas</option>
                <option value="false">Inativas</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card className="p-0 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-gray-500 dark:text-slate-400">Carregando lojas...</p>
            </div>
          ) : stores && stores.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-900/40">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Loja</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Localização</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Contato</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Clientes</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {stores.map((store) => (
                    <tr key={store.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-slate-100">{store.tradeName}</div>
                        <div className="text-sm text-gray-500 dark:text-slate-400">{store.cnpjFormatted || 'Sem CNPJ'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-slate-100">{store.city}, {store.state}</div>
                        {store.address && <div className="text-sm text-gray-500 dark:text-slate-400">{store.address}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-slate-100">{store.phone || '-'}</div>
                        <div className="text-sm text-gray-500 dark:text-slate-400">{store.email || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-100">
                        {store._count?.customers || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusChip
                          label={store.active ? 'Ativa' : 'Inativa'}
                          variant={store.active ? 'success' : 'neutral'}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-4">
                          <Link to={`/admin/stores/${store.id}/edit`} className="text-primary dark:text-primary-400 hover:underline font-semibold">
                            Editar
                          </Link>
                          <Link to={`/admin/stores/${store.id}`} className="text-gray-600 dark:text-slate-300 hover:underline">
                            Ver Detalhes
                          </Link>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(store)}
                              className="text-gray-400 hover:text-error transition-colors"
                              title="Excluir loja"
                            >
                              <MdDelete size={16} />
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
              <MdStore className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-600" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-slate-100">Nenhuma loja encontrada</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Comece cadastrando uma nova loja parceira.</p>
              <div className="mt-6 flex justify-center">
                <Link to="/admin/stores/new">
                  <Button icon={MdAdd}>Nova Loja</Button>
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
