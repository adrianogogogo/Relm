import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { insuranceAPI } from '../services/api';
import { ArrowLeft, FileText } from 'lucide-react';

export default function StoreInsurancesPage() {
  const navigate = useNavigate();
  const [storeData, setStoreData] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { navigate('/loja/login'); return; }
    const user = JSON.parse(stored);
    if (user.type !== 'STORE') { navigate('/loja/login'); return; }
    setStoreData(user);
  }, [navigate]);

  const { data: quotes, isLoading } = useQuery({
    queryKey: ['store-insurances', storeData?.storeId],
    queryFn: () => insuranceAPI.getAll({ storeId: storeData.storeId }),
    enabled: !!storeData?.storeId,
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/loja/dashboard" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-purple-600" />
            <h1 className="text-xl font-bold text-gray-900">Cotações de Seguro</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Carregando cotações...</div>
        ) : !quotes || quotes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nenhuma cotação de seguro encontrada.</p>
            <p className="text-gray-400 mt-2 text-sm">
              As cotações realizadas por clientes da loja aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Protocolo</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Valor da Bike</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {quotes.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-sm text-gray-900">{q.protocolNumber}</td>
                    <td className="px-6 py-4 text-gray-700">{q.customer?.fullName || '—'}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {q.bikeValue ? `R$ ${parseFloat(q.bikeValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 font-semibold">
                        {q.status === 'PENDING' ? 'Pendente' : q.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {new Date(q.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
