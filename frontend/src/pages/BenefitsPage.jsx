import { useQuery } from '@tanstack/react-query';
import { benefitsAPI } from '../services/api';
import { PageHeader, StatusChip } from '../components/ui';

export default function BenefitsPage() {
  const { data: benefits, isLoading } = useQuery({
    queryKey: ['benefits'],
    queryFn: () => benefitsAPI.getAll().then((res) => res.data),
  });

  return (
    <div className="min-h-screen bg-app dark:bg-app-dark py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <PageHeader
            title="Clube de Vantagens"
            subtitle="Benefícios exclusivos para você!"
          />

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Carregando benefícios...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits?.map((benefit) => (
                <div key={benefit.id} className="card">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-title text-xl font-bold">{benefit.title}</h3>
                    {benefit.active && <StatusChip label="Ativo" variant="success" />}
                  </div>
                  <p className="text-gray-600 mb-4">{benefit.description}</p>
                  <div className="text-sm text-gray-500 space-y-2">
                    <p>
                      <strong>Válido:</strong>{' '}
                      {new Date(benefit.validFrom).toLocaleDateString()} até{' '}
                      {new Date(benefit.validUntil).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Perfil:</strong>{' '}
                      {benefit.targetRoles && benefit.targetRoles.length > 0
                        ? benefit.targetRoles.join(', ')
                        : 'Todos'}
                    </p>
                    {benefit.terms && (
                      <p className="text-xs italic mt-2">{benefit.terms}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
