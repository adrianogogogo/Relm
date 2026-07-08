import { useQuery } from '@tanstack/react-query';
import { MdTrendingUp, MdGroup, MdStars, MdLoop, MdBarChart, MdShare } from 'react-icons/md';
import { clubReportsAPI } from '../services/api';

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtBrl(value) {
  if (value == null) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function fmtPct(value) {
  if (value == null) return '—';
  return `${value}%`;
}

function fmtNum(value) {
  if (value == null) return '—';
  return new Intl.NumberFormat('pt-BR').format(value);
}

function monthLabel(ym) {
  // ym = 'YYYY-MM'
  const [year, month] = ym.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
}

// ─── subcomponents ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, color = '#183757' }) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 flex items-start gap-4 shadow-sm">
      <div
        className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-white text-2xl"
        style={{ background: color }}
      >
        <Icon />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[var(--color-text-secondary)] font-medium uppercase tracking-wide truncate">
          {label}
        </p>
        <p className="text-2xl font-bold text-[var(--color-text)] leading-tight">{value}</p>
        {sub && (
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{sub}</p>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 className="text-base font-semibold text-[var(--color-text)] mb-3 mt-8 flex items-center gap-2">
      {children}
    </h2>
  );
}

function TableSkeleton({ rows = 4, cols = 3 }) {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-4 bg-[var(--color-border)] rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

function ErrorBanner({ message }) {
  return (
    <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
      Erro ao carregar dados: {message}
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function AdminClubReportsPage() {
  const {
    data: liability,
    isLoading: loadingLiability,
    error: errLiability,
  } = useQuery({
    queryKey: ['club-points-liability'],
    queryFn: clubReportsAPI.getPointsLiability,
  });

  const {
    data: revenue,
    isLoading: loadingRevenue,
    error: errRevenue,
  } = useQuery({
    queryKey: ['club-revenue'],
    queryFn: clubReportsAPI.getRevenue,
  });

  const {
    data: funnel,
    isLoading: loadingFunnel,
    error: errFunnel,
  } = useQuery({
    queryKey: ['club-funnel'],
    queryFn: clubReportsAPI.getFunnel,
  });

  const isLoading = loadingLiability || loadingRevenue || loadingFunnel;

  return (
    <div className="py-8 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            Relatórios do Clube
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Indicadores financeiros e operacionais do clube de assinatura RELM Care/Plus.
          </p>
        </div>

        {/* ── Erros ── */}
        {errLiability && <ErrorBanner message={errLiability.message} />}
        {errRevenue && <ErrorBanner message={errRevenue.message} />}
        {errFunnel && <ErrorBanner message={errFunnel.message} />}

        {/* ── Stat cards principais ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Passivo de Pontos (R$)"
            value={isLoading ? '…' : fmtBrl(liability?.liabilityBrl)}
            sub={liability ? `${fmtNum(liability.totalActivePoints)} pts ativos` : undefined}
            icon={MdStars}
            color="#183757"
          />
          <StatCard
            label="MRR Equivalente"
            value={isLoading ? '…' : fmtBrl(revenue?.mrrEquivalent)}
            sub="Média mensal dos últimos 12 meses"
            icon={MdTrendingUp}
            color="#1565C0"
          />
          <StatCard
            label="Assinantes PLUS Ativos"
            value={isLoading ? '…' : fmtNum(revenue?.activePlus)}
            sub={revenue ? `${fmtNum(revenue.activeCare)} CARE ativos` : undefined}
            icon={MdGroup}
            color="#2E7D32"
          />
          <StatCard
            label="Taxa de Renovação"
            value={isLoading ? '…' : fmtPct(revenue?.renewalRate)}
            sub={
              revenue
                ? `${fmtNum(revenue.renewedCount)} de ${fmtNum(revenue.expiredPlusLast12mo)} expirados renovaram`
                : undefined
            }
            icon={MdLoop}
            color="#F57C00"
          />
          <StatCard
            label="Churn (PLUS)"
            value={isLoading ? '…' : fmtPct(revenue?.churnRate)}
            sub={revenue ? `${fmtNum(revenue.churnCount)} não renovaram` : undefined}
            icon={MdBarChart}
            color="#C62828"
          />
          <StatCard
            label="Indicações Concluídas"
            value={isLoading ? '…' : fmtNum(funnel?.completedReferrals)}
            sub={funnel ? `${fmtNum(funnel.totalReferrals)} total de indicações` : undefined}
            icon={MdShare}
            color="#6A1B9A"
          />
        </div>

        {/* ── Receita mensal ── */}
        <SectionTitle>Receita Mensal — Últimos 12 Meses</SectionTitle>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
          {loadingRevenue ? (
            <div className="p-6">
              <TableSkeleton rows={6} cols={3} />
            </div>
          ) : errRevenue ? null : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
                  <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">
                    Mês
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-[var(--color-text-secondary)]">
                    Pagamentos
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-[var(--color-text-secondary)]">
                    Total (R$)
                  </th>
                </tr>
              </thead>
              <tbody>
                {(revenue?.monthlyRevenue ?? []).map((row, i) => (
                  <tr
                    key={row.month}
                    className={`border-b border-[var(--color-border)] last:border-0 ${
                      i % 2 === 0 ? '' : 'bg-[var(--color-bg)]'
                    }`}
                  >
                    <td className="px-4 py-3 text-[var(--color-text)] font-medium">
                      {monthLabel(row.month)}
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--color-text)]">
                      {fmtNum(row.paymentCount)}
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--color-text)] font-semibold">
                      {fmtBrl(row.totalBrl)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[var(--color-bg)] border-t-2 border-[var(--color-border)]">
                  <td className="px-4 py-3 font-bold text-[var(--color-text)]">Total</td>
                  <td className="px-4 py-3 text-right font-bold text-[var(--color-text)]">
                    {fmtNum(revenue?.monthlyRevenue?.reduce((s, m) => s + m.paymentCount, 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-[var(--color-text)]">
                    {fmtBrl(revenue?.totalRevenueLast12mo)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* ── Funil de origens ── */}
        <SectionTitle>Origem dos Membros</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {loadingFunnel ? (
            <div className="col-span-2 p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
              <TableSkeleton rows={4} cols={2} />
            </div>
          ) : errFunnel ? null : (
            <>
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
                      <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">
                        Origem
                      </th>
                      <th className="text-right px-4 py-3 font-semibold text-[var(--color-text-secondary)]">
                        Membros
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        label: 'Compra de bike (PLUS)',
                        value: funnel?.memberOrigins?.plusViaBikePurchase,
                      },
                      {
                        label: 'Indicação → PLUS',
                        value: funnel?.memberOrigins?.plusViaReferral,
                      },
                      {
                        label: 'Indicação → CARE',
                        value: funnel?.memberOrigins?.careViaReferral,
                      },
                      {
                        label: 'Orgânico CARE',
                        value: funnel?.memberOrigins?.careOrganic,
                      },
                    ].map((row, i) => (
                      <tr
                        key={row.label}
                        className={`border-b border-[var(--color-border)] last:border-0 ${
                          i % 2 === 0 ? '' : 'bg-[var(--color-bg)]'
                        }`}
                      >
                        <td className="px-4 py-3 text-[var(--color-text)]">{row.label}</td>
                        <td className="px-4 py-3 text-right font-semibold text-[var(--color-text)]">
                          {fmtNum(row.value)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-[var(--color-bg)] border-t-2 border-[var(--color-border)]">
                      <td className="px-4 py-3 font-bold text-[var(--color-text)]">Total</td>
                      <td className="px-4 py-3 text-right font-bold text-[var(--color-text)]">
                        {fmtNum(funnel?.totalSubscriptions)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
                      <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">
                        Métrica de Conversão
                      </th>
                      <th className="text-right px-4 py-3 font-semibold text-[var(--color-text-secondary)]">
                        Qtd
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Upgrades / Renovações (pagamentos confirmados)', value: funnel?.upgradesAndRenewals },
                      { label: 'Indicações concluídas', value: funnel?.completedReferrals },
                      { label: 'Indicações pendentes', value: funnel?.pendingReferrals },
                    ].map((row, i) => (
                      <tr
                        key={row.label}
                        className={`border-b border-[var(--color-border)] last:border-0 ${
                          i % 2 === 0 ? '' : 'bg-[var(--color-bg)]'
                        }`}
                      >
                        <td className="px-4 py-3 text-[var(--color-text)]">{row.label}</td>
                        <td className="px-4 py-3 text-right font-semibold text-[var(--color-text)]">
                          {fmtNum(row.value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {funnel?.note && (
                  <p className="px-4 py-3 text-xs text-[var(--color-text-secondary)] border-t border-[var(--color-border)] italic">
                    {funnel.note}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Passivo de pontos — detalhe ── */}
        <SectionTitle>Passivo de Pontos — Detalhe</SectionTitle>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-sm overflow-hidden">
          {loadingLiability ? (
            <div className="p-6">
              <TableSkeleton rows={3} cols={2} />
            </div>
          ) : errLiability ? null : (
            <table className="min-w-full text-sm">
              <tbody>
                {[
                  { label: 'Pontos ativos totais', value: fmtNum(liability?.totalActivePoints) },
                  { label: 'Valor do ponto (R$)', value: fmtBrl(liability?.pointValueBrl) },
                  { label: 'Passivo total em BRL', value: fmtBrl(liability?.liabilityBrl) },
                  { label: 'Clientes com pontos', value: fmtNum(liability?.customersWithPoints) },
                  {
                    label: 'Calculado em',
                    value: liability?.computedAt
                      ? new Date(liability.computedAt).toLocaleString('pt-BR')
                      : '—',
                  },
                ].map((row, i) => (
                  <tr
                    key={row.label}
                    className={`border-b border-[var(--color-border)] last:border-0 ${
                      i % 2 === 0 ? '' : 'bg-[var(--color-bg)]'
                    }`}
                  >
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">{row.label}</td>
                    <td className="px-4 py-3 text-right font-semibold text-[var(--color-text)]">
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
