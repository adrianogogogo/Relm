import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Shield, FileText, Calendar, User, MapPin, Gift } from 'lucide-react';
import { useCustomerAuthStore } from '../store/customerAuthStore';
import { customerPortalAPI } from '../services/api';

const WARRANTY_STATUS_LABEL = {
  RECEBIDO: 'Recebido',
  EM_ANALISE: 'Em Análise',
  AGUARDANDO_CLIENTE: 'Aguardando',
  APROVADO: 'Aprovado',
  REPROVADO: 'Reprovado',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
};

const WARRANTY_STATUS_COLOR = {
  RECEBIDO: 'bg-blue-50 text-blue-700 dark:bg-blue-900/35 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40',
  EM_ANALISE: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/35 dark:text-yellow-400 border border-yellow-200/50 dark:border-yellow-800/40',
  AGUARDANDO_CLIENTE: 'bg-orange-50 text-orange-700 dark:bg-orange-900/35 dark:text-orange-400 border border-orange-200/50 dark:border-orange-800/40',
  APROVADO: 'bg-green-50 text-green-700 dark:bg-green-900/35 dark:text-green-400 border border-green-200/50 dark:border-green-800/40',
  REPROVADO: 'bg-red-50 text-red-700 dark:bg-red-900/35 dark:text-red-400 border border-red-200/50 dark:border-red-800/40',
  FINALIZADO: 'bg-gray-50 text-gray-700 dark:bg-slate-800 dark:text-slate-300 border border-gray-200/50 dark:border-slate-700/40',
  CANCELADO: 'bg-gray-50 text-gray-500 dark:bg-slate-800 dark:text-slate-400 border border-gray-200/50 dark:border-slate-700/40',
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
    { label: 'Garantias', value: warranties.length, icon: Shield, color: 'text-primary dark:text-secondary', bgColor: 'bg-primary/10 dark:bg-secondary/15', link: '/cliente/garantias' },
    { label: 'Eventos', value: events.length, icon: Calendar, color: 'text-secondary', bgColor: 'bg-secondary/10 dark:bg-secondary/15', link: '/cliente/eventos' },
    { label: 'Vantagens', value: benefits.length, icon: Gift, color: 'text-purple-500', bgColor: 'bg-purple-50/50 dark:bg-purple-500/15', link: '/cliente/vantagens' },
    { label: 'Cotações', value: quotes.length, icon: FileText, color: 'text-orange-500', bgColor: 'bg-orange-50/50 dark:bg-orange-500/15', link: '/cliente/seguros' },
  ];

  return (
    <div className="py-8 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-sm border border-gray-100 dark:border-slate-800/60 rounded-2xl p-6 mb-6 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100 mb-1">
            Olá, {customer?.fullName?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm">Bem-vindo ao seu portal Relm Care+</p>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {metrics.map((card) => (
            <Link
              key={card.label}
              to={card.link}
              className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/60 rounded-2xl p-5 shadow-sm hover:scale-[1.02] hover:shadow-md transition-all duration-300 flex items-center justify-between group"
            >
              <div>
                <p className="text-3xl font-extrabold text-gray-800 dark:text-slate-100">{card.value}</p>
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mt-1">{card.label}</p>
              </div>
              <div className={`p-3 rounded-xl ${card.bgColor} ${card.color} shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                <card.icon size={22} />
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Garantias recentes */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/60 rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100">Garantias Recentes</h2>
              <Link to="/cliente/garantias" className="text-primary dark:text-secondary text-sm hover:underline">
                Ver todas →
              </Link>
            </div>
            {warranties.length === 0 ? (
              <p className="text-gray-400 dark:text-slate-500 text-sm">Nenhuma garantia registrada.</p>
            ) : (
              <div className="space-y-3">
                {warranties.slice(0, 3).map((w) => (
                  <div key={w.id} className="flex items-center justify-between border-b dark:border-slate-800/60 pb-3 last:border-b-0">
                    <div>
                      <p className="font-semibold text-sm text-gray-800 dark:text-slate-200">{w.protocolNumber}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{w.product?.model}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${WARRANTY_STATUS_COLOR[w.status]}`}>
                      {WARRANTY_STATUS_LABEL[w.status] || w.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Próximos eventos */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/60 rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100">Meus Eventos</h2>
              <Link to="/cliente/eventos" className="text-primary dark:text-secondary text-sm hover:underline">
                Ver todos →
              </Link>
            </div>
            {events.length === 0 ? (
              <p className="text-gray-400 dark:text-slate-500 text-sm">Você não está inscrito em nenhum evento.</p>
            ) : (
              <div className="space-y-3">
                {events.slice(0, 3).map((reg) => (
                  <div key={reg.id} className="border-b dark:border-slate-800/60 pb-3 last:border-b-0">
                    <p className="font-semibold text-sm text-gray-800 dark:text-slate-200">{reg.event.title}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin size={12} className="text-gray-400" /> {reg.event.location} •{' '}
                      {new Date(reg.event.startAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Vantagens disponíveis */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/60 rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100">Vantagens para Você</h2>
              <Link to="/cliente/vantagens" className="text-primary dark:text-secondary text-sm hover:underline">
                Ver todas →
              </Link>
            </div>
            {benefits.length === 0 ? (
              <p className="text-gray-400 dark:text-slate-500 text-sm">Nenhuma vantagem disponível no momento.</p>
            ) : (
              <div className="space-y-3">
                {benefits.slice(0, 3).map((b) => (
                  <div key={b.id} className="border-b dark:border-slate-800/60 pb-3 last:border-b-0">
                    <p className="font-semibold text-sm text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Gift size={16} className="text-purple-500 shrink-0" /> {b.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-1 mt-1">{b.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ações rápidas */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/60 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-4">Ações Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Link to="/garantia" className="btn btn-outline flex items-center gap-2 justify-start font-medium py-3 rounded-xl border border-gray-200 dark:border-slate-700/80 dark:text-slate-200 text-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all">
                <Shield size={18} className="text-primary dark:text-secondary shrink-0" /> Registrar garantia
              </Link>
              <Link to="/seguro" className="btn btn-outline flex items-center gap-2 justify-start font-medium py-3 rounded-xl border border-gray-200 dark:border-slate-700/80 dark:text-slate-200 text-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all">
                <FileText size={18} className="text-primary dark:text-secondary shrink-0" /> Cotação de seguro
              </Link>
              <Link to="/eventos" className="btn btn-outline flex items-center gap-2 justify-start font-medium py-3 rounded-xl border border-gray-200 dark:border-slate-700/80 dark:text-slate-200 text-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all">
                <Calendar size={18} className="text-primary dark:text-secondary shrink-0" /> Ver eventos
              </Link>
              <Link to="/cliente/perfil" className="btn btn-outline flex items-center gap-2 justify-start font-medium py-3 rounded-xl border border-gray-200 dark:border-slate-700/80 dark:text-slate-200 text-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all">
                <User size={18} className="text-primary dark:text-secondary shrink-0" /> Editar meu perfil
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
