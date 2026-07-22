import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { customersAPI } from '../services/api';
import { MdSearch, MdAdd, MdPointOfSale, MdShoppingBag, MdEdit } from 'react-icons/md';
import { useAuthStore } from '../store/authStore';
import { Card, PageHeader, Button } from '../components/ui';

export default function StoreCustomersPage() {
  const storeId = useAuthStore((state) => state.user?.storeId);
  const [search, setSearch] = useState('');

  const { data: customersResponse, isLoading } = useQuery({
    queryKey: ['store-customers', storeId],
    queryFn: () => customersAPI.getAll({ storeId, pageSize: 200 }),
    enabled: !!storeId,
  });

  // O endpoint agora retorna { data, total, page, pageSize } (paginado).
  const customers = Array.isArray(customersResponse)
    ? customersResponse
    : customersResponse?.data ?? [];

  const filtered = (customers || []).filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.fullName?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.cpf?.includes(q) ||
      c.phone?.includes(q)
    );
  });

  return (
    <div className="py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <PageHeader
            title="Clientes da Loja"
            subtitle={`${filtered.length} cliente${filtered.length !== 1 ? 's' : ''} cadastrado(s)`}
          />
          <Link to="/loja/clientes/novo">
            <Button icon={MdAdd} className="w-full sm:w-auto">
              Novo Cliente
            </Button>
          </Link>
        </div>

        {/* Filtros */}
        <Card className="mb-6 p-4">
          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail, CPF ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
        </Card>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500 dark:text-slate-400">
            Carregando clientes...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-slate-400">
            {search
              ? 'Nenhum cliente encontrado para essa busca.'
              : 'Nenhum cliente vinculado a esta loja ainda.'}
          </div>
        ) : (
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/40 border-b border-gray-200 dark:border-slate-800">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase">Nome</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase">E-mail</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase">Telefone</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase">Cadastro</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-900 dark:text-slate-100">
                        <Link
                          to={`/loja/clientes/${c.id}`}
                          className="hover:text-primary dark:hover:text-primary-400 hover:underline"
                        >
                          {c.fullName}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-gray-600 dark:text-slate-400">{c.email}</td>
                      <td className="px-6 py-3 text-gray-600 dark:text-slate-400">{c.phone || '—'}</td>
                      <td className="px-6 py-3 text-gray-500 dark:text-slate-400 text-sm">
                        {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/loja/vendas?customerId=${c.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 px-2.5 py-1.5 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800"
                            title="Lançar venda para este cliente"
                          >
                            <MdPointOfSale className="w-3.5 h-3.5" />
                            Lançar Venda
                          </Link>
                          <Link
                            to={`/loja/clientes/${c.id}?tab=purchases`}
                            className="inline-flex items-center gap-1 text-xs font-semibold bg-primary/10 text-primary dark:text-primary-400 hover:bg-primary/20 px-2.5 py-1.5 rounded-lg transition-colors"
                            title="Ver compras e itens"
                          >
                            <MdShoppingBag className="w-3.5 h-3.5" />
                            Compras
                          </Link>
                          <Link
                            to={`/loja/clientes/${c.id}/editar`}
                            className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Editar cadastro"
                          >
                            <MdEdit className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/40 text-sm text-gray-500 dark:text-slate-400 border-t border-gray-200 dark:border-slate-800">
              {filtered.length} cliente{filtered.length !== 1 ? 's' : ''}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
