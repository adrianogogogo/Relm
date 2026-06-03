import { useQuery } from '@tanstack/react-query';
import { customerPortalAPI } from '../services/api';

export default function CustomerBenefitsPage() {
  const { data: benefits = [], isLoading } = useQuery({
    queryKey: ['customer-benefits'],
    queryFn: customerPortalAPI.getBenefits,
  });

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Vantagens</h1>
          <p className="text-gray-500 text-sm mt-1">Benefícios exclusivos para clientes Relm</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Carregando...</div>
        ) : benefits.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <p className="text-5xl mb-4">🎁</p>
            <p className="text-gray-500">Nenhuma vantagem disponível no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benefits.map((b) => (
              <div key={b.id} className="bg-white rounded-xl shadow p-6">
                <div className="flex items-start gap-3">
                  <div className="text-3xl shrink-0">🎁</div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-1">{b.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{b.description}</p>
                    {b.terms && (
                      <p className="text-xs text-gray-400 italic border-t pt-2">{b.terms}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Válido até {new Date(b.validUntil).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
