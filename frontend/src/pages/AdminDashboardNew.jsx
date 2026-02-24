import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { customersAPI, storesAPI, eventsAPI, membershipAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function AdminDashboardNew() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const isAdmin = user?.role === 'ADMIN_RELM' || user?.role === 'GERENTE_RELM';

  // Buscar dados para as métricas
  const { data: customers } = useQuery({
    queryKey: ['customers-count'],
    queryFn: () => customersAPI.getAll().then((res) => res.data || res),
  });

  const { data: stores } = useQuery({
    queryKey: ['stores-count'],
    queryFn: () => storesAPI.getAll().then((res) => res.data || res),
    enabled: isAdmin,
  });

  const { data: events } = useQuery({
    queryKey: ['events-count'],
    queryFn: () => eventsAPI.getAll().then((res) => res.data),
  });

  const { data: memberships } = useQuery({
    queryKey: ['memberships-count'],
    queryFn: () => membershipAPI.getAll().then((res) => res.data),
    enabled: isAdmin,
  });

  const stats = [
    {
      title: 'Total de Clientes',
      value: customers?.length || 0,
      icon: '👥',
      color: 'bg-blue-500',
      link: '/admin/customers',
    },
    {
      title: 'Lojas Cadastradas',
      value: stores?.length || 0,
      icon: '🏪',
      color: 'bg-green-500',
      link: '/admin/stores',
      showIf: isAdmin,
    },
    {
      title: 'Eventos Ativos',
      value: events?.filter((e) => e.active).length || 0,
      icon: '📅',
      color: 'bg-purple-500',
      link: '/admin/events',
    },
    {
      title: 'Membros do Clube',
      value: memberships?.length || 0,
      icon: '💎',
      color: 'bg-yellow-500',
      link: '/admin/memberships',
      showIf: isAdmin,
    },
  ].filter((stat) => stat.showIf !== false);

  // Distribuição por tier
  const tierDistribution = memberships
    ? [
        {
          tier: 'BRONZE',
          count: memberships.filter((m) => m.tier === 'BRONZE').length,
          color: 'bg-orange-500',
        },
        {
          tier: 'SILVER',
          count: memberships.filter((m) => m.tier === 'SILVER').length,
          color: 'bg-gray-400',
        },
        {
          tier: 'GOLD',
          count: memberships.filter((m) => m.tier === 'GOLD').length,
          color: 'bg-yellow-500',
        },
        {
          tier: 'DIAMOND',
          count: memberships.filter((m) => m.tier === 'DIAMOND').length,
          color: 'bg-blue-500',
        },
      ]
    : [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Visão Geral
        </h1>
        <p className="text-gray-600">
          Acompanhe as principais métricas do sistema
        </p>
      </div>

      {/* CARDS DE ESTATÍSTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.title}
            onClick={() => navigate(stat.link)}
            className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-2">{stat.title}</p>
                <p className="text-4xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.color} text-white p-4 rounded-full text-3xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* DISTRIBUIÇÃO DE TIERS */}
      {isAdmin && tierDistribution.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Distribuição de Memberships
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {tierDistribution.map((tier) => (
              <div key={tier.tier} className="text-center">
                <div className={`${tier.color} text-white rounded-lg p-6 mb-2`}>
                  <p className="text-3xl font-bold">{tier.count}</p>
                </div>
                <p className="text-sm font-medium text-gray-700">{tier.tier}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AÇÕES RÁPIDAS */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/admin/customers/new')}
            className="flex items-center gap-3 p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <span className="text-3xl">➕</span>
            <div className="text-left">
              <p className="font-medium text-gray-900">Novo Cliente</p>
              <p className="text-sm text-gray-600">Cadastrar cliente</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/events/new')}
            className="flex items-center gap-3 p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
          >
            <span className="text-3xl">📅</span>
            <div className="text-left">
              <p className="font-medium text-gray-900">Novo Evento</p>
              <p className="text-sm text-gray-600">Criar evento</p>
            </div>
          </button>

          {isAdmin && (
            <button
              onClick={() => navigate('/admin/stores/new')}
              className="flex items-center gap-3 p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors"
            >
              <span className="text-3xl">🏪</span>
              <div className="text-left">
                <p className="font-medium text-gray-900">Nova Loja</p>
                <p className="text-sm text-gray-600">Cadastrar loja</p>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
