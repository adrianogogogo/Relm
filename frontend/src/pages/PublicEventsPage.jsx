import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { eventsAPI } from '../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PublicEventsPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    upcoming: true,
    category: '',
  });

  const { data: events, isLoading } = useQuery({
    queryKey: ['public-events', filters],
    queryFn: () => eventsAPI.getPublic(filters).then((res) => res.data),
  });

  const formatDate = (date) => {
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Eventos Relm</h1>
            <p className="text-xl text-gray-600">
              Participe dos nossos eventos exclusivos de ciclismo!
            </p>
          </div>

          {/* FILTROS */}
          <div className="card mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <select
                  value={filters.category}
                  onChange={(e) =>
                    setFilters({ ...filters, category: e.target.value })
                  }
                  className="input"
                >
                  <option value="">Todas as categorias</option>
                  <option value="Pedal">🚴 Pedal</option>
                  <option value="Oficina">🔧 Oficina</option>
                  <option value="Encontro">🤝 Encontro</option>
                  <option value="Competição">🏆 Competição</option>
                  <option value="Workshop">📚 Workshop</option>
                </select>
              </div>

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
            </div>
          </div>

          {/* LISTA DE EVENTOS */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 mt-4">Carregando eventos...</p>
            </div>
          ) : events && events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="card hover:shadow-xl transition-all cursor-pointer"
                  onClick={() => navigate(`/eventos/${event.id}`)}
                >
                  {/* Imagem do evento */}
                  {event.imageUrl ? (
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-48 object-cover rounded-t-lg -mt-6 -mx-6 mb-4"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-lg -mt-6 -mx-6 mb-4 flex items-center justify-center text-white text-6xl">
                      📅
                    </div>
                  )}

                  {/* Badges */}
                  <div className="flex gap-2 mb-4">
                    {event.category && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium">
                        {event.category}
                      </span>
                    )}
                    {event.requiresMembership && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full font-medium">
                        ⭐ Exclusivo membros
                      </span>
                    )}
                  </div>

                  {/* Título e descrição */}
                  <h3 className="text-2xl font-bold mb-3">{event.title}</h3>
                  <p className="text-gray-700 mb-4 line-clamp-3">
                    {event.description}
                  </p>

                  {/* Informações */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-gray-600">
                      <span className="text-xl">📅</span>
                      <span className="text-sm">{formatDate(event.startAt)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <span className="text-xl">📍</span>
                      <span className="text-sm">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <span className="text-xl">👥</span>
                      <span className="text-sm">
                        {event._count?.registrations || 0} inscritos
                        {event.maxParticipants &&
                          ` de ${event.maxParticipants} vagas`}
                      </span>
                    </div>
                  </div>

                  {/* Botão de ação */}
                  <button
                    className="btn btn-primary w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/eventos/${event.id}`);
                    }}
                  >
                    Ver Detalhes e Inscrever-se
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Nenhum evento disponível
              </h3>
              <p className="text-gray-500">
                Em breve teremos novos eventos. Volte mais tarde!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
