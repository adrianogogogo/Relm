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
  RECEBIDO: 'bg-blue-50 text-blue-700 dark:bg-blue-900/35 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40',
  EM_ANALISE: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/35 dark:text-yellow-400 border border-yellow-200/50 dark:border-yellow-800/40',
  AGUARDANDO_CLIENTE: 'bg-orange-50 text-orange-700 dark:bg-orange-900/35 dark:text-orange-400 border border-orange-200/50 dark:border-orange-800/40',
  APROVADO: 'bg-green-50 text-green-700 dark:bg-green-900/35 dark:text-green-400 border border-green-200/50 dark:border-green-800/40',
  REPROVADO: 'bg-red-50 text-red-700 dark:bg-red-900/35 dark:text-red-400 border border-red-200/50 dark:border-red-800/40',
  FINALIZADO: 'bg-gray-50 text-gray-700 dark:bg-slate-800 dark:text-slate-300 border border-gray-200/50 dark:border-slate-700/40',
  CANCELADO: 'bg-gray-50 text-gray-500 dark:bg-slate-800 dark:text-slate-400 border border-gray-200/50 dark:border-slate-700/40',
};

export default function CustomerWarrantiesPage() {
  const { data: warranties = [], isLoading } = useQuery({
    queryKey: ['customer-warranties'],
    queryFn: customerPortalAPI.getWarranties,
  });

  return (
    <div className="py-8 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100">Minhas Garantias</h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Acompanhe o status das suas solicitações</p>
          </div>
          <Link to="/garantia" className="btn btn-primary text-sm">
            + Nova garantia
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400 dark:text-slate-500">Carregando...</div>
        ) : warranties.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/60 rounded-2xl shadow-sm p-12 text-center flex flex-col items-center">
            <Shield className="h-12 w-12 text-gray-300 dark:text-slate-700 mb-4" />
            <p className="text-gray-500 dark:text-slate-400 mb-4">Você ainda não tem garantias registradas.</p>
            <Link to="/garantia" className="btn btn-primary">Registrar garantia</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {warranties.map((w) => (
              <div key={w.id} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/60 rounded-2xl shadow-sm p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-800 dark:text-slate-200 text-lg">{w.protocolNumber}</p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      {w.product?.brand} {w.product?.model} ({w.product?.productType})
                    </p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                      NF: {w.invoiceNumber} • Loja: {w.purchaseStoreName}
                    </p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold whitespace-nowrap ${STATUS_COLOR[w.status]}`}>
                    {STATUS_LABEL[w.status] || w.status}
                  </span>
                </div>

                {w.customerNotes && (
                  <div className="bg-gray-50 dark:bg-slate-800/50 border dark:border-slate-800/60 rounded-xl p-3 mb-3 text-sm text-gray-600 dark:text-slate-300">
                    <span className="font-semibold text-gray-800 dark:text-slate-200">Sua descrição: </span>{w.customerNotes}
                  </div>
                )}

                {w.rejectionReason && (
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl p-3 mb-3 text-sm text-red-700 dark:text-red-400">
                    <span className="font-semibold">Motivo da reprovação: </span>{w.rejectionReason}
                  </div>
                )}

                {/* Timeline de eventos */}
                {w.events?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-2">Histórico</p>
                    <div className="space-y-1">
                      {w.events.map((ev, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary dark:bg-secondary shrink-0" />
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

                <p className="text-xs text-gray-400 dark:text-slate-500 mt-3">
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
