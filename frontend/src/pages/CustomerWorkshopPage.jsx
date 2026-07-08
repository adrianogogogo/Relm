import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { workshopAPI, storesAPI } from '../services/api';
import { useEntitlements } from '../hooks/useEntitlements';
import { Card, PageHeader, Button, StatusChip } from '../components/ui';
import { MdEvent, MdBuild, MdDirectionsBike, MdLocalShipping, MdLock } from 'react-icons/md';

const LOGISTICS_STEPS = [
  { key: 'COLETA_AGENDADA', label: 'Coleta agendada' },
  { key: 'EM_TRANSPORTE_COLETA', label: 'Em transporte (coleta)' },
  { key: 'NA_OFICINA', label: 'Na oficina' },
  { key: 'EM_TRANSPORTE_ENTREGA', label: 'Em transporte (entrega)' },
  { key: 'ENTREGUE', label: 'Entregue' },
];

const SERVICE_LABELS = {
  REVISION_BASIC: 'Revisão Básica',
  REVISION_COMPLETE: 'Revisão Completa',
  DIAGNOSTIC: 'Diagnóstico Técnico',
  LAVAGEM_LUBRIFICACAO: 'Lavagem e Lubrificação',
  BUSCA_ENTREGA: 'Busca e Entrega',
  BIKE_FITTING: 'Bike Fitting',
};

export default function CustomerWorkshopPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isPlus = user?.currentTier === 'PLUS';
  const { care: careEnt } = useEntitlements();
  const careQuota = careEnt?.freeBasicRevisionsPerYear ?? 1;

  const [storeId, setStoreId] = useState('');
  const [bikeModel, setBikeModel] = useState('');
  const [serviceType, setServiceType] = useState('REVISION_BASIC');
  const [scheduledFor, setScheduledFor] = useState('');
  const [deliveryRequest, setDeliveryRequest] = useState(false);
  const [pickupAddress, setPickupAddress] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Saldo anual por tipo (Wave 6) — fonte de verdade vem do backend
  const { data: allowance } = useQuery({
    queryKey: ['workshop-allowance', user?.id],
    queryFn: () => workshopAPI.getAllowance(user?.id),
    enabled: !!user?.id,
  });
  const allowanceItems = allowance?.items || [];
  const allowanceByType = Object.fromEntries(allowanceItems.map((i) => [i.serviceType, i]));
  const isBuscaEntrega = serviceType === 'BUSCA_ENTREGA';

  // Fetch available slots
  const { data: slotsData, isLoading: loadingSlots } = useQuery({
    queryKey: ['available-slots', user?.id],
    queryFn: () => workshopAPI.getAvailableSlots(user?.id),
    enabled: !!user?.id,
  });

  // Fetch stores
  const { data: stores = [], isLoading: loadingStores } = useQuery({
    queryKey: ['public-stores'],
    queryFn: () => storesAPI.getPublicStores(),
  });

  // Fetch my active service orders
  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['my-service-orders', user?.id],
    queryFn: () => workshopAPI.getCustomerOrders(user?.id),
    enabled: !!user?.id,
  });

  const availableSlots = slotsData?.availableSlots || [];

  // Book service mutation
  const bookMutation = useMutation({
    mutationFn: workshopAPI.bookSlot,
    onSuccess: () => {
      setSuccessMsg('Revisão agendada com sucesso!');
      setErrorMsg('');
      setStoreId('');
      setBikeModel('');
      setServiceType('REVISION_BASIC');
      setScheduledFor('');
      setDeliveryRequest(false);
      setPickupAddress('');
      queryClient.invalidateQueries({ queryKey: ['my-service-orders', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['available-slots', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['workshop-allowance', user?.id] });
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Falha ao agendar revisão.');
      setSuccessMsg('');
    },
  });

  const handleBook = (e) => {
    e.preventDefault();
    if (!storeId || !bikeModel || !scheduledFor) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    if (isBuscaEntrega && !pickupAddress.trim()) {
      setErrorMsg('Informe o endereço de coleta para a busca e entrega.');
      return;
    }

    bookMutation.mutate({
      customerId: user.id,
      storeId,
      bikeModel,
      serviceType,
      scheduledFor: new Date(scheduledFor),
      deliveryRequest: isPlus ? deliveryRequest : false,
      pickupAddress: isBuscaEntrega ? pickupAddress.trim() : undefined,
    });
  };

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
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title="Agendamento de Oficina"
          subtitle="Agende as revisões periódicas da sua bicicleta com agilidade"
        />

        {/* Tier Info Card */}
        <div className={`rounded-xl p-5 mb-6 text-white ${isPlus ? 'bg-gradient-to-r from-amber-500 to-yellow-600' : 'bg-gradient-to-r from-teal-500 to-emerald-600'}`}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-full shrink-0">
              {isPlus ? <MdBuild className="w-6 h-6 text-yellow-100" /> : <MdDirectionsBike className="w-6 h-6 text-teal-100" />}
            </div>
            <div>
              <h4 className="font-bold text-lg">{isPlus ? 'Você é membro Care Plus! 🌟' : 'Você é membro Care (Gratuito)'}</h4>
              <p className="text-sm opacity-90">
                {isPlus
                  ? 'Você tem direito a agendamento prioritário de oficina, revisões completas ilimitadas e serviço de busca e entrega (leva-e-traz) grátis!'
                  : `Você tem direito a ${careQuota} Revisão(ões) Básica(s) por ano civil. Upgrades de serviços e logística de leva-e-traz estão bloqueados (disponíveis apenas no Care Plus).`}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Booking Form */}
          <Card className="lg:col-span-2">
            <h3 className="font-title font-bold text-lg text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <MdEvent /> Novo Agendamento
            </h3>

            {successMsg && (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 px-4 py-3 rounded-lg text-sm mb-4">
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 px-4 py-3 rounded-lg text-sm mb-4">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleBook} className="space-y-4">
              <div>
                <label className="label">Loja Autorizada *</label>
                <select
                  className="input"
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                  disabled={loadingStores}
                >
                  <option value="">Selecione uma loja...</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - {s.city}/{s.state}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Modelo da Bicicleta *</label>
                <input
                  type="text"
                  placeholder="Ex: Relm Carbon Pro 2026"
                  className="input"
                  value={bikeModel}
                  onChange={(e) => setBikeModel(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label">Tipo de Serviço *</label>
                <select
                  className="input"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                >
                  {allowanceItems.map((it) => {
                    const locked = !it.includedInTier;
                    const exhausted = it.includedInTier && it.remaining <= 0;
                    const suffix = locked
                      ? '🔒 (Seja Plus)'
                      : `— ${it.remaining} de ${it.allowed} disponível${it.allowed > 1 ? 'is' : ''}`;
                    return (
                      <option key={it.serviceType} value={it.serviceType} disabled={locked || exhausted}>
                        {it.label} {suffix}{exhausted && ' (esgotado)'}
                      </option>
                    );
                  })}
                  <option value="DIAGNOSTIC" disabled={!isPlus}>
                    Diagnóstico Elétrico/Eletrônico {!isPlus && '🔒 (Seja Plus)'}
                  </option>
                </select>
                {!isPlus && (
                  <p className="text-xs text-purple-500 mt-1 flex items-center gap-1">
                    <MdLock className="inline" /> Serviços bloqueados são exclusivos do Care Plus.
                  </p>
                )}
              </div>

              {/* Endereço de coleta — só para Busca e Entrega */}
              {isBuscaEntrega && (
                <div>
                  <label className="label">Endereço de Coleta *</label>
                  <input
                    type="text"
                    placeholder="Rua, número, bairro, cidade"
                    className="input"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="label">Horários Disponíveis (Prioritários para Plus) *</label>
                <select
                  className="input"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  disabled={loadingSlots}
                >
                  <option value="">Selecione um horário disponível...</option>
                  {availableSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {formatDate(slot)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Delivery Request Checkbox */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="deliveryRequest"
                  className="rounded border-gray-300 text-amber-500 focus:ring-amber-500 h-4 w-4 disabled:opacity-50"
                  checked={deliveryRequest}
                  onChange={(e) => setDeliveryRequest(e.target.checked)}
                  disabled={!isPlus}
                />
                <label
                  htmlFor="deliveryRequest"
                  className={`text-sm select-none flex items-center gap-1.5 ${!isPlus ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 dark:text-slate-300 font-medium'}`}
                >
                  <MdLocalShipping className={isPlus ? 'text-amber-500' : 'text-gray-400'} />
                  Solicitar busca e entrega em meu endereço
                  {!isPlus && <span className="text-xs text-purple-500 font-bold flex items-center gap-0.5"><MdLock /> (Exclusivo Plus)</span>}
                </label>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  loading={bookMutation.isPending}
                >
                  Confirmar Agendamento
                </Button>
              </div>
            </form>
          </Card>

          {/* Booking History */}
          <Card className="lg:col-span-1">
            <h3 className="font-title font-bold text-lg text-gray-900 dark:text-slate-100 mb-4">
              Meus Agendamentos
            </h3>

            {loadingOrders ? (
              <div className="flex justify-center py-8">
                <span className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : orders.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-slate-400 text-center py-6">
                Nenhum agendamento ativo.
              </p>
            ) : (
              <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                {orders.map((o) => (
                  <div
                    key={o.id}
                    className="p-3 bg-gray-50 dark:bg-slate-900/40 rounded-lg border border-gray-100 dark:border-slate-800 text-xs space-y-2"
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className="font-semibold text-gray-800 dark:text-slate-200">
                        {o.bikeModel}
                      </span>
                      <StatusChip status={o.status} />
                    </div>
                    <p className="text-gray-500 dark:text-slate-400">
                      {SERVICE_LABELS[o.serviceType] || o.serviceType}
                    </p>
                    <p className="text-gray-600 dark:text-slate-300 font-medium">
                      📅 {formatDate(o.scheduledFor)}
                    </p>
                    <p className="text-gray-500 dark:text-slate-400 italic">
                      📍 {o.store?.name}
                    </p>
                    {o.deliveryRequest && o.serviceType !== 'BUSCA_ENTREGA' && (
                      <div className="flex items-center gap-1 text-amber-500 font-semibold text-[10px]">
                        <MdLocalShipping /> Leva-e-Traz solicitado
                      </div>
                    )}
                    {/* Timeline de logística (Busca e Entrega) */}
                    {o.serviceType === 'BUSCA_ENTREGA' && o.logisticsStatus && (
                      <div className="pt-1 border-t border-gray-100 dark:border-slate-800 mt-1">
                        <p className="flex items-center gap-1 text-amber-600 font-semibold text-[10px] mb-1">
                          <MdLocalShipping /> Rastreamento leva-e-traz
                        </p>
                        <ol className="space-y-0.5">
                          {LOGISTICS_STEPS.map((step, idx) => {
                            const currentIdx = LOGISTICS_STEPS.findIndex((s) => s.key === o.logisticsStatus);
                            const done = idx <= currentIdx;
                            return (
                              <li key={step.key} className={`flex items-center gap-1.5 text-[10px] ${done ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-gray-400'}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${done ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                {step.label}
                              </li>
                            );
                          })}
                        </ol>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
