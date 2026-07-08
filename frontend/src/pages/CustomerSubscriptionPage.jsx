import { useQuery } from '@tanstack/react-query';
import { MdWorkspacePremium, MdStore, MdInfo, MdPayments } from 'react-icons/md';
import { useAuthStore } from '../store/authStore';
import { paymentsAPI, customerPortalAPI } from '../services/api';
import { Card, PageHeader, StatusChip } from '../components/ui';

const PAYMENT_STATUS_LABEL = {
  PENDING: 'Aguardando confirmação',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
};
const PAYMENT_STATUS_VARIANT = {
  PENDING: 'warning',
  CONFIRMED: 'success',
  CANCELLED: 'neutral',
};

function formatBRL(value) {
  const n = Number(value);
  return `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

export default function CustomerSubscriptionPage() {
  const { user } = useAuthStore();
  const isPlus = user?.currentTier === 'PLUS';

  const { data: profile } = useQuery({
    queryKey: ['customer-profile-subscription'],
    queryFn: customerPortalAPI.getMe,
  });

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['customer-payments'],
    queryFn: paymentsAPI.getMy,
  });

  return (
    <div className="py-8 px-6">
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title="Minha Assinatura"
          subtitle="Acompanhe seu plano Relm Care, o vencimento e o histórico de pagamentos."
        />

        {/* Cartão do plano */}
        <Card className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: isPlus ? '#D4AF37' : '#1565C0' }}
              >
                <MdWorkspacePremium size={26} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400">Plano atual</p>
                <p className="font-title text-xl font-bold text-gray-900 dark:text-slate-100">
                  {isPlus ? 'Relm Care Plus' : 'Relm Care'}
                </p>
              </div>
            </div>
            <StatusChip
              label={isPlus ? 'Ativo' : 'Gratuito'}
              variant={isPlus ? 'success' : 'info'}
            />
          </div>

          {isPlus && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-slate-400">Membro desde</p>
                <p className="font-medium text-gray-800 dark:text-slate-200">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('pt-BR') : '—'}
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Instrução de renovação (sem checkout) */}
        <Card className="mb-6 border-l-4" style={{ borderLeftColor: '#D4AF37' }}>
          <div className="flex gap-3">
            <MdInfo className="w-6 h-6 text-amber-500 shrink-0" />
            <div>
              <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-1">Como renovar sua anuidade</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">
                A cobrança da anuidade Care Plus é feita presencialmente. Para renovar por mais 1 ano:
              </p>
              <ul className="text-sm text-gray-600 dark:text-slate-400 space-y-1 list-disc pl-5">
                <li className="flex items-center gap-2 -ml-5 list-none">
                  <MdStore className="w-4 h-4 text-primary" /> Procure uma loja parceira Relm e feche o pagamento no balcão.
                </li>
                <li className="flex items-center gap-2 -ml-5 list-none">
                  <MdPayments className="w-4 h-4 text-primary" /> Ou fale diretamente com a Relm para regularizar sua anuidade.
                </li>
              </ul>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-3">
                Assim que o pagamento for confirmado, sua assinatura é renovada e os pontos de bônus são creditados automaticamente.
              </p>
            </div>
          </div>
        </Card>

        {/* Histórico de pagamentos */}
        <Card className="p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
            <h2 className="font-title text-lg font-bold text-gray-900 dark:text-slate-100">
              Histórico de Pagamentos
            </h2>
          </div>
          {isLoading ? (
            <div className="text-center py-10 text-gray-500 dark:text-slate-400">Carregando...</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-10 text-gray-400 dark:text-slate-500 text-sm">
              Nenhum pagamento registrado ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/40 border-b border-gray-200 dark:border-slate-800">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Valor</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Pago em</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Registrado em</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 text-gray-700 dark:text-slate-300">{formatBRL(p.amount)}</td>
                      <td className="px-6 py-4">
                        <StatusChip
                          label={PAYMENT_STATUS_LABEL[p.status] || p.status}
                          variant={PAYMENT_STATUS_VARIANT[p.status] || 'neutral'}
                        />
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-slate-400 text-sm">
                        {p.paidAt ? new Date(p.paidAt).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-slate-400 text-sm">
                        {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
