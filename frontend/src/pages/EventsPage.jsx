import { useQuery } from '@tanstack/react-query';
import { eventsAPI } from '../services/api';

export default function EventsPage() {
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events?.map((event) => (
                <div key={event.id} className="card">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-2xl font-bold">{event.title}</h3>
                    {event.active && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Inscrições Abertas
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 mb-4">{event.description}</p>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>
                      <strong>📍 Local:</strong> {event.location}
                    </p>
                    <p>
                      <strong>📅 Data:</strong>{' '}
                      {new Date(event.startAt).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(event.startAt).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <p>
                      <strong>👥 Vagas:</strong> {event.maxParticipants || 'Ilimitadas'}
                    </p>
                  </div>
                  {event.active && (
                    <button className="btn btn-primary w-full mt-6">
                      Inscrever-se
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
