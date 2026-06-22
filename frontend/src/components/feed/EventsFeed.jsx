import { useQuery } from '@tanstack/react-query';
import { MdEvent, MdLocationOn, MdAccessTime } from 'react-icons/md';
import { eventsAPI } from '../../services/api';
import { Card, PageHeader, StatusChip } from '../ui';

/**
 * Lista view-only de eventos direcionados ao perfil do usuário logado.
 * Consome GET /events/feed (audience resolvido pelo token). Reutilizada nos
 * portais de Loja e Distribuidor; o título/subtítulo variam por contexto.
 */
export default function EventsFeed({
  title = 'Eventos',
  subtitle = 'Eventos disponíveis para você',
  queryKey = 'feed-events',
}) {
  const { data: events = [], isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn: eventsAPI.feed,
  });

  return (
    <div className="py-8 px-6">
      <div className="max-w-4xl mx-auto">
        <PageHeader title={title} subtitle={subtitle} />

        {isLoading ? (
          <div className="flex justify-center py-16">
            <span className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <Card className="p-12 text-center flex flex-col items-center">
            <MdEvent className="h-12 w-12 text-gray-300 dark:text-slate-700 mb-4" />
            <p className="text-gray-500 dark:text-slate-400">Nenhum evento disponível no momento.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {events.map((event) => {
              const isPast = new Date(event.endAt) < new Date();
              return (
                <Card key={event.id}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-gray-800 dark:text-slate-200 text-lg">{event.title}</p>
                        {isPast && <StatusChip label="Encerrado" variant="neutral" />}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">{event.description}</p>
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
                          {' – '}
                          {new Date(event.endAt).toLocaleTimeString('pt-BR', {
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
