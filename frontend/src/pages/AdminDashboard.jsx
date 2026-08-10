import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MdAssignment, MdPeople, MdStore, MdEvent, MdCardGiftcard, MdVerifiedUser, MdDescription } from 'react-icons/md';
import { useAuthStore } from '../store/authStore';
import api, { clubReportsAPI } from '../services/api';
import { Card, PageHeader, StatusChip, StatCard, Button } from '../components/ui';

const SCORE_PARTS = [
  { key: 'revenue', label: 'Receita', bar: 'bg-[#2196F3]' },
  { key: 'newCustomers', label: 'Clientes novos', bar: 'bg-emerald-500' },
  { key: 'plusConversion', label: 'Conversão Plus', bar: 'bg-amber-500' },
  { key: 'services', label: 'Serviços', bar: 'bg-violet-500' },
];

/**
 * Ranking de lojas. Mostra a decomposição junto do número — score sozinho não
 * diz o que a loja precisa fazer para subir.
 */
function StoreScoreCard() {
  const { data, isLoading } = useQuery({
    queryKey: ['store-scores'],
    queryFn: () => clubReportsAPI.getStoreScores(),
  });

  if (isLoading) return null;
  const stores = data?.stores || [];
  if (stores.length === 0) return null;

  return (
    <Card className="mb-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-title text-xl font-bold text-gray-900 dark:text-slate-100">
          Score das lojas
        </h2>
        <span className="text-xs text-gray-500 dark:text-slate-400">
          últimos {data.windowDays} dias · relativo à melhor loja
        </span>
      </div>

      <div className="space-y-3">
        {stores.map((store, index) => (
          <div key={store.storeId} className="flex items-center gap-3">
            <span className="w-6 text-xs font-bold text-gray-400 dark:text-slate-500">
              {index + 1}º
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold text-sm text-gray-800 dark:text-slate-100 truncate">
                  {store.tradeName}
                </span>
                <span className="font-mono font-bold text-sm text-[#2196F3]">{store.score}</span>
              </div>
              {/* Barra empilhada: cada faixa é a contribuição de uma dimensão,
                  e a soma delas é exatamente o score. */}
              <div className="mt-1 h-2 w-full rounded-full bg-gray-100 dark:bg-slate-800 flex overflow-hidden">
                {SCORE_PARTS.map((part) => (
                  <div
                    key={part.key}
                    title={`${part.label}: ${store.components[part.key]}`}
                    style={{ width: `${store.components[part.key]}%` }}
                    className={part.bar}
                  />
                ))}
              </div>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">
                R$ {store.metrics.revenueBrl.toFixed(2)} · {store.metrics.newCustomers} novos ·{' '}
                {(store.metrics.plusConversion * 100).toFixed(0)}% Plus ·{' '}
                {store.metrics.servicesCompleted} serviços
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 flex flex-wrap gap-3">
        {SCORE_PARTS.map((part) => (
          <span
            key={part.key}
            className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-slate-400"
          >
            <span className={`h-2 w-2 rounded-full ${part.bar}`} />
            {part.label} (peso {data.weights[part.key]})
          </span>
        ))}
      </div>
    </Card>
  );
}

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

        {/* O endpoint é ADMIN_RELM/GERENTE_RELM — sem o gate, os demais papéis
            comeriam um 403 a cada carga do dashboard. */}
        {hasAccess(['ADMIN_RELM', 'GERENTE_RELM']) && <StoreScoreCard />}

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
