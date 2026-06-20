import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Shield, Plus } from 'lucide-react';
import { customerPortalAPI } from '../services/api';
import { Card, PageHeader, StatusChip, Button } from '../components/ui';

const STATUS_LABEL = {
  RECEBIDO: 'Recebido',
  EM_ANALISE: 'Em Análise',
  AGUARDANDO_CLIENTE: 'Aguardando Cliente',
  APROVADO: 'Aprovado',
  REPROVADO: 'Reprovado',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
};

// Mapeia status -> variante semantica do StatusChip
const STATUS_VARIANT = {
  RECEBIDO: 'info',
  EM_ANALISE: 'warning',
  AGUARDANDO_CLIENTE: 'warning',
  APROVADO: 'success',
  REPROVADO: 'error',
  FINALIZADO: 'neutral',
  CANCELADO: 'neutral',
};

export default function CustomerWarrantiesPage() {
  const { data: warranties = [], isLoading } = useQuery({
    queryKey: ['customer-warranties'],
    queryFn: customerPortalAPI.getWarranties,
  });

  return (
    <div className="py-8 px-6">
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title="Minhas Garantias"
          subtitle="Acompanhe o status das suas solicitações"
          action={
            <Link to="/garantia">
              <Button icon={Plus}>Nova garantia</Button>
            </Link>
          }
        />

        {isLoading ? (
          <div className="flex justify-center py-16">
            <span className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : warranties.length === 0 ? (
          <Card className="p-12 text-center flex flex-col items-center">
            <Shield className="h-12 w-12 text-gray-300 dark:text-slate-700 mb-4" />
            <p className="text-gray-500 dark:text-slate-400 mb-4">Você ainda não tem garantias registradas.</p>
            <Link to="/garantia">
              <Button>Registrar garantia</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {warranties.map((w) => (
              <Card key={w.id}>
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800 dark:text-slate-200 text-lg">{w.protocolNumber}</p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      {w.product?.brand} {w.product?.model} ({w.product?.productType})
                    </p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                      NF: {w.invoiceNumber} • Loja: {w.purchaseStoreName}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <StatusChip
                      label={STATUS_LABEL[w.status] || w.status}
                      variant={STATUS_VARIANT[w.status] || 'neutral'}
                    />
                  </div>
                </div>

                {w.customerNotes && (
                  <div className="bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800/60 rounded-lg p-3 mb-3 text-sm text-gray-600 dark:text-slate-300">
                    <span className="font-semibold text-gray-800 dark:text-slate-200">Sua descrição: </span>{w.customerNotes}
                  </div>
                )}

                {w.rejectionReason && (
                  <div className="bg-error/10 border border-error/20 rounded-lg p-3 mb-3 text-sm text-error">
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
                          <span className="w-1.5 h-1.5 rounded-full bg-primary dark:bg-primary-400 shrink-0" />
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
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
