import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MdVerifiedUser, MdDescription, MdEvent, MdPerson, MdLocationOn, MdCardGiftcard, MdShare, MdContentCopy, MdCheck, MdEmojiEvents } from 'react-icons/md';
import { useAuthStore } from '../store/authStore';
import { customerPortalAPI, gamificationAPI } from '../services/api';
import { useEntitlements } from '../hooks/useEntitlements';
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

function ReferralCard() {
  const [copied, setCopied] = useState(false);

  const { data } = useQuery({
    queryKey: ['customer-referral'],
    queryFn: customerPortalAPI.getReferral,
  });

  const code = data?.referralCode ?? '—';
  const completed = data?.completedCount ?? 0;

  function handleCopy() {
    if (!data?.referralCode) return;
    navigator.clipboard.writeText(data.referralCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <MdShare size={20} className="text-teal-500 shrink-0" />
        <h2 className="font-title text-lg font-bold text-gray-900 dark:text-slate-100">Indique e Ganhe</h2>
      </div>
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
        Compartilhe seu código. Quando o amigo indicado fizer a primeira compra,
        você recebe pontos de bônus!
      </p>
      <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800 rounded-lg px-4 py-3 mb-4">
        <span className="font-mono text-xl font-bold text-primary tracking-widest flex-1">{code}</span>
        <button
          onClick={handleCopy}
          title="Copiar código"
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
        >
          {copied
            ? <MdCheck size={20} className="text-green-500" />
            : <MdContentCopy size={20} className="text-gray-400" />}
        </button>
      </div>
      <p className="text-xs text-gray-400 dark:text-slate-500">
        {completed} indicaç{completed === 1 ? 'ão' : 'ões'} concluída{completed !== 1 ? 's' : ''}
      </p>
    </Card>
  );
}

function AchievementsCard() {
  const { data: badges = [] } = useQuery({
    queryKey: ['customer-achievements'],
    queryFn: gamificationAPI.getMyAchievements,
  });

  const earned = badges.filter((b) => b.earned);

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MdEmojiEvents size={20} className="text-yellow-500 shrink-0" />
          <h2 className="font-title text-lg font-bold text-gray-900 dark:text-slate-100">Conquistas</h2>
        </div>
        <Link to="/cliente/ranking" className="text-primary dark:text-primary-400 text-sm hover:underline">
          Ver ranking →
        </Link>
      </div>

      {badges.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-slate-500">Carregando conquistas...</p>
      ) : (
        <>
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
            {earned.length} de {badges.length} desbloqueada{earned.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-5 gap-2">
            {badges.map((badge) => (
              <div
                key={badge.id}
                title={badge.earned ? `${badge.name}: ${badge.description}` : `Bloqueado: ${badge.description}`}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                  badge.earned
                    ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700'
                    : 'border-gray-200 bg-gray-50 dark:bg-slate-800 dark:border-slate-700 opacity-40 grayscale'
                }`}
              >
                <span className="text-2xl leading-none">{badge.icon || '🏅'}</span>
                <span className="text-[10px] text-center leading-tight text-gray-600 dark:text-slate-300 line-clamp-2">
                  {badge.name}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

export default function CustomerDashboard() {
  const { user } = useAuthStore();
  const { current: ent, plus: plusEnt } = useEntitlements();
  const isPlus = user?.currentTier === 'PLUS';

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

  const { data: pointsData } = useQuery({
    queryKey: ['customer-points', user?.id],
    queryFn: () => customerPortalAPI.getPointsBalance(),
    enabled: !!user?.id && isPlus,
  });

  const points = pointsData?.balance || 0;

  const metrics = [
    { label: 'Garantias', value: warranties.length, icon: MdVerifiedUser, color: isPlus ? '#D4AF37' : '#1565C0', link: '/cliente/garantias' },
    { label: 'Eventos', value: events.length, icon: MdEvent, color: isPlus ? '#D4AF37' : '#2d3a4a', link: '/cliente/eventos' },
    { label: 'Vantagens', value: benefits.length, icon: MdCardGiftcard, color: isPlus ? '#D4AF37' : '#9C27B0', link: '/cliente/vantagens' },
    { label: isPlus ? 'Meus Pontos' : 'Cotações', value: isPlus ? points : quotes.length, icon: isPlus ? MdCardGiftcard : MdDescription, color: isPlus ? '#D4AF37' : '#FF9800', link: isPlus ? '/cliente/vantagens' : '/cliente/seguros' },
  ];

  return (
    <div className="py-8 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <PageHeader
          title={isPlus ? `Olá, ${user?.name?.split(' ')[0] || 'cliente'}! 🌟 (Membro Plus)` : `Olá, ${user?.name?.split(' ')[0] || 'cliente'}! 👋`}
          subtitle="Bem-vindo ao seu portal Relm Care+"
        />

        {/* Upgrade Banner for CARE */}
        {!isPlus && (
          <div className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-lg p-6 mb-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg">Faça o upgrade para o Relm Care Plus! 🚴✨</h3>
              <p className="text-sm opacity-90">Ganhe {plusEnt?.pointsMultiplier ?? 2}x pontos, agendamento prioritário na oficina e Concierge VIP no WhatsApp.</p>
            </div>
            <Link to="/cliente/assinatura" className="btn bg-white text-teal-600 hover:bg-gray-100 border-none font-semibold shrink-0">
              Quero ser Plus
            </Link>
          </div>
        )}

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
                      <MdLocationOn size={12} className="text-gray-400" /> {reg.event.location} •{' '}
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
                      <MdCardGiftcard size={16} className="text-purple-500 shrink-0" /> {b.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-1 mt-1">{b.description}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Indique e Ganhe */}
          <ReferralCard />

          {/* Conquistas */}
          <AchievementsCard />

          {/* Ações rápidas */}
          <Card>
            <h2 className="font-title text-lg font-bold text-gray-900 dark:text-slate-100 mb-4">Ações Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Link to="/garantia" className="btn btn-outline justify-start">
                <MdVerifiedUser size={18} /> Registrar garantia
              </Link>
              <Link to="/seguro" className="btn btn-outline justify-start">
                <MdDescription size={18} /> Cotação de seguro
              </Link>
              <Link to="/eventos" className="btn btn-outline justify-start">
                <MdEvent size={18} /> Ver eventos
              </Link>
              <Link to="/cliente/perfil" className="btn btn-outline justify-start">
                <MdPerson size={18} /> Editar meu perfil
              </Link>
              {ent?.concierge && (
                <a
                  href="https://wa.me/5511987654321?text=Olá!%20Sou%20membro%20Care%20Plus%20e%20gostaria%20de%20falar%20com%20meu%20Concierge."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn text-white justify-start col-span-1 md:col-span-2"
                  style={{ backgroundColor: '#D4AF37', borderColor: '#D4AF37' }}
                >
                  💬 WhatsApp Concierge VIP
                </a>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
