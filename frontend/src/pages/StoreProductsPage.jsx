import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { ArrowLeft, ShoppingBag, Search } from 'lucide-react';

export default function StoreProductsPage() {
  const navigate = useNavigate();
  const [storeId, setStoreId] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { navigate('/loja/login'); return; }
    const user = JSON.parse(stored);
    if (user.type !== 'STORE') { navigate('/loja/login'); return; }
    setStoreId(user.storeId);
  }, [navigate]);

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
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/loja/dashboard" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-orange-600" />
            <h1 className="text-xl font-bold text-gray-900">Produtos da Loja</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por modelo, serial ou tipo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Carregando produtos...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nenhum produto encontrado.</p>
            <p className="text-gray-400 mt-2 text-sm">
              Produtos vinculados a esta loja via garantia aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Modelo</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Serial</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Marca</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Cadastro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{p.model}</td>
                    <td className="px-6 py-4 text-gray-600">{p.productType}</td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-600">{p.serialNumber}</td>
                    <td className="px-6 py-4 text-gray-600">{p.brand}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-3 bg-gray-50 text-sm text-gray-500 border-t">
              {filtered.length} produto{filtered.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
