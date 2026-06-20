import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { ShoppingBag, Search } from 'lucide-react';
import { useStoreAuthStore } from '../store/storeAuthStore';
import { Card, PageHeader } from '../components/ui';

export default function StoreProductsPage() {
  const storeId = useStoreAuthStore((state) => state.user?.storeId);
  const [search, setSearch] = useState('');

  const { data: products, isLoading } = useQuery({
    queryKey: ['store-products', storeId],
    queryFn: () => api.get('/products', { params: { storeId } }).then((res) => res.data),
    enabled: !!storeId,
  });

  const filtered = (products || []).filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.model?.toLowerCase().includes(q) ||
      p.serialNumber?.toLowerCase().includes(q) ||
      p.productType?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Produtos da Loja"
          subtitle={`${filtered.length} produto${filtered.length !== 1 ? 's' : ''}`}
        />

        {/* Filtros */}
        <Card className="mb-6 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por modelo, serial ou tipo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
        </Card>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500 dark:text-slate-400">
            Carregando produtos...
          </div>
        ) : filtered.length === 0 ? (
          <Card className="text-center py-12">
            <ShoppingBag className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-slate-400 text-lg">Nenhum produto encontrado.</p>
            <p className="text-gray-400 dark:text-slate-500 mt-2 text-sm">
              Produtos vinculados a esta loja via garantia aparecerão aqui.
            </p>
          </Card>
        ) : (
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/40 border-b border-gray-200 dark:border-slate-800">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase">Modelo</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase">Tipo</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase">Serial</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase">Marca</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase">Cadastro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-900 dark:text-slate-100">{p.model}</td>
                      <td className="px-6 py-3 text-gray-600 dark:text-slate-400">{p.productType}</td>
                      <td className="px-6 py-3 font-mono text-sm text-gray-600 dark:text-slate-400">{p.serialNumber}</td>
                      <td className="px-6 py-3 text-gray-600 dark:text-slate-400">{p.brand}</td>
                      <td className="px-6 py-3 text-gray-500 dark:text-slate-400 text-sm">
                        {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/40 text-sm text-gray-500 dark:text-slate-400 border-t border-gray-200 dark:border-slate-800">
              {filtered.length} produto{filtered.length !== 1 ? 's' : ''}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
