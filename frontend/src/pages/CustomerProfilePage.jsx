import { useQuery } from '@tanstack/react-query';
import { customerPortalAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Card, PageHeader } from '../components/ui';

export default function CustomerProfilePage() {
  const { user } = useAuthStore();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['customer-profile'],
    queryFn: customerPortalAPI.getMe,
  });

  const data = profile || { fullName: user?.name, email: user?.email };

  const fields = [
    { label: 'Nome completo', value: data?.fullName },
    { label: 'E-mail', value: data?.email },
    { label: 'Telefone', value: data?.phone },
    { label: 'CPF', value: data?.cpf || '—' },
    { label: 'Endereço', value: data?.address || '—' },
    { label: 'Cidade', value: data?.city || '—' },
    { label: 'Estado', value: data?.state || '—' },
    { label: 'CEP', value: data?.zipCode || '—' },
  ];

  return (
    <div className="py-8 px-6">
      <div className="max-w-2xl mx-auto">
        <PageHeader title="Meu Perfil" subtitle="Seus dados cadastrais na Relm Care+" />

        {isLoading ? (
          <div className="flex justify-center py-16">
            <span className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : (
          <Card>
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-slate-800/60">
              <div className="w-16 h-16 rounded-full bg-primary/10 dark:bg-primary-400/15 flex items-center justify-center text-2xl font-bold text-primary dark:text-primary-400 shrink-0">
                {data?.fullName?.charAt(0)?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-gray-800 dark:text-slate-100 truncate">{data?.fullName}</p>
                <p className="text-gray-500 dark:text-slate-400 text-sm truncate">{data?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map((f) => (
                <div key={f.label}>
                  <p className="text-xs text-gray-400 dark:text-slate-500 uppercase font-semibold mb-1">{f.label}</p>
                  <p className="text-gray-800 dark:text-slate-200">{f.value || '—'}</p>
                </div>
              ))}
            </div>

            {data?.createdAt && (
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-6 pt-4 border-t border-gray-100 dark:border-slate-800/60">
                Cliente desde {new Date(data.createdAt).toLocaleDateString('pt-BR')}
              </p>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
