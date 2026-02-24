import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { eventsAPI } from '../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: event, isLoading } = useQuery({
    queryKey: ['event-detail', id],
    queryFn: () => eventsAPI.getById(id).then((res) => res.data),
  });

  const formatDate = (date) => {
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 mt-4">Carregando evento...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Evento não encontrado
          </h3>
          <button onClick={() => navigate('/admin/events')} className="btn btn-primary mt-4">
            Voltar para eventos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate('/admin/events')}
            className="text-blue-600 hover:text-blue-800 mb-6 flex items-center gap-2"
          >
            ← Voltar para eventos
          </button>

          {/* Cabeçalho do Evento */}
          <div className="card mb-6">
            <div className="flex items-start gap-6">
              {/* Imagem */}
              <div className="flex-shrink-0">
                {event.imageUrl ? (
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-64 h-64 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-64 h-64 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-6xl">
                    📅
                  </div>
                )}
              </div>

              {/* Informações principais */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold text-gray-900">
                        {event.title}
                      </h1>
                      {event.category && (
                        <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                          {event.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status badges */}
                  <div className="flex flex-col gap-2 items-end">
                    {event.active ? (
                      <span className="bg-green-100 text-green-800 text-sm px-4 py-2 rounded-full font-medium">
                        ✓ Ativo
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded-full font-medium">
                        ✕ Inativo
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-gray-700 text-lg mb-6 whitespace-pre-line">
                  {event.description}
                </p>

                {/* Grid de informações */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">📅 Início</p>
                    <p className="text-lg font-medium text-gray-900">
                      {formatDate(event.startAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">⏰ Término</p>
                    <p className="text-lg font-medium text-gray-900">
                      {formatDate(event.endAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">📍 Local</p>
                    <p className="text-lg font-medium text-gray-900">
                      {event.location}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">👥 Inscritos</p>
                    <p className="text-lg font-medium text-gray-900">
                      {event._count?.registrations || 0}
                      {event.maxParticipants ? ` / ${event.maxParticipants}` : ' inscritos'}
                    </p>
                  </div>
                </div>

                {/* Badges adicionais */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {event.isPublic && (
                    <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                      🌐 Público
                    </span>
                  )}
                  {event.requiresMembership && (
                    <span className="bg-yellow-100 text-yellow-800 text-sm px-3 py-1 rounded-full">
                      ⭐ Requer Membership
                    </span>
                  )}
                  {event.store && (
                    <span className="bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full">
                      🏪 {event.store.name || 'Loja'}
                    </span>
                  )}
                </div>

                {/* Botão de editar */}
                <button
                  onClick={() => navigate(`/admin/events/${event.id}/edit`)}
                  className="btn btn-primary"
                >
                  ✏️ Editar Evento
                </button>
              </div>
            </div>
          </div>

          {/* Lista de Inscritos */}
          <div className="card">
            <h2 className="text-2xl font-bold mb-6">
              Participantes Inscritos ({event._count?.registrations || 0})
            </h2>

            {event.registrations && event.registrations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Telefone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data Inscrição
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {event.registrations.map((registration) => (
                      <tr key={registration.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {registration.customer?.fullName || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-700">
                            {registration.customer?.email || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-700">
                            {registration.customer?.phone || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {format(
                            new Date(registration.createdAt),
                            'dd/MM/yyyy HH:mm',
                            { locale: ptBR }
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Nenhum participante inscrito
                </h3>
                <p className="text-gray-500">
                  Aguarde as primeiras inscrições para este evento!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
