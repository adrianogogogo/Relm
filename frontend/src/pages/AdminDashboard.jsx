import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MdAssignment, MdPeople, MdStore, MdEvent, MdCardGiftcard, MdVerifiedUser, MdDescription } from 'react-icons/md';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { Card, PageHeader, StatusChip, StatCard, Button } from '../components/ui';

export default function AdminDashboard() {
  const { user } = useAuthStore();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/reports/dashboard-stats').then((res) => res.data),
  });

  const hasAccess = (allowedRoles) => allowedRoles.includes(user?.role);

  const statusLabel = {
    RECEBIDO: 'Recebido',
    EM_ANALISE: 'Em Análise',
    AGUARDANDO_CLIENTE: 'Aguardando Cliente',
    APROVADO: 'Aprovado',
    REPROVADO: 'Reprovado',
    FINALIZADO: 'Finalizado',
    CANCELADO: 'Cancelado',
  };

  // Mapeia status -> variante semantica do StatusChip
  const statusVariant = {
    RECEBIDO: 'info',
    EM_ANALISE: 'warning',
    AGUARDANDO_CLIENTE: 'warning',
    APROVADO: 'success',
    REPROVADO: 'error',
    FINALIZADO: 'neutral',
    CANCELADO: 'neutral',
  };

  const metricCards = [
    {
      label: 'Clientes',
      value: stats?.totalCustomers ?? '—',
      icon: MdPeople,
      color: '#2d3a4a',
      link: '/admin/customers',
      roles: ['ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA'],
    },
    {
      label: 'Lojas Parceiras',
      value: stats?.totalActiveStores ?? '—',
      icon: MdStore,
      color: '#9C27B0',
      link: '/admin/stores',
      roles: ['ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA', 'DISTRIBUIDOR'],
    },
    {
      label: 'Eventos Ativos',
      value: stats?.totalActiveEvents ?? '—',
      icon: MdEvent,
      color: '#FF9800',
      link: '/admin/events',
      roles: ['ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM'],
    },
  ].filter((card) => card.roles.includes(user?.role));

  return (
    <div className="py-8 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <PageHeader
          title="Dashboard Administrativo"
          subtitle={
            <>
              Bem-vindo,{' '}
              <span className="font-semibold text-gray-800 dark:text-slate-200">{user?.name}</span>! • Perfil: {user?.role}
            </>
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {metricCards.map((card) => (
            <Link key={card.label} to={card.link} className="block group">
              <StatCard
                title={card.label}
                value={isLoading ? '...' : card.value}
                icon={card.icon}
                color={card.color}
                className="h-full group-hover:shadow-md transition-shadow"
              />
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 mb-6">
          {/* Quick Actions */}
          <Card>
            <h2 className="font-title text-xl font-bold mb-4 text-gray-900 dark:text-slate-100">Ações Rápidas</h2>
            <div className="space-y-3">
              {hasAccess(['ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA']) && (
                <Link to="/admin/customers" className="btn btn-outline w-full justify-start">
                  <MdPeople size={18} /> Gerenciar Clientes
                </Link>
              )}
              {hasAccess(['ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'DISTRIBUIDOR']) && (
                <Link to="/admin/stores" className="btn btn-outline w-full justify-start">
                  <MdStore size={18} /> Gerenciar Lojas
                </Link>
              )}
              {hasAccess(['ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM']) && (
                <Link to="/admin/events" className="btn btn-outline w-full justify-start">
                  <MdEvent size={18} /> Gerenciar Eventos
                </Link>
              )}
              {hasAccess(['ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM']) && (
                <Link to="/admin/benefits" className="btn btn-outline w-full justify-start">
                  <MdCardGiftcard size={18} /> Gerenciar Benefícios
                </Link>
              )}
              {hasAccess(['ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA']) && (
                <Link to="/admin/insurances" className="btn btn-outline w-full justify-start">
                  <MdDescription size={18} /> Cotações de Seguro
                </Link>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
