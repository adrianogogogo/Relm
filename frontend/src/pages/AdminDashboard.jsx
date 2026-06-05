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
    RECEBIDO: 'bg-blue-100 text-blue-800',
    EM_ANALISE: 'bg-yellow-100 text-yellow-800',
    AGUARDANDO_CLIENTE: 'bg-orange-100 text-orange-800',
    APROVADO: 'bg-green-100 text-green-800',
    REPROVADO: 'bg-red-100 text-red-800',
    FINALIZADO: 'bg-gray-100 text-gray-800',
    CANCELADO: 'bg-gray-100 text-gray-600',
  };

  const metricCards = [
    {
      label: 'Garantias Ativas',
      value: stats?.warranties?.pending ?? '—',
      color: 'bg-primary',
      link: '/admin/warranties',
    },
    {
      label: 'Clientes',
      value: stats?.totalCustomers ?? '—',
      color: 'bg-secondary',
      link: '/admin/customers',
    },
    {
      label: 'Lojas Parceiras',
      value: stats?.totalActiveStores ?? '—',
      color: 'bg-purple-500',
      link: '/admin/stores',
    },
    {
      label: 'Eventos Ativos',
      value: stats?.totalActiveEvents ?? '—',
      color: 'bg-orange-500',
      link: '/admin/events',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h1 className="text-4xl font-bold mb-2">Dashboard Administrativo</h1>
            <p className="text-gray-600">
              Bem-vindo, <span className="font-semibold">{user?.name}</span>!
            </p>
            <p className="text-sm text-gray-500">Perfil: {user?.role}</p>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {metricCards.map((card) => (
              <Link key={card.label} to={card.link} className={`card ${card.color} text-white hover:opacity-90 transition-opacity`}>
                <h3 className="text-3xl font-bold mb-2">
                  {isLoading ? '...' : card.value}
                </h3>
                <p className="opacity-90">{card.label}</p>
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
    </div>
  );
}
