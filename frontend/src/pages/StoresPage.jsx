import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MdDelete, MdAdd, MdStore, MdCheckCircle, MdBlock, MdPeople, MdUploadFile, MdDownload } from 'react-icons/md';
import { storesAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Card, PageHeader, StatusChip, StatCard, Button } from '../components/ui';
import { readSheetRows, cell, downloadTemplate } from '../utils/sheetImport';

export default function StoresPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN_RELM';
  const canManage = ['ADMIN_RELM', 'GERENTE_RELM', 'DISTRIBUIDOR'].includes(user?.role);
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('true');
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

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

  const handleTemplate = () =>
    downloadTemplate(
      ['Nome Fantasia', 'Razão Social', 'CNPJ', 'Email', 'Telefone', 'Endereço', 'Cidade', 'Estado', 'CEP'],
      'modelo-lojas.xlsx',
      'Lojas',
    );

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite reimportar o mesmo arquivo
    if (!file) return;
    try {
      const json = await readSheetRows(file);
      const rows = json
        .map((r) => ({
          tradeName: cell(r, 'nome fantasia') || cell(r, 'fantasia') || cell(r, 'nome'),
          legalName: cell(r, 'razao social') || cell(r, 'razao'),
          cnpj: cell(r, 'cnpj') || undefined,
          email: cell(r, 'email') || undefined,
          phone: cell(r, 'telefone') || cell(r, 'fone') || undefined,
          address: cell(r, 'endereco') || undefined,
          city: cell(r, 'cidade') || undefined,
          state: cell(r, 'estado') || cell(r, 'uf') || undefined,
          zipCode: cell(r, 'cep') || undefined,
        }))
        .filter((r) => r.tradeName && r.legalName && r.city && r.state);
      if (rows.length === 0) {
        alert('Nenhuma linha válida. Nome Fantasia, Razão Social, Cidade e Estado são obrigatórios. Use os cabeçalhos do modelo.');
        return;
      }
      if (!confirm(`Importar ${rows.length} loja(s)?`)) return;
      setImporting(true);
      const res = await storesAPI.bulkCreate(rows);
      alert(`✅ ${res.created} loja(s) importada(s).`);
      queryClient.invalidateQueries(['stores']);
    } catch (err) {
      const msg = err.response?.data?.message;
      alert(`❌ ${Array.isArray(msg) ? msg[0] : msg || err.message || 'Falha ao importar.'}`);
    } finally {
      setImporting(false);
    }
  };

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
          action={canManage && (
            <div className="flex items-center gap-2">
              <button onClick={handleTemplate} className="btn btn-outline flex items-center gap-2" title="Baixar planilha modelo">
                <MdDownload /> Modelo
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={importing}
                className="btn btn-outline flex items-center gap-2 disabled:opacity-50"
              >
                <MdUploadFile /> {importing ? 'Importando…' : 'Importar'}
              </button>
              <Link to="/admin/stores/new">
                <Button icon={MdAdd}>Nova Loja</Button>
              </Link>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
            </div>
          )}
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
                          {canManage && (
                            <Link to={`/admin/stores/${store.id}/edit`} className="text-primary dark:text-primary-400 hover:underline font-semibold">
                              Editar
                            </Link>
                          )}
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
