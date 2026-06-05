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
  RECEBIDO: 'bg-blue-100 text-blue-800',
  EM_ANALISE: 'bg-yellow-100 text-yellow-800',
  AGUARDANDO_CLIENTE: 'bg-orange-100 text-orange-800',
  APROVADO: 'bg-green-100 text-green-800',
  REPROVADO: 'bg-red-100 text-red-800',
  FINALIZADO: 'bg-gray-100 text-gray-700',
  CANCELADO: 'bg-gray-100 text-gray-500',
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

  const activeWarranties = warranties.filter(
    (w) => !['FINALIZADO', 'CANCELADO', 'REPROVADO'].includes(w.status)
  );

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-1">
            Olá, {customer?.fullName?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-500 text-sm">Bem-vindo ao seu portal Relm Care+</p>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Garantias', value: warranties.length, color: 'bg-primary', link: '/cliente/garantias' },
            { label: 'Eventos', value: events.length, color: 'bg-secondary', link: '/cliente/eventos' },
            { label: 'Vantagens', value: benefits.length, color: 'bg-purple-500', link: '/cliente/vantagens' },
            { label: 'Cotações', value: quotes.length, color: 'bg-orange-500', link: '/cliente/seguros' },
          ].map((card) => (
            <Link
              key={card.label}
              to={card.link}
              className={`${card.color} text-white rounded-xl p-5 shadow hover:opacity-90 transition-opacity`}
            >
              <p className="text-3xl font-bold">{card.value}</p>
              <p className="text-sm opacity-90 mt-1">{card.label}</p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Garantias recentes */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Garantias Recentes</h2>
              <Link to="/cliente/garantias" className="text-primary text-sm hover:underline">
                Ver todas →
              </Link>
            </div>
            {warranties.length === 0 ? (
              <p className="text-gray-400 text-sm">Nenhuma garantia registrada.</p>
            ) : (
              <div className="space-y-3">
                {warranties.slice(0, 3).map((w) => (
                  <div key={w.id} className="flex items-center justify-between border-b pb-3 last:border-b-0">
                    <div>
                      <p className="font-semibold text-sm text-gray-800">{w.protocolNumber}</p>
                      <p className="text-xs text-gray-500">{w.product?.model}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${WARRANTY_STATUS_COLOR[w.status]}`}>
                      {WARRANTY_STATUS_LABEL[w.status] || w.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Próximos eventos */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Meus Eventos</h2>
              <Link to="/cliente/eventos" className="text-primary text-sm hover:underline">
                Ver todos →
              </Link>
            </div>
            {events.length === 0 ? (
              <p className="text-gray-400 text-sm">Você não está inscrito em nenhum evento.</p>
            ) : (
              <div className="space-y-3">
                {events.slice(0, 3).map((reg) => (
                  <div key={reg.id} className="border-b pb-3 last:border-b-0">
                    <p className="font-semibold text-sm text-gray-800">{reg.event.title}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin size={12} className="text-gray-400" /> {reg.event.location} •{' '}
                      {new Date(reg.event.startAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Vantagens disponíveis */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Vantagens para Você</h2>
              <Link to="/cliente/vantagens" className="text-primary text-sm hover:underline">
                Ver todas →
              </Link>
            </div>
            {benefits.length === 0 ? (
              <p className="text-gray-400 text-sm">Nenhuma vantagem disponível no momento.</p>
            ) : (
              <div className="space-y-3">
                {benefits.slice(0, 3).map((b) => (
                  <div key={b.id} className="border-b pb-3 last:border-b-0">
                    <p className="font-semibold text-sm text-gray-800 flex items-center gap-1.5">
                      <Gift size={16} className="text-purple-500" /> {b.title}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-1">{b.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ações rápidas */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Ações Rápidas</h2>
            <div className="space-y-3">
              <Link to="/garantia" className="btn btn-outline w-full text-left flex items-center gap-2">
                <Shield size={18} /> Registrar nova garantia
              </Link>
              <Link to="/seguro" className="btn btn-outline w-full text-left flex items-center gap-2">
                <FileText size={18} /> Solicitar cotação de seguro
              </Link>
              <Link to="/eventos" className="btn btn-outline w-full text-left flex items-center gap-2">
                <Calendar size={18} /> Ver eventos disponíveis
              </Link>
              <Link to="/cliente/perfil" className="btn btn-outline w-full text-left flex items-center gap-2">
                <User size={18} /> Editar meu perfil
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
