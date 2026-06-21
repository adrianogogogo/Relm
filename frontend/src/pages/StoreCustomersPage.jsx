import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customersAPI } from '../services/api';
import { MdSearch } from 'react-icons/md';
import { useAuthStore } from '../store/authStore';
import { Card, PageHeader } from '../components/ui';

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
        <PageHeader
          title="Clientes da Loja"
          subtitle={`${filtered.length} cliente${filtered.length !== 1 ? 's' : ''}`}
        />

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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-900 dark:text-slate-100">{c.fullName}</td>
                      <td className="px-6 py-3 text-gray-600 dark:text-slate-400">{c.email}</td>
                      <td className="px-6 py-3 text-gray-600 dark:text-slate-400">{c.phone || '—'}</td>
                      <td className="px-6 py-3 text-gray-500 dark:text-slate-400 text-sm">
                        {new Date(c.createdAt).toLocaleDateString('pt-BR')}
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
