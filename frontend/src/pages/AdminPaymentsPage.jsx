import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdPayments, MdSearch, MdCheck, MdClose, MdWarning } from 'react-icons/md';
import { paymentsAPI, customersAPI } from '../services/api';
import { Card, PageHeader, StatusChip, Button } from '../components/ui';

const STATUS_LABEL = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
};
const STATUS_VARIANT = {
  PENDING: 'warning',
  CONFIRMED: 'success',
  CANCELLED: 'neutral',
};
const METHOD_LABEL = {
  MANUAL_LOJA: 'Registro Loja',
  MANUAL_RELM: 'Registro Relm',
  GATEWAY: 'Gateway',
};

function formatBRL(value) {
  const n = Number(value);
  return `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

export default function AdminPaymentsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [feedback, setFeedback] = useState(null);

  // ── Formulário de registro ──────────────────────────────────────────────
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('MANUAL_RELM');

  const { data: annualFee } = useQuery({
    queryKey: ['payment-annual-fee'],
    queryFn: paymentsAPI.getAnnualFee,
  });

  // Valor da anuidade pré-preenchido a partir de ClubSettings.
  const prefilledAmount = amount || (annualFee?.amount ?? '');
  const feeUnconfigured = !annualFee?.amount || Number(annualFee.amount) <= 0;

  const { data: customerResults = [] } = useQuery({
    queryKey: ['payment-customer-search', customerSearch],
    queryFn: () => customersAPI.getAll({ search: customerSearch }),
    enabled: customerSearch.length >= 2,
    select: (res) => (Array.isArray(res) ? res : res?.data ?? []),
  });

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['admin-payments', statusFilter],
    queryFn: () => paymentsAPI.getAll(statusFilter ? { status: statusFilter } : {}),
  });

  const registerMutation = useMutation({
    mutationFn: (payload) => paymentsAPI.register(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      setFeedback({ type: 'success', text: 'Pagamento registrado e confirmado. Assinatura renovada.' });
      setSelectedCustomer(null);
      setCustomerSearch('');
      setAmount('');
    },
    onError: (err) =>
      setFeedback({ type: 'error', text: err?.response?.data?.message || 'Falha ao registrar pagamento.' }),
  });

  const confirmMutation = useMutation({
    mutationFn: (id) => paymentsAPI.confirm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      setFeedback({ type: 'success', text: 'Pagamento confirmado. Assinatura renovada por 1 ano.' });
    },
    onError: (err) =>
      setFeedback({ type: 'error', text: err?.response?.data?.message || 'Falha ao confirmar.' }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => paymentsAPI.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      setFeedback({ type: 'success', text: 'Pagamento cancelado.' });
    },
    onError: (err) =>
      setFeedback({ type: 'error', text: err?.response?.data?.message || 'Falha ao cancelar.' }),
  });

  const handleRegister = (e) => {
    e.preventDefault();
    if (!selectedCustomer) {
      setFeedback({ type: 'error', text: 'Selecione um cliente.' });
      return;
    }
    registerMutation.mutate({
      customerId: selectedCustomer.id,
      amount: prefilledAmount ? Number(prefilledAmount) : undefined,
      method,
    });
  };

  return (
    <div className="py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Pagamentos da Anuidade"
          subtitle="Registre a anuidade Care Plus e confirme os pagamentos pendentes das lojas."
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
            <span>Anuidade não configurada. Configure o valor em ClubSettings antes de registrar pagamentos.</span>
          </div>
        )}

        {/* Registro de pagamento */}
        <Card className="mb-6">
          <h2 className="font-title text-lg font-bold text-gray-900 dark:text-slate-100 mb-4">
            Registrar Pagamento
          </h2>
          <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1 uppercase">
                Cliente
              </label>
              <div className="relative">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou e-mail..."
                  value={selectedCustomer ? `${selectedCustomer.fullName} (${selectedCustomer.email})` : customerSearch}
                  onChange={(e) => {
                    setSelectedCustomer(null);
                    setCustomerSearch(e.target.value);
                  }}
                  className="input pl-10"
                />
              </div>
              {!selectedCustomer && customerSearch.length >= 2 && customerResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
                  {customerResults.slice(0, 8).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(c);
                        setCustomerSearch('');
                      }}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-700"
                    >
                      <span className="font-medium text-gray-900 dark:text-slate-100">{c.fullName}</span>
                      <span className="text-gray-500 dark:text-slate-400"> — {c.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1 uppercase">
                Valor (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={prefilledAmount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Anuidade"
                className="input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1 uppercase">
                Método
              </label>
              <select value={method} onChange={(e) => setMethod(e.target.value)} className="input">
                <option value="MANUAL_RELM">Registro Relm</option>
                <option value="MANUAL_LOJA">Registro Loja</option>
              </select>
            </div>

            <div className="md:col-span-4">
              <Button type="submit" icon={MdPayments} disabled={registerMutation.isPending || feeUnconfigured}>
                {registerMutation.isPending ? 'Registrando...' : 'Registrar e confirmar'}
              </Button>
              <span className="ml-3 text-xs text-gray-500 dark:text-slate-400">
                Registros pela Relm são confirmados imediatamente e renovam a assinatura.
              </span>
            </div>
          </form>
        </Card>

        {/* Lista + filtro */}
        <Card className="mb-4 flex flex-col md:flex-row gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input md:w-56"
          >
            <option value="">Todos os status</option>
            <option value="PENDING">Pendente</option>
            <option value="CONFIRMED">Confirmado</option>
            <option value="CANCELLED">Cancelado</option>
          </select>
        </Card>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500 dark:text-slate-400">Carregando pagamentos...</div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12">
            <MdPayments className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-slate-400 text-lg">Nenhum pagamento encontrado.</p>
          </div>
        ) : (
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/40 border-b border-gray-200 dark:border-slate-800">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Cliente</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Valor</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Método</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Data</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Ações</th>
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
                      <td className="px-6 py-4 text-gray-600 dark:text-slate-400 text-sm">{METHOD_LABEL[p.method] || p.method}</td>
                      <td className="px-6 py-4">
                        <StatusChip label={STATUS_LABEL[p.status] || p.status} variant={STATUS_VARIANT[p.status] || 'neutral'} />
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-slate-400 text-sm">
                        {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {p.status === 'PENDING' ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outlined"
                              color="success"
                              icon={MdCheck}
                              className="!py-1 !px-3 text-sm"
                              disabled={confirmMutation.isPending}
                              onClick={() => confirmMutation.mutate(p.id)}
                            >
                              Confirmar
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              icon={MdClose}
                              className="!py-1 !px-3 text-sm"
                              disabled={cancelMutation.isPending}
                              onClick={() => cancelMutation.mutate(p.id)}
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-slate-600 text-sm">—</span>
                        )}
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
