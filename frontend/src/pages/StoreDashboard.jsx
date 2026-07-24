import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { customersAPI, warrantyAPI, insuranceAPI } from '../services/api';
import { MdPeople, MdVerifiedUser, MdDescription, MdInventory2 } from 'react-icons/md';
import { useAuthStore } from '../store/authStore';
import { Card, PageHeader, StatusChip, StatCard } from '../components/ui';

const STATUS_LABEL = {
  RECEBIDO: 'Recebido',
  EM_ANALISE: 'Em Análise',
  AGUARDANDO_CLIENTE: 'Aguardando Cliente',
  APROVADO: 'Aprovado',
  REPROVADO: 'Reprovado',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
};

const STATUS_VARIANT = {
  RECEBIDO: 'info',
  EM_ANALISE: 'warning',
  AGUARDANDO_CLIENTE: 'warning',
  APROVADO: 'success',
  REPROVADO: 'error',
  FINALIZADO: 'neutral',
  CANCELADO: 'neutral',
};

const StoreDashboard = () => {
  const user = useAuthStore((state) => state.user);
  const storeId = user?.storeId;

  // Fetch store-specific data
  const { data: customersResponse, isLoading: loadingCustomers } = useQuery({
    queryKey: ['store-customers', storeId],
    queryFn: () => customersAPI.getAll({ storeId }),
    enabled: !!storeId,
  });

  // O endpoint agora retorna { data, total, page, pageSize } (paginado).
  const customersTotal = Array.isArray(customersResponse)
    ? customersResponse.length
    : customersResponse?.total ?? 0;

  const { data: warranties, isLoading: loadingWarranties } = useQuery({
    queryKey: ['store-warranties', storeId],
    queryFn: () => warrantyAPI.getAll({ storeId }),
    enabled: !!storeId,
  });

  const { data: insurances } = useQuery({
    queryKey: ['store-insurances', storeId],
    queryFn: () => insuranceAPI.getAll({ storeId }),
    enabled: !!storeId,
  });

  if (!user) {
    return null;
  }

  const stats = [
    {
      label: 'Clientes',
      value: customersTotal,
      icon: MdPeople,
      color: '#0A1929',
      link: '/loja/clientes',
    },
    {
      label: 'Seguros',
      value: insurances?.length || 0,
      icon: MdDescription,
      color: '#2196F3',
      link: '/loja/seguros',
    },
  ];

  const quickActions = [
    { to: '/loja/clientes/novo', label: 'Novo Cliente', icon: MdPeople, color: '#0A1929' },
    { to: '/loja/seguros', label: 'Ver Seguros', icon: MdDescription, color: '#183757' },
    { to: '/loja/produtos', label: 'Produtos', icon: MdInventory2, color: '#2196F3' },
  ];

  return (
    <div className="py-8 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <PageHeader
          title="Portal da Loja"
          subtitle={
            <>
              Bem-vindo,{' '}
              <span className="font-semibold text-gray-800 dark:text-slate-200">{user.name}</span>
              {user.store?.tradeName ? ` • ${user.store.tradeName}` : ''}
            </>
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          {stats.map((stat) => (
            <Link key={stat.label} to={stat.link} className="block group">
              <StatCard
                title={stat.label}
                value={loadingCustomers ? '...' : stat.value}
                icon={stat.icon}
                color={stat.color}
                className="h-full group-hover:shadow-md transition-shadow"
              />
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <h2 className="font-title text-xl font-bold mb-4 text-gray-900 dark:text-slate-100">
            Ações Rápidas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <span
                  className="stat-icon-box shrink-0 rounded-lg p-2"
                  style={{ backgroundColor: `${action.color}26`, color: action.color }}
                >
                  <action.icon size={18} />
                </span>
                <span className="font-medium text-gray-800 dark:text-slate-200">{action.label}</span>
              </Link>
            ))}
          </div>
        </Card>


      </div>
    </div>
  );
};

export default StoreDashboard;
