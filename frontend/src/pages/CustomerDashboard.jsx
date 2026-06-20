import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Shield, FileText, Calendar, User, MapPin, Gift } from 'lucide-react';
import { useCustomerAuthStore } from '../store/customerAuthStore';
import { customerPortalAPI } from '../services/api';
import { Card, PageHeader, StatCard, StatusChip } from '../components/ui';

const WARRANTY_STATUS_LABEL = {
  RECEBIDO: 'Recebido',
  EM_ANALISE: 'Em Análise',
  AGUARDANDO_CLIENTE: 'Aguardando',
  APROVADO: 'Aprovado',
  REPROVADO: 'Reprovado',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
};

// Mapeia status -> variante semantica do StatusChip
const WARRANTY_STATUS_VARIANT = {
  RECEBIDO: 'info',
  EM_ANALISE: 'warning',
  AGUARDANDO_CLIENTE: 'warning',
  APROVADO: 'success',
  REPROVADO: 'error',
  FINALIZADO: 'neutral',
  CANCELADO: 'neutral',
};

export default function CustomerDashboard() {
  const { customer } = useCustomerAuthStore();

  const { data: warranties = [] } = useQuery({
    queryKey: ['customer-warranties'],
    queryFn: customerPortalAPI.getWarranties,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['customer-events'],
    queryFn: customerPortalAPI.getEvents,
  });

  const { data: benefits = [] } = useQuery({
    queryKey: ['customer-benefits'],
    queryFn: customerPortalAPI.getBenefits,
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ['customer-quotes'],
    queryFn: customerPortalAPI.getInsuranceQuotes,
  });

  const metrics = [
    { label: 'Garantias', value: warranties.length, icon: Shield, color: '#1565C0', link: '/cliente/garantias' },
    { label: 'Eventos', value: events.length, icon: Calendar, color: '#2d3a4a', link: '/cliente/eventos' },
    { label: 'Vantagens', value: benefits.length, icon: Gift, color: '#9C27B0', link: '/cliente/vantagens' },
    { label: 'Cotações', value: quotes.length, icon: FileText, color: '#FF9800', link: '/cliente/seguros' },
  ];

  return (
    <div className="py-8 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <PageHeader
          title={`Olá, ${customer?.fullName?.split(' ')[0] || 'cliente'}! 👋`}
          subtitle="Bem-vindo ao seu portal Relm Care+"
        />

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {metrics.map((card) => (
            <Link key={card.label} to={card.link} className="block group">
              <StatCard
                title={card.label}
                value={card.value}
                icon={card.icon}
                color={card.color}
                className="h-full group-hover:shadow-md transition-shadow"
              />
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Garantias recentes */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-title text-lg font-bold text-gray-900 dark:text-slate-100">Garantias Recentes</h2>
              <Link to="/cliente/garantias" className="text-primary dark:text-primary-400 text-sm hover:underline">
                Ver todas →
              </Link>
            </div>
            {warranties.length === 0 ? (
              <p className="text-gray-400 dark:text-slate-500 text-sm">Nenhuma garantia registrada.</p>
            ) : (
              <div className="space-y-3">
                {warranties.slice(0, 3).map((w) => (
                  <div key={w.id} className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3 last:border-b-0">
                    <div>
                      <p className="font-semibold text-sm text-gray-800 dark:text-slate-200">{w.protocolNumber}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{w.product?.model}</p>
                    </div>
                    <StatusChip
                      label={WARRANTY_STATUS_LABEL[w.status] || w.status}
                      variant={WARRANTY_STATUS_VARIANT[w.status] || 'neutral'}
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Próximos eventos */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-title text-lg font-bold text-gray-900 dark:text-slate-100">Meus Eventos</h2>
              <Link to="/cliente/eventos" className="text-primary dark:text-primary-400 text-sm hover:underline">
                Ver todos →
              </Link>
            </div>
            {events.length === 0 ? (
              <p className="text-gray-400 dark:text-slate-500 text-sm">Você não está inscrito em nenhum evento.</p>
            ) : (
              <div className="space-y-3">
                {events.slice(0, 3).map((reg) => (
                  <div key={reg.id} className="border-b border-gray-100 dark:border-slate-800 pb-3 last:border-b-0">
                    <p className="font-semibold text-sm text-gray-800 dark:text-slate-200">{reg.event.title}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin size={12} className="text-gray-400" /> {reg.event.location} •{' '}
                      {new Date(reg.event.startAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Vantagens disponíveis */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-title text-lg font-bold text-gray-900 dark:text-slate-100">Vantagens para Você</h2>
              <Link to="/cliente/vantagens" className="text-primary dark:text-primary-400 text-sm hover:underline">
                Ver todas →
              </Link>
            </div>
            {benefits.length === 0 ? (
              <p className="text-gray-400 dark:text-slate-500 text-sm">Nenhuma vantagem disponível no momento.</p>
            ) : (
              <div className="space-y-3">
                {benefits.slice(0, 3).map((b) => (
                  <div key={b.id} className="border-b border-gray-100 dark:border-slate-800 pb-3 last:border-b-0">
                    <p className="font-semibold text-sm text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Gift size={16} className="text-purple-500 shrink-0" /> {b.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-1 mt-1">{b.description}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Ações rápidas */}
          <Card>
            <h2 className="font-title text-lg font-bold text-gray-900 dark:text-slate-100 mb-4">Ações Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Link to="/garantia" className="btn btn-outline justify-start">
                <Shield size={18} /> Registrar garantia
              </Link>
              <Link to="/seguro" className="btn btn-outline justify-start">
                <FileText size={18} /> Cotação de seguro
              </Link>
              <Link to="/eventos" className="btn btn-outline justify-start">
                <Calendar size={18} /> Ver eventos
              </Link>
              <Link to="/cliente/perfil" className="btn btn-outline justify-start">
                <User size={18} /> Editar meu perfil
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
