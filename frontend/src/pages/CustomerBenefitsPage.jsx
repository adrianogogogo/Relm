import { useQuery } from '@tanstack/react-query';
import { Gift } from 'lucide-react';
import { customerPortalAPI } from '../services/api';

export default function CustomerBenefitsPage() {
  const { data: benefits = [], isLoading } = useQuery({
    queryKey: ['customer-benefits'],
    queryFn: customerPortalAPI.getBenefits,
  });

  return (
    <div className="py-8 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100">Vantagens</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Benefícios exclusivos para clientes Relm</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400 dark:text-slate-500">Carregando...</div>
        ) : benefits.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/60 rounded-2xl shadow-sm p-12 text-center flex flex-col items-center">
            <Gift className="h-12 w-12 text-gray-300 dark:text-slate-700 mb-4" />
            <p className="text-gray-500 dark:text-slate-400">Nenhuma vantagem disponível no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((b) => (
              <div key={b.id} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/60 rounded-2xl shadow-sm p-6 hover:scale-[1.02] hover:shadow-md transition-all duration-300 group">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-500 shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Gift className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 dark:text-slate-100 mb-1 text-base">{b.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">{b.description}</p>
                    {b.terms && (
                      <p className="text-xs text-gray-400 dark:text-slate-500 italic border-t dark:border-slate-800/60 pt-2 mb-2">{b.terms}</p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-slate-500">
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
