import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsAPI } from '../services/api';
import { MdCalendarMonth, MdAdd, MdEdit, MdDelete, MdClose, MdPeople, MdLocationOn } from 'react-icons/md';
import { useAuthStore } from '../store/authStore';
import { PageHeader, Button } from '../components/ui';

const EMPTY_FORM = {
  title: '',
  description: '',
  location: '',
  startAt: '',
  endAt: '',
  maxParticipants: '',
};

function EventModal({ event, onClose }) {
  const queryClient = useQueryClient();
  const isEdit = !!event?.id;
  const toLocalDatetime = (iso) => iso ? iso.slice(0, 16) : '';
  const [form, setForm] = useState(
    isEdit
      ? {
          title: event.title,
          description: event.description,
          location: event.location,
          startAt: toLocalDatetime(event.startAt),
          endAt: toLocalDatetime(event.endAt),
          maxParticipants: event.maxParticipants?.toString() || '',
          active: event.active,
        }
      : { ...EMPTY_FORM }
  );
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit ? eventsAPI.update(event.id, data) : eventsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-events']);
      onClose();
    },
    onError: (err) => setError(err.response?.data?.message || 'Erro ao salvar evento.'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.title || !form.description || !form.location || !form.startAt || !form.endAt) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    mutation.mutate({
      ...form,
      maxParticipants: form.maxParticipants ? parseInt(form.maxParticipants) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl max-w-lg w-full p-6 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-title text-lg font-bold text-gray-900 dark:text-slate-100">{isEdit ? 'Editar Evento' : 'Novo Evento'}</h3>
          <button onClick={onClose}><MdClose className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200" /></button>
        </div>

        {error && (
          <div className="bg-error/10 border border-error/30 text-error rounded-lg p-3 mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Título *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Descrição *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Local *</label>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="input"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Início *</label>
              <input
                type="datetime-local"
                value={form.startAt}
                onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Fim *</label>
              <input
                type="datetime-local"
                value={form.endAt}
                onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                className="input"
                required
              />
            </div>
          </div>
          <div>
            <label className="label">Máximo de participantes (opcional)</label>
            <input
              type="number"
              min="1"
              value={form.maxParticipants}
              onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })}
              className="input"
              placeholder="Sem limite"
            />
          </div>
          {isEdit && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="rounded text-primary focus:ring-primary"
              />
              <label htmlFor="active" className="text-sm text-gray-700 dark:text-slate-300">Evento ativo (inscrições abertas)</label>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-outline flex-1">Cancelar</button>
            <button type="submit" disabled={mutation.isPending} className="btn btn-primary flex-1">
              {mutation.isPending ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RegistrationsModal({ event, onClose }) {
  const { data: registrations, isLoading } = useQuery({
    queryKey: ['event-registrations', event.id],
    queryFn: () => eventsAPI.getRegistrations(event.id),
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl max-w-lg w-full p-6 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-title text-lg font-bold text-gray-900 dark:text-slate-100">Inscrições</h3>
            <p className="text-sm text-gray-600 dark:text-slate-400">{event.title}</p>
          </div>
          <button onClick={onClose}><MdClose className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200" /></button>
        </div>
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <p className="text-gray-500 dark:text-slate-400 text-center py-8">Carregando...</p>
          ) : registrations?.length === 0 ? (
            <p className="text-gray-500 dark:text-slate-400 text-center py-8">Nenhuma inscrição ainda.</p>
          ) : (
            <div className="space-y-2">
              {registrations.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-800">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-slate-100 text-sm">{r.customer.fullName}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{r.customer.email}</p>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-slate-500">{new Date(r.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="pt-3 border-t border-gray-100 dark:border-slate-800 mt-3 text-sm text-gray-500 dark:text-slate-400">
          {registrations?.length ?? 0} inscrito{registrations?.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}

export default function AdminEventsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN_RELM';
  const [modalEvent, setModalEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [regEvent, setRegEvent] = useState(null);

  const { data: events, isLoading } = useQuery({
    queryKey: ['admin-events'],
    queryFn: () => eventsAPI.getAllAdmin(),
  });

  const removeMutation = useMutation({
    mutationFn: (id) => eventsAPI.remove(id),
    onSuccess: () => queryClient.invalidateQueries(['admin-events']),
  });

  return (
    <div className="py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Eventos"
          subtitle={`${events?.length ?? 0} evento(s) cadastrado(s)`}
          action={
            <Button icon={MdAdd} onClick={() => { setModalEvent(null); setShowEventModal(true); }}>
              Novo Evento
            </Button>
          }
        />

        {isLoading ? (
          <div className="text-center py-12 text-gray-500 dark:text-slate-400">Carregando eventos...</div>
        ) : events?.length === 0 ? (
          <div className="text-center py-12">
            <MdCalendarMonth className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-slate-400 text-lg">Nenhum evento criado ainda.</p>
            <button onClick={() => { setModalEvent(null); setShowEventModal(true); }} className="btn btn-primary mt-4 mx-auto">
              Criar primeiro evento
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((e) => {
              const registrationCount = e._count?.registrations ?? 0;
              return (
                <div key={e.id} className={`card border-l-4 ${e.active ? 'border-l-primary' : 'border-l-gray-300 dark:border-l-slate-600 opacity-60'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900 dark:text-slate-100 text-lg flex-1">{e.title}</h3>
                    <div className="flex items-center gap-1 ml-2">
                      <button onClick={() => setRegEvent(e)} className="p-1.5 text-gray-400 hover:text-primary rounded" title="Ver inscrições">
                        <MdPeople className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setModalEvent(e); setShowEventModal(true); }} className="p-1.5 text-gray-400 hover:text-primary rounded">
                        <MdEdit className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => { if (confirm('Desativar este evento?')) removeMutation.mutate(e.id); }}
                          className="p-1.5 text-gray-400 hover:text-error rounded"
                        >
                          <MdDelete className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-slate-400 text-sm mb-3 line-clamp-2">{e.description}</p>
                  <div className="text-sm text-gray-500 dark:text-slate-400 space-y-1">
                    <p className="flex items-center gap-1.5"><MdLocationOn size={16} className="text-gray-400" /> {e.location}</p>
                    <p className="flex items-center gap-1.5"><MdCalendarMonth size={16} className="text-gray-400" /> {new Date(e.startAt).toLocaleDateString('pt-BR')} às {new Date(e.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="flex items-center gap-1.5">
                      <MdPeople size={16} className="text-gray-400" /> {registrationCount} inscrito{registrationCount !== 1 ? 's' : ''}
                      {e.maxParticipants ? ` / ${e.maxParticipants} vagas` : ' (ilimitado)'}
                    </p>
                  </div>
                  {!e.active && <span className="text-xs text-gray-400 dark:text-slate-500 mt-2 block">Inativo</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showEventModal && (
        <EventModal event={modalEvent} onClose={() => setShowEventModal(false)} />
      )}
      {regEvent && (
        <RegistrationsModal event={regEvent} onClose={() => setRegEvent(null)} />
      )}
    </div>
  );
}
