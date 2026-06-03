import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { warrantyAPI } from '../services/api';
import { ArrowLeft, Shield, Search } from 'lucide-react';

const STATUS_LABEL = {
  RECEBIDO: 'Recebido',
  EM_ANALISE: 'Em Análise',
  AGUARDANDO_CLIENTE: 'Aguardando Cliente',
  APROVADO: 'Aprovado',
  REPROVADO: 'Reprovado',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
};

const STATUS_COLOR = {
  RECEBIDO: 'bg-blue-100 text-blue-800',
  EM_ANALISE: 'bg-yellow-100 text-yellow-800',
  AGUARDANDO_CLIENTE: 'bg-orange-100 text-orange-800',
  APROVADO: 'bg-green-100 text-green-800',
  REPROVADO: 'bg-red-100 text-red-800',
  FINALIZADO: 'bg-gray-100 text-gray-700',
  CANCELADO: 'bg-gray-100 text-gray-500',
};

export default function StoreWarrantiesPage() {
  const navigate = useNavigate();
  const [storeId, setStoreId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { navigate('/loja/login'); return; }
    const user = JSON.parse(stored);
    if (user.type !== 'STORE') { navigate('/loja/login'); return; }
    setStoreId(user.storeId);
  }, [navigate]);

  const { data: warranties, isLoading } = useQuery({
    queryKey: ['store-warranties', storeId],
    queryFn: () => warrantyAPI.getAll({ storeId }),
    enabled: !!storeId,
  });

  const filtered = (warranties || []).filter((w) => {
    const matchSearch = !search ||
      w.protocolNumber?.toLowerCase().includes(search.toLowerCase()) ||
      w.customer?.fullName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || w.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/loja/dashboard" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-green-600" />
            <h1 className="text-xl font-bold text-gray-900">Garantias da Loja</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por protocolo ou cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todos os status</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Carregando garantias...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Nenhuma garantia encontrada.</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Protocolo</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Produto</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((w) => (
                  <tr key={w.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-sm text-gray-900">{w.protocolNumber}</td>
                    <td className="px-6 py-4 text-gray-700">{w.customer?.fullName || '—'}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{w.product?.model || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${STATUS_COLOR[w.status] || 'bg-gray-100'}`}>
                        {STATUS_LABEL[w.status] || w.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {new Date(w.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-3 bg-gray-50 text-sm text-gray-500 border-t">
              {filtered.length} garantia{filtered.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
