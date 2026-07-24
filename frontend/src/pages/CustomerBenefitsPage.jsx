import { useQuery } from '@tanstack/react-query';
import { MdCardGiftcard } from 'react-icons/md';
import { benefitsAPI } from '../services/api';
import { Card, PageHeader } from '../components/ui';

export default function CustomerBenefitsPage() {
  // Feed segmentado: o token CLIENTE resolve o audience no backend, retornando
  // apenas benefícios direcionados a CLIENTE (ou sem direcionamento = todos).
  const { data: benefits = [], isLoading } = useQuery({
    queryKey: ['customer-benefits'],
    queryFn: benefitsAPI.feed,
  });

  return (
    <div className="py-8 px-6">
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title="Vantagens"
          subtitle="Benefícios exclusivos para clientes Relm"
        />

        {isLoading ? (
          <div className="flex justify-center py-16">
            <span className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : benefits.length === 0 ? (
          <Card className="p-12 text-center flex flex-col items-center">
            <MdCardGiftcard className="h-12 w-12 text-gray-300 dark:text-slate-700 mb-4" />
            <p className="text-gray-500 dark:text-slate-400">Nenhuma vantagem disponível no momento.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((b) => (
              <Card key={b.id} className="hover:shadow-md transition-shadow group">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-[#0A1929]/10 dark:bg-[#2196F3]/20 text-[#0A1929] dark:text-[#2196F3] shrink-0">
                    <MdCardGiftcard className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-title font-bold text-gray-900 dark:text-slate-100 mb-1 text-base">{b.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">{b.description}</p>
                    {b.terms && (
                      <p className="text-xs text-gray-400 dark:text-slate-500 italic border-t border-gray-100 dark:border-slate-800/60 pt-2 mb-2">{b.terms}</p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-slate-500">
                      Válido até {new Date(b.validUntil).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
