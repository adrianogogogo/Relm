import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { customersAPI } from '../services/api';
import { ArrowLeft, Users, Search } from 'lucide-react';

export default function StoreCustomersPage() {
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

  const { data: customers, isLoading } = useQuery({
    queryKey: ['store-customers', storeId],
    queryFn: () => customersAPI.getAll({ storeId }),
    enabled: !!storeId,
  });

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
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/loja/dashboard" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Clientes da Loja</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail, CPF ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Carregando clientes...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {search ? 'Nenhum cliente encontrado para essa busca.' : 'Nenhum cliente vinculado a esta loja ainda.'}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Nome</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">E-mail</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Telefone</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Cadastro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{c.fullName}</td>
                    <td className="px-6 py-4 text-gray-600">{c.email}</td>
                    <td className="px-6 py-4 text-gray-600">{c.phone || '—'}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-3 bg-gray-50 text-sm text-gray-500 border-t">
              {filtered.length} cliente{filtered.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
