import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { customerPortalAPI } from '../services/api';

export default function CustomerEventsPage() {
  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ['customer-events'],
    queryFn: customerPortalAPI.getEvents,
  });

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Meus Eventos</h1>
            <p className="text-gray-500 text-sm mt-1">Eventos em que você está inscrito</p>
          </div>
          <Link to="/eventos" className="btn btn-primary text-sm">
            Ver eventos disponíveis
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Carregando...</div>
        ) : registrations.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center flex flex-col items-center">
            <Calendar className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">Você não está inscrito em nenhum evento ainda.</p>
            <Link to="/eventos" className="btn btn-primary">Ver eventos</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {registrations.map((reg) => {
              const isPast = new Date(reg.event.endAt) < new Date();
              return (
                <div key={reg.id} className="bg-white rounded-xl shadow p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-gray-800 text-lg">{reg.event.title}</p>
                        {isPast ? (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Encerrado</span>
                        ) : (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Confirmado</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{reg.event.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
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
                  <p className="text-xs text-gray-400 mt-3">
                    Inscrito em {new Date(reg.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
