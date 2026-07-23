import { useQuery } from '@tanstack/react-query';
import { MdShoppingBag } from 'react-icons/md';
import { customerPortalAPI } from '../services/api';
import { Card, PageHeader, StatusChip } from '../components/ui';

const DAY_MS = 24 * 60 * 60 * 1000;

// Formata uma quantidade de dias em pt-BR legível (anos / meses / dias).
function formatDuration(days) {
  if (days == null) return null;
  const d = Math.abs(days);
  if (d === 0) return 'hoje';
  const years = Math.floor(d / 365);
  const months = Math.floor((d % 365) / 30);
  const rest = d % 30;
  const parts = [];
  if (years) parts.push(`${years} ano${years > 1 ? 's' : ''}`);
  if (months) parts.push(`${months} ${months > 1 ? 'meses' : 'mês'}`);
  if (!years && rest) parts.push(`${rest} dia${rest > 1 ? 's' : ''}`);
  return parts.join(' e ') || `${d} dias`;
}

// Garantia de um item, derivada de warrantyEndsAt + saleDate.
function warrantyInfo(item, saleDate) {
  if (!item.warrantyEndsAt) return { hasWarranty: false };
  const end = new Date(item.warrantyEndsAt);
  const start = saleDate ? new Date(saleDate) : null;
  const now = Date.now();

  const totalDays = item.warrantyDays
    ?? (start ? Math.round((end.getTime() - start.getTime()) / DAY_MS) : null);
  const remainingDays = Math.round((end.getTime() - now) / DAY_MS);
  const expired = remainingDays < 0;
  const elapsed = start ? Math.max(0, now - start.getTime()) : 0;
  const totalMs = start ? end.getTime() - start.getTime() : 0;
  const percentUsed = totalMs > 0 ? Math.min(100, Math.max(0, (elapsed / totalMs) * 100)) : 0;

  return { hasWarranty: true, end, totalDays, remainingDays, expired, percentUsed };
}

export default function CustomerPurchasesPage() {
  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['customer-purchases'],
    queryFn: customerPortalAPI.getPurchases,
  });

  return (
    <div className="py-8 px-6">
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title="Minhas Compras"
          subtitle="Produtos adquiridos e o tempo de garantia restante de cada um"
        />

        {isLoading ? (
          <p className="text-gray-500 dark:text-slate-400">Carregando compras...</p>
        ) : sales.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center text-center py-8 gap-2">
              <MdShoppingBag size={40} className="text-gray-300 dark:text-slate-600" />
              <p className="text-gray-500 dark:text-slate-400">Nenhuma compra registrada ainda.</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {sales.map((sale) => (
              <Card key={sale.id}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-slate-100">
                      Compra de {new Date(sale.saleDate).toLocaleDateString('pt-BR')}
                    </p>
                    {sale.store?.tradeName && (
                      <p className="text-sm text-gray-500 dark:text-slate-400">{sale.store.tradeName}</p>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-slate-400">NF {sale.invoiceNumber || '—'}</p>
                </div>
                <div className="space-y-3">
                  {(sale.items || []).map((item) => {
                    const w = warrantyInfo(item, sale.saleDate);
                    let chipLabel = 'Sem garantia';
                    let variant = 'neutral';
                    if (w.hasWarranty) {
                      if (w.expired) {
                        chipLabel = `Vencida há ${formatDuration(w.remainingDays)}`;
                        variant = 'error';
                      } else if (w.remainingDays <= 30) {
                        chipLabel = `Vence em ${formatDuration(w.remainingDays)}`;
                        variant = 'warning';
                      } else {
                        chipLabel = `Faltam ${formatDuration(w.remainingDays)}`;
                        variant = 'success';
                      }
                    }
                    return (
                      <div
                        key={item.id}
                        className="border-t border-gray-100 dark:border-slate-800 pt-3 first:border-t-0 first:pt-0"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-slate-100">{item.commercialName}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">
                              Série: <span className="font-mono text-sm text-gray-600 dark:text-slate-400">{item.serialNumber || '—'}</span>
                              {' • '}Qtd: {item.quantity}
                            </p>
                          </div>
                          <StatusChip label={chipLabel} variant={variant} />
                        </div>
                        {w.hasWarranty && (
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500 dark:text-slate-400">
                              {w.totalDays != null && (
                                <span>Garantia: <span className="font-medium text-gray-700 dark:text-slate-300">{formatDuration(w.totalDays)}</span></span>
                              )}
                              <span>
                                {w.expired ? 'Venceu em ' : 'Vence em '}
                                <span className="font-medium text-gray-700 dark:text-slate-300">{w.end.toLocaleDateString('pt-BR')}</span>
                              </span>
                            </div>
                            <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${w.expired ? 'bg-red-500' : w.remainingDays <= 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.round(w.percentUsed)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
