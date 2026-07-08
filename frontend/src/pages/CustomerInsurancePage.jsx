import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MdVerifiedUser, MdAdd } from 'react-icons/md';
import { customerPortalAPI } from '../services/api';
import { Card, PageHeader, StatusChip, Button } from '../components/ui';

const STATUS_LABEL = {
  PENDING: 'Aguardando',
  ACTIVE: 'Ativa',
  CANCELLED: 'Cancelada',
  EXPIRED: 'Expirada',
};

const STATUS_VARIANT = {
  PENDING: 'warning',
  ACTIVE: 'success',
  CANCELLED: 'error',
  EXPIRED: 'neutral',
};

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('pt-BR') : '—');

export default function CustomerInsurancePage() {
  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ['customer-quotes'],
    queryFn: customerPortalAPI.getInsuranceQuotes,
  });

  const { data: policies = [] } = useQuery({
    queryKey: ['customer-policies'],
    queryFn: customerPortalAPI.getInsurancePolicies,
  });

  return (
    <div className="py-8 px-6">
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title="Cotações de Seguro"
          subtitle="Suas solicitações de seguro"
          action={
            <Link to="/seguro">
              <Button icon={MdAdd}>Nova cotação</Button>
            </Link>
          }
        />

        {policies.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 dark:text-slate-200 mb-3">Minhas apólices</h2>
            <div className="space-y-4">
              {policies.map((p) => (
                <Card key={p.id}>
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-800 dark:text-slate-200">{p.policyNumber}</p>
                      <p className="text-sm text-gray-500 dark:text-slate-400">{p.insurer}</p>
                    </div>
                    <div className="shrink-0">
                      <StatusChip
                        label={STATUS_LABEL[p.status] || p.status}
                        variant={STATUS_VARIANT[p.status] || 'neutral'}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 dark:text-slate-300">
                    <div>
                      <span className="text-xs text-gray-400 dark:text-slate-500 block">Vigência</span>
                      {formatDate(p.startsAt)} — {formatDate(p.expiresAt)}
                    </div>
                    {p.premium != null && (
                      <div>
                        <span className="text-xs text-gray-400 dark:text-slate-500 block">Prêmio</span>
                        R$ {Number(p.premium).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {policies.length > 0 && (
          <h2 className="text-lg font-bold text-gray-800 dark:text-slate-200 mb-3">Cotações</h2>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <span className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : quotes.length === 0 ? (
          <Card className="p-12 text-center flex flex-col items-center">
            <MdVerifiedUser className="h-12 w-12 text-gray-300 dark:text-slate-700 mb-4" />
            <p className="text-gray-500 dark:text-slate-400 mb-4">Você ainda não tem cotações de seguro.</p>
            <Link to="/seguro">
              <Button>Solicitar cotação</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {quotes.map((q) => (
              <Card key={q.id}>
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800 dark:text-slate-200">{q.protocolNumber}</p>
                    {q.product && (
                      <p className="text-sm text-gray-500 dark:text-slate-400">{q.product.model} — {q.product.serialNumber}</p>
                    )}
                  </div>
                  <div className="shrink-0">
                    <StatusChip
                      label={STATUS_LABEL[q.status] || q.status}
                      variant={STATUS_VARIANT[q.status] || 'neutral'}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 dark:text-slate-300">
                  {q.bikeValue && (
                    <div>
                      <span className="text-xs text-gray-400 dark:text-slate-500 block">Valor da bike</span>
                      R$ {Number(q.bikeValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  )}
                  {q.city && (
                    <div>
                      <span className="text-xs text-gray-400 dark:text-slate-500 block">Localização</span>
                      {q.city}/{q.state}
                    </div>
                  )}
                  {q.quoteValue && (
                    <div>
                      <span className="text-xs text-gray-400 dark:text-slate-500 block">Valor do seguro</span>
                      R$ {Number(q.quoteValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                    </div>
                  )}
                  {q.insuranceCompany && (
                    <div>
                      <span className="text-xs text-gray-400 dark:text-slate-500 block">Seguradora</span>
                      {q.insuranceCompany}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-3">
                  Solicitado em {new Date(q.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
