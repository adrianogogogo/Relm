import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdPayments, MdSearch, MdWarning } from 'react-icons/md';
import { useAuthStore } from '../store/authStore';
import { paymentsAPI, customersAPI } from '../services/api';
import { Card, PageHeader, StatusChip, Button } from '../components/ui';

const STATUS_LABEL = {
  PENDING: 'Aguardando Relm',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
};
const STATUS_VARIANT = {
  PENDING: 'warning',
  CONFIRMED: 'success',
  CANCELLED: 'neutral',
};

function formatBRL(value) {
  const n = Number(value);
  return `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

export default function StorePaymentsPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const storeId = user?.storeId;

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerFilter, setCustomerFilter] = useState('');
  const [feedback, setFeedback] = useState(null);

  const { data: annualFee } = useQuery({
    queryKey: ['store-payment-annual-fee'],
    queryFn: paymentsAPI.storeGetAnnualFee,
  });

  const feeAmount = annualFee?.amount ?? 0;
  const feeUnconfigured = !feeAmount || Number(feeAmount) <= 0;

  const { data: customersResponse } = useQuery({
    queryKey: ['store-payment-customers', storeId, user?.id],
    queryFn: () => customersAPI.getAll({ storeId, pageSize: 200 }),
    enabled: !!user,
    select: (res) => (Array.isArray(res) ? res : res?.data ?? []),
  });
  const allCustomers = customersResponse || [];

  // Client-side text filter to mitigate the 200-customer cap.
  const customers = useMemo(() => {
    if (!customerFilter.trim()) return allCustomers;
    const q = customerFilter.toLowerCase();
    return allCustomers.filter(
      (c) =>
        c.fullName?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.cpf?.includes(q) ||
        c.phone?.includes(q)
    );
  }, [allCustomers, customerFilter]);

  const selectedCustomerObj = useMemo(
    () => allCustomers.find((c) => c.id === selectedCustomer),
    [allCustomers, selectedCustomer]
  );

  const handleFilterChange = (val) => {
    setCustomerFilter(val);
    const q = val.toLowerCase().trim();
    if (!q) {
      setSelectedCustomer(null);
      return;
    }
    const matches = allCustomers.filter(
      (c) =>
        c.fullName?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.cpf?.includes(q) ||
        c.phone?.includes(q)
    );
    if (matches.length === 1) {
      setSelectedCustomer(matches[0].id);
    } else if (matches.length > 0 && (!selectedCustomer || !matches.some((c) => c.id === selectedCustomer))) {
      setSelectedCustomer(matches[0].id);
    } else if (matches.length === 0) {
      setSelectedCustomer(null);
    }
  };

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['store-payments'],
    queryFn: paymentsAPI.storeGetMine,
  });

  const registerMutation = useMutation({
    mutationFn: (payload) => paymentsAPI.storeRegister(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-payments'] });
      setFeedback({
        type: 'success',
        text: 'Pagamento registrado. Aguardando confirmação da Relm para renovar a assinatura.',
      });
      setSelectedCustomer(null);
      setCustomerFilter('');
    },
    onError: (err) =>
      setFeedback({ type: 'error', text: err?.response?.data?.message || 'Falha ao registrar pagamento.' }),
  });

  const handleRegister = (e) => {
    e.preventDefault();
    if (!selectedCustomer) {
      setFeedback({ type: 'error', text: 'Selecione um cliente.' });
      return;
    }
    // Loja não envia amount — o backend sempre usa ClubSettings.
    registerMutation.mutate({ customerId: selectedCustomer });
  };

  return (
    <div className="py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Pagamentos da Anuidade"
          subtitle="Registre o pagamento da anuidade Care Plus. A Relm confirma e a assinatura é renovada."
        />

        {feedback && (
          <div
            className={`mb-6 rounded-lg px-4 py-3 text-sm ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            }`}
          >
            {feedback.text}
          </div>
        )}

        {/* [FINDING 11] Aviso quando a anuidade não está configurada. */}
        {feeUnconfigured && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
            <MdWarning className="w-5 h-5 flex-shrink-0" />
            <span>Anuidade não configurada. Contate a Relm antes de registrar pagamentos.</span>
          </div>
        )}

        <Card className="mb-6">
          <h2 className="font-title text-lg font-bold text-gray-900 dark:text-slate-100 mb-4">
            Registrar Pagamento
          </h2>

          {/* Valor da anuidade exibido como somente-leitura (loja não pode alterar). */}
          <div className="mb-4 flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">
              Valor da Anuidade:
            </span>
            <span className="font-medium text-gray-900 dark:text-slate-100">
              {feeUnconfigured ? (
                <span className="text-amber-600 dark:text-amber-400">Não configurado</span>
              ) : (
                formatBRL(feeAmount)
              )}
            </span>
          </div>

          <form onSubmit={handleRegister} className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1 uppercase">
                Filtrar clientes
              </label>
              <div className="relative mb-2">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Digite nome ou e-mail para filtrar..."
                  value={customerFilter}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="input pl-10"
                />
              </div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1 uppercase">
                Cliente
              </label>
              <select
                value={selectedCustomer || ''}
                onChange={(e) => setSelectedCustomer(e.target.value || null)}
                className="input"
              >
                <option value="">Selecione um cliente...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} — {c.email}
                  </option>
                ))}
              </select>

              {selectedCustomerObj && (
                <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-lg text-xs flex items-center justify-between text-emerald-900 dark:text-emerald-200">
                  <div>
                    <p className="font-bold text-sm">{selectedCustomerObj.fullName}</p>
                    <p className="text-emerald-700 dark:text-emerald-400">{selectedCustomerObj.email}</p>
                  </div>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-800 shrink-0">
                    Cliente Selecionado ✓
                  </span>
                </div>
              )}
            </div>

            <div>
              <Button
                type="submit"
                icon={MdPayments}
                disabled={registerMutation.isPending || feeUnconfigured}
              >
                {registerMutation.isPending ? 'Registrando...' : 'Registrar pagamento'}
              </Button>
              <span className="ml-3 text-xs text-gray-500 dark:text-slate-400">
                O pagamento fica pendente até a Relm confirmar.
              </span>
            </div>
          </form>
        </Card>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500 dark:text-slate-400">Carregando pagamentos...</div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12">
            <MdPayments className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-slate-400 text-lg">Nenhum pagamento registrado.</p>
          </div>
        ) : (
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/40 border-b border-gray-200 dark:border-slate-800">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Cliente</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Valor</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 dark:text-slate-100">{p.customer?.fullName || '—'}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{p.customer?.email}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-slate-300">{formatBRL(p.amount)}</td>
                      <td className="px-6 py-4">
                        <StatusChip label={STATUS_LABEL[p.status] || p.status} variant={STATUS_VARIANT[p.status] || 'neutral'} />
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-slate-400 text-sm">
                        {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
