import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PartyPopper, Calendar, MapPin, Users } from 'lucide-react';
import { eventsAPI } from '../services/api';

function RegisterModal({ event, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ email: '', fullName: '', phone: '' });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data) => eventsAPI.register(event.id, data),
    onSuccess: () => {
      setSuccess(true);
      queryClient.invalidateQueries(['events']);
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
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        {success ? (
          <div className="text-center py-6">
            <div className="text-primary mb-4 flex justify-center"><PartyPopper size={48} className="text-yellow-500" /></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Inscrição realizada!</h3>
            <p className="text-gray-600 mb-2">
              Você está inscrito em <strong>{event.title}</strong>.
            </p>
            <p className="text-sm text-gray-500 mb-6 flex items-center justify-center gap-1.5">
              <Calendar size={16} /> {new Date(event.startAt).toLocaleDateString('pt-BR')} às{' '}
              {new Date(event.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <button onClick={onClose} className="btn btn-primary w-full">
              Fechar
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Inscrever-se no Evento</h3>
                <p className="text-sm text-gray-600 mt-1">{event.title}</p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo *</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Seu nome completo"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
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

  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsAPI.getAll().then((res) => res.data),
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Eventos Relm</h1>
          <p className="text-xl text-gray-600 mb-12">
            Participe dos nossos eventos exclusivos!
          </p>

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
                const spotsLeft = event.maxParticipants
                  ? event.maxParticipants - (event._count?.registrations ?? 0)
                  : null;
                const isFull = spotsLeft !== null && spotsLeft <= 0;

                return (
                  <div key={event.id} className="card">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-2xl font-bold">{event.title}</h3>
                      {event.active && !isFull && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full whitespace-nowrap ml-2">
                          Inscrições Abertas
                        </span>
                      )}
                      {isFull && (
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full whitespace-nowrap ml-2">
                          Esgotado
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 mb-4">{event.description}</p>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p className="flex items-center gap-1.5"><strong><MapPin size={16} className="text-gray-400 inline" /> Local:</strong> {event.location}</p>
                      <p className="flex items-center gap-1.5">
                        <strong><Calendar size={16} className="text-gray-400 inline" /> Data:</strong>{' '}
                        {new Date(event.startAt).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(event.startAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <strong><Users size={16} className="text-gray-400 inline" /> Vagas:</strong>{' '}
                        {event.maxParticipants
                          ? isFull
                            ? 'Esgotado'
                            : `${spotsLeft} restante${spotsLeft !== 1 ? 's' : ''} de ${event.maxParticipants}`
                          : 'Ilimitadas'}
                      </p>
                    </div>
                    {event.active && !isFull && (
                      <button
                        onClick={() => setSelectedEvent(event)}
                        className="btn btn-primary w-full mt-6"
                      >
                        Inscrever-se
                      </button>
                    )}
                    {isFull && (
                      <button disabled className="btn w-full mt-6 bg-gray-200 text-gray-500 cursor-not-allowed">
                        Vagas Esgotadas
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
