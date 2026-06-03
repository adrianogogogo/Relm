import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { customerPortalAPI } from '../services/api';

const STATUS_COLOR = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function CustomerInsurancePage() {
  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ['customer-quotes'],
    queryFn: customerPortalAPI.getInsuranceQuotes,
  });

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Cotações de Seguro</h1>
            <p className="text-gray-500 text-sm mt-1">Suas solicitações de seguro</p>
          </div>
          <Link to="/seguro" className="btn btn-primary text-sm">
            + Nova cotação
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Carregando...</div>
        ) : quotes.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <p className="text-5xl mb-4">🛡️</p>
            <p className="text-gray-500 mb-4">Você ainda não tem cotações de seguro.</p>
            <Link to="/seguro" className="btn btn-primary">Solicitar cotação</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {quotes.map((q) => (
              <div key={q.id} className="bg-white rounded-xl shadow p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-800">{q.protocolNumber}</p>
                    {q.product && (
                      <p className="text-sm text-gray-500">{q.product.model} — {q.product.serialNumber}</p>
                    )}
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold ${STATUS_COLOR[q.status] || 'bg-gray-100 text-gray-700'}`}>
                    {q.status === 'PENDING' ? 'Aguardando' : q.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                  {q.bikeValue && (
                    <div>
                      <span className="text-xs text-gray-400 block">Valor da bike</span>
                      R$ {Number(q.bikeValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  )}
                  {q.city && (
                    <div>
                      <span className="text-xs text-gray-400 block">Localização</span>
                      {q.city}/{q.state}
                    </div>
                  )}
                  {q.quoteValue && (
                    <div>
                      <span className="text-xs text-gray-400 block">Valor do seguro</span>
                      R$ {Number(q.quoteValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                    </div>
                  )}
                  {q.insuranceCompany && (
                    <div>
                      <span className="text-xs text-gray-400 block">Seguradora</span>
                      {q.insuranceCompany}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  Solicitado em {new Date(q.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
