import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Users, UserCheck, Shield, CalendarPlus, Plus } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Card, PageHeader, StatusChip, StatCard, Button } from '../components/ui';

export default function CustomersPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN_RELM';
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStore, setFilterStore] = useState('');
  const [stores, setStores] = useState([]);

  useEffect(() => {
    fetchCustomers();
    fetchStores();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/customers', { params: { pageSize: 200 } });
      // O endpoint agora retorna { data, total, page, pageSize } (paginado).
      const payload = response.data;
      setCustomers(Array.isArray(payload) ? payload : payload?.data ?? []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const response = await api.get('/stores');
      setStores(response.data);
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
    }
  };

  const handleDelete = async (customer) => {
    if (!confirm(`Excluir permanentemente o cliente "${customer.fullName}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await api.delete(`/customers/${customer.id}`);
      setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
    } catch (error) {
      alert(error.response?.data?.message || 'Erro ao excluir cliente.');
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      customer.email?.toLowerCase().includes(search.toLowerCase()) ||
      customer.cpf?.includes(search) ||
      customer.phone?.includes(search);
    
    const matchesStore = !filterStore || customer.storeId === filterStore;
    
    return matchesSearch && matchesStore;
  });

  const newThisMonth = customers.filter((c) => {
    const created = new Date(c.createdAt);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <PageHeader
          title="Clientes"
          subtitle={`${filteredCustomers.length} cliente(s) encontrado(s)`}
          action={
            <Link to="/admin/customers/new">
              <Button icon={Plus}>Novo Cliente</Button>
            </Link>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <StatCard title="Total de Clientes" value={customers.length} icon={Users} color="#1565C0" />
          <StatCard title="Clientes Ativos" value={customers.filter((c) => c.active).length} icon={UserCheck} color="#4CAF50" />
          <StatCard title="Com Garantia Ativa" value={customers.filter((c) => c.hasActiveWarranty).length} icon={Shield} color="#2196F3" />
          <StatCard title="Novos Este Mês" value={newThisMonth} icon={CalendarPlus} color="#9C27B0" />
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Buscar</label>
              <input
                type="text"
                placeholder="Nome, email, CPF ou telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">Loja de Compra</label>
              <select
                value={filterStore}
                onChange={(e) => setFilterStore(e.target.value)}
                className="input"
              >
                <option value="">Todas as lojas</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.tradeName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="text"
                color="primary"
                onClick={() => {
                  setSearch('');
                  setFilterStore('');
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card className="p-0 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-500 dark:text-slate-400 mt-4">Carregando clientes...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 dark:text-slate-400">Nenhum cliente encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/40 border-b border-gray-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Contato</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Loja</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Cadastro</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-slate-100">{customer.fullName}</div>
                          <div className="text-sm text-gray-500 dark:text-slate-400">{customer.cpf}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900 dark:text-slate-100">{customer.email}</div>
                          <div className="text-sm text-gray-500 dark:text-slate-400">{customer.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-slate-100">
                          {customer.store?.tradeName || stores.find((s) => s.id === customer.storeId)?.tradeName || 'Não informado'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusChip
                          label={customer.active ? 'Ativo' : 'Inativo'}
                          variant={customer.active ? 'success' : 'neutral'}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                        {new Date(customer.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-4">
                          <Link to={`/admin/customers/${customer.id}`} className="text-primary dark:text-primary-400 hover:underline font-semibold">
                            Ver Detalhes
                          </Link>
                          <Link to={`/admin/customers/${customer.id}/edit`} className="text-gray-600 dark:text-slate-300 hover:underline">
                            Editar
                          </Link>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(customer)}
                              className="text-gray-400 hover:text-error transition-colors"
                              title="Excluir cliente"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
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
