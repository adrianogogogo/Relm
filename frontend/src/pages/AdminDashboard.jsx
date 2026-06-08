import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Users, Store, Calendar, Gift, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/reports/dashboard-stats').then((res) => res.data),
  });

  const isRelm = ['ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA'].includes(user?.role);

  const statusLabel = {
    RECEBIDO: 'Recebido',
    EM_ANALISE: 'Em Análise',
    AGUARDANDO_CLIENTE: 'Aguardando Cliente',
    APROVADO: 'Aprovado',
    REPROVADO: 'Reprovado',
    FINALIZADO: 'Finalizado',
    CANCELADO: 'Cancelado',
  };

  const statusColor = {
    RECEBIDO: 'bg-blue-50 text-blue-700 dark:bg-blue-900/35 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40',
    EM_ANALISE: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/35 dark:text-yellow-400 border border-yellow-200/50 dark:border-yellow-800/40',
    AGUARDANDO_CLIENTE: 'bg-orange-50 text-orange-700 dark:bg-orange-900/35 dark:text-orange-400 border border-orange-200/50 dark:border-orange-800/40',
    APROVADO: 'bg-green-50 text-green-700 dark:bg-green-900/35 dark:text-green-400 border border-green-200/50 dark:border-green-800/40',
    REPROVADO: 'bg-red-50 text-red-700 dark:bg-red-900/35 dark:text-red-400 border border-red-200/50 dark:border-red-800/40',
    FINALIZADO: 'bg-gray-50 text-gray-700 dark:bg-slate-800 dark:text-slate-300 border border-gray-200/50 dark:border-slate-700/40',
    CANCELADO: 'bg-gray-50 text-gray-500 dark:bg-slate-800 dark:text-slate-400 border border-gray-200/50 dark:border-slate-700/40',
  };

  const metricCards = [
    {
      label: 'Garantias Ativas',
      value: stats?.warranties?.pending ?? '—',
      icon: Shield,
      color: 'text-primary dark:text-secondary',
      bgColor: 'bg-primary/10 dark:bg-secondary/15',
      link: '/admin/warranties',
    },
    {
      label: 'Clientes',
      value: stats?.totalCustomers ?? '—',
      icon: Users,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10 dark:bg-secondary/15',
      link: '/admin/customers',
    },
    {
      label: 'Lojas Parceiras',
      value: stats?.totalActiveStores ?? '—',
      icon: Store,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50/50 dark:bg-purple-500/15',
      link: '/admin/stores',
    },
    {
      label: 'Eventos Ativos',
      value: stats?.totalActiveEvents ?? '—',
      icon: Calendar,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50/50 dark:bg-orange-500/15',
      link: '/admin/events',
    },
  ];

  return (
    <div className="py-8 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-sm border border-gray-100 dark:border-slate-800/60 rounded-2xl p-6 mb-6 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100 mb-1">
            Dashboard Administrativo
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm">
            Bem-vindo, <span className="font-semibold text-gray-800 dark:text-slate-200">{user?.name}</span>! • Perfil: {user?.role}
          </p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metricCards.map((card) => (
            <Link
              key={card.label}
              to={card.link}
              className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/60 rounded-2xl p-5 shadow-sm hover:scale-[1.02] hover:shadow-md transition-all duration-300 flex items-center justify-between group"
            >
              <div>
                <p className="text-3xl font-extrabold text-gray-800 dark:text-slate-100">
                  {isLoading ? '...' : card.value}
                </p>
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mt-1">{card.label}</p>
              </div>
              <div className={`p-3 rounded-xl ${card.bgColor} ${card.color} shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                <card.icon size={22} />
              </div>
            </Link>
          ))}
        </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Quick Actions */}
            <div className="card">
              <h2 className="text-2xl font-bold mb-4">Ações Rápidas</h2>
              <div className="space-y-3">
                {isRelm && (
                  <Link to="/admin/warranties" className="btn btn-outline w-full text-left flex items-center gap-2">
                    <ClipboardList size={18} /> Gerenciar Garantias
                  </Link>
                )}
                <Link to="/admin/customers" className="btn btn-outline w-full text-left flex items-center gap-2">
                  <Users size={18} /> Gerenciar Clientes
                </Link>
                <Link to="/admin/stores" className="btn btn-outline w-full text-left flex items-center gap-2">
                  <Store size={18} /> Gerenciar Lojas
                </Link>
                {isRelm && (
                  <>
                    <Link to="/admin/events" className="btn btn-outline w-full text-left flex items-center gap-2">
                      <Calendar size={18} /> Gerenciar Eventos
                    </Link>
                    <Link to="/admin/benefits" className="btn btn-outline w-full text-left flex items-center gap-2">
                      <Gift size={18} /> Gerenciar Benefícios
                    </Link>
                    <Link to="/admin/insurances" className="btn btn-outline w-full text-left flex items-center gap-2">
                      <Shield size={18} /> Cotações de Seguro
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Warranty Status Breakdown — apenas para perfis Relm */}
            <div className={`card ${!isRelm ? 'hidden' : ''}`}>
              <h2 className="text-2xl font-bold mb-4">Garantias por Status</h2>
              {isLoading ? (
                <p className="text-gray-500">Carregando...</p>
              ) : stats?.warranties?.byStatus ? (
                <div className="space-y-2">
                  {Object.entries(stats.warranties.byStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusColor[status] || 'bg-gray-100 text-gray-700'}`}>
                        {statusLabel[status] || status}
                      </span>
                      <span className="font-bold text-gray-800">{count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Sem dados disponíveis</p>
              )}
            </div>
          </div>

          {/* Recent Warranties — apenas para perfis Relm */}
          {isRelm && <div className="card">
            <h2 className="text-2xl font-bold mb-4">Garantias Recentes</h2>
            {isLoading ? (
              <p className="text-gray-500">Carregando...</p>
            ) : stats?.recentWarranties?.length > 0 ? (
              <div className="space-y-3">
                {stats.recentWarranties.map((warranty) => (
                  <div key={warranty.id} className="flex items-center justify-between border-b pb-3 last:border-b-0">
                    <div>
                      <p className="font-semibold text-gray-800">{warranty.protocolNumber}</p>
                      <p className="text-sm text-gray-500">{warranty.customer?.fullName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusColor[warranty.status] || 'bg-gray-100'}`}>
                        {statusLabel[warranty.status] || warranty.status}
                      </span>
                      <p className="text-xs text-gray-400">
                        {new Date(warranty.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                      <Link to="/admin/warranties" className="text-primary text-xs hover:underline">
                        Ver →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Nenhuma garantia encontrada</p>
            )}
          </div>}
        </div>
      </div>
  );
}
