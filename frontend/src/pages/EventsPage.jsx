import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { eventsAPI } from '../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function EventsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    upcoming: true,
    category: '',
    isPublic: '',
  });

  const { data: events, isLoading } = useQuery({
    queryKey: ['admin-events', filters],
    queryFn: () => eventsAPI.getAll(filters).then((res) => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => eventsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-events']);
      alert('Evento desativado com sucesso!');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Erro ao desativar evento');
    },
  });

  const handleDelete = (id, title) => {
    if (window.confirm(`Deseja realmente desativar o evento "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const formatDate = (date) => {
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gerenciar Eventos</h1>
            <p className="text-gray-600 mt-2">
              Crie e gerencie eventos para clientes e membros do clube
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/events/new')}
            className="btn btn-primary flex items-center gap-2"
          >
            <span>➕</span>
            Novo Evento
          </button>
        </div>

        {/* FILTROS */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período
              </label>
              <select
                value={filters.upcoming}
                onChange={(e) =>
                  setFilters({ ...filters, upcoming: e.target.value === 'true' })
                }
                className="input"
              >
                <option value="true">Próximos eventos</option>
                <option value="false">Todos os eventos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="input"
              >
                <option value="">Todas</option>
                <option value="Pedal">Pedal</option>
                <option value="Oficina">Oficina</option>
                <option value="Encontro">Encontro</option>
                <option value="Competição">Competição</option>
                <option value="Workshop">Workshop</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visibilidade
              </label>
              <select
                value={filters.isPublic}
                onChange={(e) => setFilters({ ...filters, isPublic: e.target.value })}
                className="input"
              >
                <option value="">Todos</option>
                <option value="true">Públicos</option>
                <option value="false">Exclusivos</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() =>
                  setFilters({ upcoming: true, category: '', isPublic: '' })
                }
                className="btn btn-secondary w-full"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* LISTA DE EVENTOS */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-4">Carregando eventos...</p>
          </div>
        ) : events && events.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {events.map((event) => (
              <div key={event.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-6">
                  {/* Imagem */}
                  <div className="flex-shrink-0">
                    {event.imageUrl ? (
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-4xl">
                        📅
                      </div>
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-bold text-gray-900">
                            {event.title}
                          </h3>
                          {event.category && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                              {event.category}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 line-clamp-2">
                          {event.description}
                        </p>
                      </div>

                      {/* Status badges */}
                      <div className="flex flex-col gap-2 items-end">
                        {event.active ? (
                          <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium">
                            ✓ Ativo
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full font-medium">
                            ✕ Inativo
                          </span>
                        )}
                        {event.isPublic ? (
                          <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium">
                            🌐 Público
                          </span>
                        ) : (
                          <span className="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full font-medium">
                            🔒 Exclusivo
                          </span>
                        )}
                        {event.requiresMembership && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full font-medium">
                            ⭐ Requer Membership
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Informações */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">📅 Início</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(event.startAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">⏰ Término</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(event.endAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">📍 Local</p>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {event.location}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">👥 Inscritos</p>
                        <p className="text-sm font-medium text-gray-900">
                          {event._count?.registrations || 0}
                          {event.maxParticipants ? ` / ${event.maxParticipants}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => navigate(`/admin/events/${event.id}`)}
                        className="btn btn-secondary text-sm"
                      >
                        👁️ Detalhes
                      </button>
                      <button
                        onClick={() => navigate(`/admin/events/${event.id}/edit`)}
                        className="btn btn-primary text-sm"
                      >
                        ✏️ Editar
                      </button>
                      {event.active && (
                        <button
                          onClick={() => handleDelete(event.id, event.title)}
                          className="btn bg-red-600 hover:bg-red-700 text-white text-sm"
                        >
                          🗑️ Desativar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Nenhum evento encontrado
            </h3>
            <p className="text-gray-500 mb-6">
              Comece criando seu primeiro evento!
            </p>
            <button
              onClick={() => navigate('/admin/events/new')}
              className="btn btn-primary"
            >
              ➕ Criar Primeiro Evento
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
