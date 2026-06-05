import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Shield } from 'lucide-react';
import { customerPortalAPI } from '../services/api';

const STATUS_LABEL = {
  RECEBIDO: 'Recebido',
  EM_ANALISE: 'Em Análise',
  AGUARDANDO_CLIENTE: 'Aguardando Cliente',
  APROVADO: 'Aprovado',
  REPROVADO: 'Reprovado',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
};

const STATUS_COLOR = {
  RECEBIDO: 'bg-blue-100 text-blue-800',
  EM_ANALISE: 'bg-yellow-100 text-yellow-800',
  AGUARDANDO_CLIENTE: 'bg-orange-100 text-orange-800',
  APROVADO: 'bg-green-100 text-green-800',
  REPROVADO: 'bg-red-100 text-red-800',
  FINALIZADO: 'bg-gray-100 text-gray-700',
  CANCELADO: 'bg-gray-100 text-gray-500',
};

export default function CustomerWarrantiesPage() {
  const { data: warranties = [], isLoading } = useQuery({
    queryKey: ['customer-warranties'],
    queryFn: customerPortalAPI.getWarranties,
  });

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Minhas Garantias</h1>
            <p className="text-gray-500 text-sm mt-1">Acompanhe o status das suas solicitações</p>
          </div>
          <Link to="/garantia" className="btn btn-primary text-sm">
            + Nova garantia
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Carregando...</div>
        ) : warranties.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center flex flex-col items-center">
            <Shield className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">Você ainda não tem garantias registradas.</p>
            <Link to="/garantia" className="btn btn-primary">Registrar garantia</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {warranties.map((w) => (
              <div key={w.id} className="bg-white rounded-xl shadow p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-800 text-lg">{w.protocolNumber}</p>
                    <p className="text-sm text-gray-500">
                      {w.product?.brand} {w.product?.model} ({w.product?.productType})
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      NF: {w.invoiceNumber} • Loja: {w.purchaseStoreName}
                    </p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold whitespace-nowrap ${STATUS_COLOR[w.status]}`}>
                    {STATUS_LABEL[w.status] || w.status}
                  </span>
                </div>

                {w.customerNotes && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3 text-sm text-gray-600">
                    <span className="font-semibold">Sua descrição: </span>{w.customerNotes}
                  </div>
                )}

                {w.rejectionReason && (
                  <div className="bg-red-50 rounded-lg p-3 mb-3 text-sm text-red-700">
                    <span className="font-semibold">Motivo da reprovação: </span>{w.rejectionReason}
                  </div>
                )}

                {/* Timeline de eventos */}
                {w.events?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Histórico</p>
                    <div className="space-y-1">
                      {w.events.map((ev, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          <span>
                            {ev.toStatus
                              ? `${STATUS_LABEL[ev.fromStatus] || ev.fromStatus} → ${STATUS_LABEL[ev.toStatus] || ev.toStatus}`
                              : ev.eventType}
                            {ev.comment && ` — ${ev.comment}`}
                          </span>
                          <span className="ml-auto shrink-0">
                            {new Date(ev.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-400 mt-3">
                  Aberta em {new Date(w.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
