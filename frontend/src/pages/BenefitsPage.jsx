import { useQuery } from '@tanstack/react-query';
import { benefitsAPI } from '../services/api';
import { PageHeader, StatusChip } from '../components/ui';

export default function BenefitsPage() {
  const { data: benefits, isLoading } = useQuery({
    queryKey: ['benefits'],
    queryFn: () => benefitsAPI.getAll().then((res) => res.data),
  });

  const { data: comparison } = useQuery({
    queryKey: ['tiers-comparison'],
    queryFn: () => benefitsAPI.getTiersComparison(),
  });

  return (
    <div className="min-h-screen bg-app dark:bg-app-dark py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <PageHeader
            title="Clube de Vantagens"
            subtitle="Benefícios exclusivos para você!"
          />

          {comparison && comparison.length > 0 && (
            <section className="mb-12">
              <h2 className="font-title text-2xl font-bold mb-1">Comparativo de benefícios</h2>
              <p className="text-sm text-gray-500 italic mb-4">
                Valores ilustrativos, a calibrar na fase de estruturação.
              </p>
              <div className="overflow-x-auto rounded-lg shadow">
                <table className="w-full text-left border-collapse min-w-[640px]">
                  <thead>
                    <tr>
                      <th className="bg-gray-900 text-white px-4 py-3 font-bold uppercase text-sm">Benefício</th>
                      <th className="bg-[#00BCD4] text-white px-4 py-3 font-bold uppercase text-sm text-center">Relm Care</th>
                      <th className="bg-[#D4AF37] text-white px-4 py-3 font-bold uppercase text-sm text-center">Relm Care Plus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((row, i) => (
                      <tr key={row.label} className={i % 2 ? 'bg-gray-50 dark:bg-gray-800/40' : ''}>
                        <td className="px-4 py-3 font-semibold">{row.label}</td>
                        <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">{row.care}</td>
                        <td className="px-4 py-3 text-center font-semibold text-[#B8860B] bg-[#D4AF37]/10">{row.plus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

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
