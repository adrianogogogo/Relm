import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { customerPortalAPI } from '../services/api';
import { Card, PageHeader, StatusChip, Button } from '../components/ui';

export default function CustomerEventsPage() {
  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ['customer-events'],
    queryFn: customerPortalAPI.getEvents,
  });

  return (
    <div className="py-8 px-6">
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title="Meus Eventos"
          subtitle="Eventos em que você está inscrito"
          action={
            <Link to="/eventos">
              <Button variant="outlined">Ver eventos disponíveis</Button>
            </Link>
          }
        />

        {isLoading ? (
          <div className="flex justify-center py-16">
            <span className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : registrations.length === 0 ? (
          <Card className="p-12 text-center flex flex-col items-center">
            <Calendar className="h-12 w-12 text-gray-300 dark:text-slate-700 mb-4" />
            <p className="text-gray-500 dark:text-slate-400 mb-4">Você não está inscrito em nenhum evento ainda.</p>
            <Link to="/eventos">
              <Button>Ver eventos</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {registrations.map((reg) => {
              const isPast = new Date(reg.event.endAt) < new Date();
              return (
                <Card key={reg.id}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-gray-800 dark:text-slate-200 text-lg">{reg.event.title}</p>
                        {isPast ? (
                          <StatusChip label="Encerrado" variant="neutral" />
                        ) : (
                          <StatusChip label="Confirmado" variant="success" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">{reg.event.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5"><MapPin size={16} className="text-gray-400" /> {reg.event.location}</span>
                        <span className="flex items-center gap-1.5">
                          <Calendar size={16} className="text-gray-400" /> {new Date(reg.event.startAt).toLocaleDateString('pt-BR', {
                            day: '2-digit', month: 'long', year: 'numeric',
                          })}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock size={16} className="text-gray-400" /> {new Date(reg.event.startAt).toLocaleTimeString('pt-BR', {
                            hour: '2-digit', minute: '2-digit',
                          })}
                          {' – '}
                          {new Date(reg.event.endAt).toLocaleTimeString('pt-BR', {
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-3">
                    Inscrito em {new Date(reg.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
