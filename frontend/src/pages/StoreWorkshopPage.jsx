import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { workshopAPI } from '../services/api';
import { Card, PageHeader, Button, StatusChip } from '../components/ui';
import { MdBuild, MdDirectionsBike, MdLocalShipping, MdPriorityHigh, MdPlayArrow, MdCheck, MdClose, MdArrowForward } from 'react-icons/md';

const SERVICE_LABELS = {
  REVISION_BASIC: 'Revisão Básica',
  REVISION_COMPLETE: 'Revisão Completa',
  DIAGNOSTIC: 'Diagnóstico Técnico',
  LAVAGEM_LUBRIFICACAO: 'Lavagem e Lubrificação',
  BUSCA_ENTREGA: 'Busca e Entrega',
  BIKE_FITTING: 'Bike Fitting',
};

// Próxima etapa da logística + rótulo do botão
const LOGISTICS_NEXT = {
  COLETA_AGENDADA: { next: 'EM_TRANSPORTE_COLETA', label: 'Iniciar coleta' },
  EM_TRANSPORTE_COLETA: { next: 'NA_OFICINA', label: 'Chegou na oficina' },
  NA_OFICINA: { next: 'EM_TRANSPORTE_ENTREGA', label: 'Sair p/ entrega' },
  EM_TRANSPORTE_ENTREGA: { next: 'ENTREGUE', label: 'Confirmar entrega' },
  ENTREGUE: null,
};

const LOGISTICS_LABELS = {
  COLETA_AGENDADA: 'Coleta agendada',
  EM_TRANSPORTE_COLETA: 'Em transporte (coleta)',
  NA_OFICINA: 'Na oficina',
  EM_TRANSPORTE_ENTREGA: 'Em transporte (entrega)',
  ENTREGUE: 'Entregue',
};

export default function StoreWorkshopPage() {
  const user = useAuthStore((state) => state.user);
  const storeId = user?.storeId;
  const queryClient = useQueryClient();

  // Fetch store-specific service orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['store-service-orders', storeId],
    queryFn: () => workshopAPI.getStoreOrders(storeId),
    enabled: !!storeId,
  });

  // Mutation to update service order status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => workshopAPI.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-service-orders', storeId] });
    },
  });

  const handleStatusChange = (id, newStatus) => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  // Avança a logística leva-e-traz (busca e entrega)
  const advanceLogisticsMutation = useMutation({
    mutationFn: ({ id, logisticsStatus }) => workshopAPI.advanceLogistics(id, logisticsStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-service-orders', storeId] });
    },
  });

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Oficina / Serviços"
          subtitle="Gerencie os agendamentos, revisões e andamento dos serviços de manutenção"
        />

        {isLoading ? (
          <div className="flex justify-center py-16">
            <span className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <Card className="p-12 text-center flex flex-col items-center">
            <MdBuild className="h-12 w-12 text-gray-300 dark:text-slate-700 mb-4" />
            <p className="text-gray-500 dark:text-slate-400">Nenhum agendamento de oficina para esta loja.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Orders Table/List */}
            <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-800 text-gray-500 dark:text-slate-400 font-semibold">
                    <th className="p-4">Cliente / Plano</th>
                    <th className="p-4">Bicicleta</th>
                    <th className="p-4">Serviço / Prioridade</th>
                    <th className="p-4">Agendado Para</th>
                    <th className="p-4">Entrega/Busca</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-800 dark:text-slate-200">
                  {orders.map((o) => {
                    const isVip = o.isPriority ?? (o.customer?.currentTier === 'PLUS');
                    return (
                      <tr key={o.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        {/* Cliente Info */}
                        <td className="p-4">
                          <p className="font-bold">{o.customer?.name}</p>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isVip ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-gray-100 text-gray-700 dark:bg-slate-800'
                          }`}>
                            {isVip ? '★ PLUS' : 'Care Base'}
                          </span>
                        </td>

                        {/* Bike Info */}
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <MdDirectionsBike className="text-gray-400" size={18} />
                            <span>{o.bikeModel}</span>
                          </div>
                        </td>

                        {/* Servico Info */}
                        <td className="p-4 space-y-1">
                          <p className="font-semibold">
                            {SERVICE_LABELS[o.serviceType] || o.serviceType}
                          </p>
                          {o.priority === 'HIGH_PRIORITY' ? (
                            <span className="inline-flex items-center gap-0.5 text-xs text-rose-500 font-bold">
                              <MdPriorityHigh /> Fila Prioritária
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Normal</span>
                          )}
                        </td>

                        {/* Data Info */}
                        <td className="p-4 font-medium text-gray-900 dark:text-slate-100">
                          {formatDate(o.scheduledFor)}
                        </td>

                        {/* Logistics Info */}
                        <td className="p-4">
                          {o.serviceType === 'BUSCA_ENTREGA' ? (
                            <div className="space-y-1.5">
                              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold text-xs">
                                <MdLocalShipping /> {LOGISTICS_LABELS[o.logisticsStatus] || 'Leva-e-Traz'}
                              </span>
                              {o.pickupAddress && (
                                <p className="text-[10px] text-gray-400 italic max-w-[160px]">📍 {o.pickupAddress}</p>
                              )}
                              {LOGISTICS_NEXT[o.logisticsStatus] && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-amber-600 border-amber-500 hover:bg-amber-500 hover:text-white text-[11px]"
                                  loading={advanceLogisticsMutation.isPending}
                                  onClick={() =>
                                    advanceLogisticsMutation.mutate({
                                      id: o.id,
                                      logisticsStatus: LOGISTICS_NEXT[o.logisticsStatus].next,
                                    })
                                  }
                                >
                                  <MdArrowForward /> {LOGISTICS_NEXT[o.logisticsStatus].label}
                                </Button>
                              )}
                            </div>
                          ) : o.deliveryRequest ? (
                            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                              <MdLocalShipping /> Leva-e-Traz
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>

                        {/* Status Chip */}
                        <td className="p-4">
                          <StatusChip status={o.status} />
                        </td>

                        {/* Status update actions */}
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            {o.status === 'SCHEDULED' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-blue-500 border-blue-500 hover:bg-blue-500 hover:text-white"
                                onClick={() => handleStatusChange(o.id, 'IN_PROGRESS')}
                              >
                                <MdPlayArrow /> Iniciar
                              </Button>
                            )}
                            {o.status === 'IN_PROGRESS' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-emerald-500 border-emerald-500 hover:bg-emerald-500 hover:text-white"
                                onClick={() => handleStatusChange(o.id, 'COMPLETED')}
                              >
                                <MdCheck /> Finalizar
                              </Button>
                            )}
                            {o.status !== 'COMPLETED' && o.status !== 'CANCELLED' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-rose-500 border-rose-500 hover:bg-rose-500 hover:text-white"
                                onClick={() => handleStatusChange(o.id, 'CANCELLED')}
                              >
                                <MdClose /> Cancelar
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
