import { useQuery } from '@tanstack/react-query';
import { customerPortalAPI } from '../services/api';
import { useCustomerAuthStore } from '../store/customerAuthStore';

export default function CustomerProfilePage() {
  const { customer } = useCustomerAuthStore();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['customer-profile'],
    queryFn: customerPortalAPI.getMe,
  });

  const data = profile || customer;

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
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Meu Perfil</h1>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Carregando...</div>
        ) : (
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                {data?.fullName?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="text-xl font-bold text-gray-800">{data?.fullName}</p>
                <p className="text-gray-500 text-sm">{data?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map((f) => (
                <div key={f.label}>
                  <p className="text-xs text-gray-400 uppercase font-semibold mb-1">{f.label}</p>
                  <p className="text-gray-800">{f.value || '—'}</p>
                </div>
              ))}
            </div>

            {data?.createdAt && (
              <p className="text-xs text-gray-400 mt-6 pt-4 border-t">
                Cliente desde {new Date(data.createdAt).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
