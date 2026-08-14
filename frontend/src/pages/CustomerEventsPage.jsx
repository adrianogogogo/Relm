import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdEvent, MdLocationOn, MdAccessTime, MdPeople, MdCheckCircle, MdPerson, MdCheck } from 'react-icons/md';
import { customerPortalAPI, eventsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Card, PageHeader, StatusChip, Button } from '../components/ui';

export default function CustomerEventsPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState('registered'); // 'registered' | 'available'
  const [registeringId, setRegisteringId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const { data: registrations = [], isLoading: loadingRegistrations } = useQuery({
    queryKey: ['customer-events'],
    queryFn: customerPortalAPI.getEvents,
  });

  const { data: allEvents = [], isLoading: loadingAll } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsAPI.getAll().then((res) => res.data),
  });

  const registeredEventIds = new Set(
    registrations.map((r) => r.event?.id || r.eventId).filter(Boolean),
  );

  const availableEvents = allEvents.filter((ev) => !registeredEventIds.has(ev.id));

  const registerMutation = useMutation({
    mutationFn: (eventId) => customerPortalAPI.registerEvent(eventId),
    onSuccess: (data) => {
      setActionSuccess(data?.message || 'Inscrição confirmada com sucesso!');
      setActionError('');
      setRegisteringId(null);
      queryClient.invalidateQueries({ queryKey: ['customer-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setActiveTab('registered');
      setTimeout(() => setActionSuccess(''), 5000);
    },
    onError: (err) => {
      setActionError(err.response?.data?.message || 'Erro ao realizar inscrição.');
      setRegisteringId(null);
    },
  });

  const handleRegister = (eventId) => {
    setActionError('');
    setActionSuccess('');
    setRegisteringId(eventId);
    registerMutation.mutate(eventId);
  };

  return (
    <div className="py-8 px-6">
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title="Meus Eventos"
          subtitle="Eventos em que você está inscrito e novos encontros Relm"
        />

        {user?.email && (
          <div className="bg-primary/5 dark:bg-primary-950/20 border border-primary/15 rounded-xl px-4 py-3 mb-6 flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 text-primary-900 dark:text-primary-200">
              <MdPerson size={18} className="text-primary" />
              <span>
                Inscrições vinculadas à sua conta: <strong>{user.email}</strong>
              </span>
            </div>
            <Link to="/eventos" className="text-primary dark:text-primary-400 font-medium hover:underline text-xs shrink-0">
              Página pública de eventos →
            </Link>
          </div>
        )}

        {actionSuccess && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl p-4 mb-6 text-sm flex items-center gap-2">
            <MdCheckCircle size={20} className="text-emerald-500 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {actionError && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-xl p-4 mb-6 text-sm">
            {actionError}
          </div>
        )}

        {/* Abas */}
        <div className="flex border-b border-gray-200 dark:border-slate-800 mb-6">
          <button
            onClick={() => setActiveTab('registered')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'registered'
                ? 'border-primary text-primary dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <MdEvent size={18} />
            Inscritos ({registrations.length})
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'available'
                ? 'border-primary text-primary dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <MdPeople size={18} />
            Eventos Disponíveis ({availableEvents.length})
          </button>
        </div>

        {/* Conteúdo Aba 1: Inscritos */}
        {activeTab === 'registered' && (
          <div>
            {loadingRegistrations ? (
              <div className="flex justify-center py-16">
                <span className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : registrations.length === 0 ? (
              <Card className="p-12 text-center flex flex-col items-center">
                <MdEvent className="h-12 w-12 text-gray-300 dark:text-slate-700 mb-4" />
                <p className="text-gray-700 dark:text-slate-300 font-semibold mb-1">Você não está inscrito em nenhum evento ainda.</p>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 max-w-sm">
                  Confira os eventos disponíveis e garanta sua vaga nos encontros exclusivos da Relm.
                </p>
                <Button onClick={() => setActiveTab('available')}>Ver eventos disponíveis</Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {registrations.map((reg) => {
                  const end = reg.event?.endAt || reg.event?.startAt;
                  const isPast = end ? new Date(end) < new Date() : false;
                  return (
                    <Card key={reg.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-bold text-gray-800 dark:text-slate-200 text-lg">{reg.event?.title || 'Evento'}</p>
                            {isPast ? (
                              <StatusChip label="Encerrado" variant="neutral" />
                            ) : (
                              <StatusChip label="Confirmado" variant="success" />
                            )}
                            {reg.attended && (
                              <StatusChip label="Presença Confirmada" variant="info" />
                            )}
                          </div>
                          {reg.event?.description && (
                            <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">{reg.event.description}</p>
                          )}
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-slate-400">
                            {reg.event?.location && (
                              <span className="flex items-center gap-1.5"><MdLocationOn size={16} className="text-gray-400" /> {reg.event.location}</span>
                            )}
                            {reg.event?.startAt && (
                              <span className="flex items-center gap-1.5">
                                <MdEvent size={16} className="text-gray-400" /> {new Date(reg.event.startAt).toLocaleDateString('pt-BR', {
                                  day: '2-digit', month: 'long', year: 'numeric',
                                })}
                              </span>
                            )}
                            {reg.event?.startAt && (
                              <span className="flex items-center gap-1.5">
                                <MdAccessTime size={16} className="text-gray-400" /> {new Date(reg.event.startAt).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit', minute: '2-digit',
                                })}
                                {reg.event?.endAt && (
                                  <>
                                    {' – '}
                                    {new Date(reg.event.endAt).toLocaleTimeString('pt-BR', {
                                      hour: '2-digit', minute: '2-digit',
                                    })}
                                  </>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-4 border-t border-gray-100 dark:border-slate-800/80 pt-2 flex items-center gap-1">
                        <MdCheck size={14} className="text-emerald-500" />
                        Inscrição confirmada em {new Date(reg.createdAt).toLocaleDateString('pt-BR')} às {new Date(reg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Conteúdo Aba 2: Eventos Disponíveis */}
        {activeTab === 'available' && (
          <div>
            {loadingAll ? (
              <div className="flex justify-center py-16">
                <span className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : availableEvents.length === 0 ? (
              <Card className="p-12 text-center flex flex-col items-center">
                <MdCheckCircle className="h-12 w-12 text-emerald-500 mb-4" />
                <p className="text-gray-700 dark:text-slate-300 font-semibold mb-1">Você já está inscrito em todos os eventos disponíveis!</p>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
                  Fique atento a novos eventos e lançamentos que serão divulgados em breve.
                </p>
                <Button variant="outlined" onClick={() => setActiveTab('registered')}>Ver meus eventos inscritos</Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {availableEvents.map((event) => {
                  const spotsLeft = event.maxParticipants
                    ? event.maxParticipants - (event._count?.registrations ?? 0)
                    : null;
                  const isFull = spotsLeft !== null && spotsLeft <= 0;
                  const isPendingThis = registeringId === event.id;

                  return (
                    <Card key={event.id}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-gray-800 dark:text-slate-200 text-lg">{event.title}</p>
                            {event.active && !isFull && (
                              <StatusChip label="Inscrições Abertas" variant="info" />
                            )}
                            {isFull && (
                              <StatusChip label="Esgotado" variant="error" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">{event.description}</p>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-slate-400">
                            <span className="flex items-center gap-1.5"><MdLocationOn size={16} className="text-gray-400" /> {event.location}</span>
                            <span className="flex items-center gap-1.5">
                              <MdEvent size={16} className="text-gray-400" /> {new Date(event.startAt).toLocaleDateString('pt-BR', {
                                day: '2-digit', month: 'long', year: 'numeric',
                              })}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <MdAccessTime size={16} className="text-gray-400" /> {new Date(event.startAt).toLocaleTimeString('pt-BR', {
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <MdPeople size={16} className="text-gray-400" /> {spotsLeft !== null ? `${spotsLeft} vagas restantes` : 'Vagas ilimitadas'}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {event.active && !isFull ? (
                            <Button
                              onClick={() => handleRegister(event.id)}
                              disabled={isPendingThis || registerMutation.isPending}
                            >
                              {isPendingThis ? 'Inscrevendo...' : 'Inscrever-se'}
                            </Button>
                          ) : (
                            <Button disabled variant="outlined">
                              Esgotado
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
