import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdCelebration, MdEvent, MdLocationOn, MdPeople, MdCheckCircle, MdPerson } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { eventsAPI, customerPortalAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { PageHeader, StatusChip } from '../components/ui';

function RegisterModal({ event, onClose }) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isCustomer = user?.userType === 'CUSTOMER' || user?.role === 'CUSTOMER';

  const [form, setForm] = useState({
    email: user?.email || '',
    fullName: user?.fullName || user?.name || '',
    phone: user?.phone || '',
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data) => {
      if (isAuthenticated && isCustomer) {
        return customerPortalAPI.registerEvent(event.id);
      }
      return eventsAPI.register(event.id, data);
    },
    onSuccess: () => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['customer-events'] });
      queryClient.invalidateQueries({ queryKey: ['events-feed'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Erro ao realizar inscrição. Tente novamente.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.fullName) {
      setError('Nome e e-mail são obrigatórios.');
      return;
    }
    mutation.mutate(form);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-100 dark:border-slate-800">
        {success ? (
          <div className="text-center py-6">
            <div className="text-primary mb-4 flex justify-center"><MdCelebration size={48} className="text-yellow-500" /></div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">Inscrição realizada com sucesso!</h3>
            <p className="text-gray-600 dark:text-slate-300 mb-2">
              Você está inscrito em <strong>{event.title}</strong>.
            </p>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4 flex items-center justify-center gap-1.5">
              <MdEvent size={16} /> {new Date(event.startAt).toLocaleDateString('pt-BR')} às{' '}
              {new Date(event.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
            {isCustomer && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-lg mb-6">
                ✓ Este evento já está disponível na sua aba <strong>Meus Eventos</strong>.
              </p>
            )}
            <div className="flex gap-3">
              {isCustomer ? (
                <Link to="/cliente/eventos" className="btn btn-primary flex-1 text-center">
                  Ver Meus Eventos
                </Link>
              ) : null}
              <button onClick={onClose} className={`btn ${isCustomer ? 'btn-outline flex-1' : 'btn-primary w-full'}`}>
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Inscrever-se no Evento</h3>
                <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">{event.title}</p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-2xl leading-none">×</button>
            </div>

            {isCustomer && user?.email && (
              <div className="bg-primary/10 border border-primary/20 text-primary dark:text-primary-300 rounded-lg p-3 mb-4 text-xs flex items-center gap-2">
                <MdPerson size={18} className="shrink-0" />
                <span>
                  Conectado como <strong>{user.email}</strong>. A inscrição ficará automaticamente vinculada ao seu painel.
                </span>
              </div>
            )}

            {error && (
              <div className="bg-error/10 border-l-4 border-error text-error rounded p-3 mb-4 text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Nome completo *</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="input"
                  placeholder="Seu nome completo"
                  required
                />
              </div>
              <div>
                <label className="label">E-mail *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input"
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <div>
                <label className="label">Telefone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input"
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="btn btn-outline flex-1">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="btn btn-primary flex-1"
                >
                  {mutation.isPending ? 'Confirmando...' : 'Confirmar Inscrição'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function EventsPage() {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isCustomer = user?.userType === 'CUSTOMER' || user?.role === 'CUSTOMER';

  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsAPI.getAll().then((res) => res.data),
  });

  const { data: customerRegistrations = [] } = useQuery({
    queryKey: ['customer-events'],
    queryFn: customerPortalAPI.getEvents,
    enabled: !!(isAuthenticated && isCustomer),
  });

  const registeredEventIds = new Set(
    customerRegistrations.map((r) => r.event?.id || r.eventId).filter(Boolean),
  );

  return (
    <div className="min-h-screen bg-app dark:bg-app-dark py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <PageHeader
            title="Eventos Relm"
            subtitle="Participe dos nossos eventos exclusivos!"
            action={
              isCustomer ? (
                <Link to="/cliente/eventos" className="btn btn-outline text-sm">
                  Ver Meus Eventos ({customerRegistrations.length})
                </Link>
              ) : null
            }
          />

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Carregando eventos...</p>
            </div>
          ) : events?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Nenhum evento disponível no momento.</p>
              <p className="text-gray-400 mt-2">Fique de olho — novos eventos em breve!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events?.map((event) => {
                const isRegistered = registeredEventIds.has(event.id);
                const spotsLeft = event.maxParticipants
                  ? event.maxParticipants - (event._count?.registrations ?? 0)
                  : null;
                const isFull = spotsLeft !== null && spotsLeft <= 0;

                return (
                  <div key={event.id} className="card">
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <h3 className="font-title text-2xl font-bold">{event.title}</h3>
                      {isRegistered ? (
                        <span className="shrink-0 mt-1">
                          <StatusChip label="Inscrito" variant="success" />
                        </span>
                      ) : event.active && !isFull ? (
                        <span className="shrink-0 mt-1">
                          <StatusChip label="Inscrições Abertas" variant="info" />
                        </span>
                      ) : isFull ? (
                        <span className="shrink-0 mt-1">
                          <StatusChip label="Esgotado" variant="error" />
                        </span>
                      ) : (
                        <span className="shrink-0 mt-1">
                          <StatusChip label="Encerrado" variant="neutral" />
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 dark:text-slate-300 mb-4">{event.description}</p>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-slate-400">
                      <p className="flex items-center gap-1.5"><strong><MdLocationOn size={16} className="text-gray-400 inline" /> Local:</strong> {event.location}</p>
                      <p className="flex items-center gap-1.5">
                        <strong><MdEvent size={16} className="text-gray-400 inline" /> Data:</strong>{' '}
                        {new Date(event.startAt).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(event.startAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <strong><MdPeople size={16} className="text-gray-400 inline" /> Vagas:</strong>{' '}
                        {event.maxParticipants
                          ? isFull
                            ? 'Esgotado'
                            : `${spotsLeft} restante${spotsLeft !== 1 ? 's' : ''} de ${event.maxParticipants}`
                          : 'Ilimitadas'}
                      </p>
                    </div>

                    {isRegistered ? (
                      <div className="mt-6 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-sm font-semibold">
                        <MdCheckCircle size={18} className="text-emerald-600 dark:text-emerald-400" />
                        Você já está inscrito neste evento
                      </div>
                    ) : event.active && !isFull ? (
                      <button
                        onClick={() => setSelectedEvent(event)}
                        className="btn btn-primary w-full mt-6"
                      >
                        Inscrever-se
                      </button>
                    ) : isFull ? (
                      <button disabled className="btn w-full mt-6 bg-gray-200 text-gray-500 cursor-not-allowed">
                        Vagas Esgotadas
                      </button>
                    ) : (
                      <button disabled className="btn w-full mt-6 bg-gray-200 text-gray-500 cursor-not-allowed">
                        Inscrições Encerradas
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedEvent && (
        <RegisterModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}
