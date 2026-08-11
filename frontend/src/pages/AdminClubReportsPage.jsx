import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MdTrendingUp, MdGroup, MdStars, MdLoop, MdCancel, MdShare, MdInfoOutline,
} from 'react-icons/md';
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
  const [year, month] = ym.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
}

// "68%" -> "cerca de 7 em cada 10" — jeito humano de ler uma porcentagem.
function outOfTen(pct) {
  if (pct == null) return null;
  const n = Math.round(pct / 10);
  return `cerca de ${n} em cada 10`;
}

// ─── subcomponents ────────────────────────────────────────────────────────────

// Card de indicador: rótulo em linguagem simples, número grande, um detalhe
// secundário e uma frase curta explicando o que aquilo significa.
function StatCard({ label, value, sub, hint, icon: Icon, color = '#183757' }) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-start gap-4">
        <div
          className="flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center text-white text-xl"
          style={{ background: color }}
        >
          <Icon />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-[var(--color-text-secondary)] font-medium">{label}</p>
          <p className="text-2xl font-bold text-[var(--color-text)] leading-tight">{value}</p>
          {sub && <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{sub}</p>}
        </div>
      </div>
      {hint && (
        <p className="text-xs text-[var(--color-text-secondary)] leading-snug border-t border-[var(--color-border)] pt-2">
          {hint}
        </p>
      )}
    </div>
  );
}

function Section({ title, intro, children }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-[var(--color-text)]">{title}</h2>
      {intro && <p className="text-sm text-[var(--color-text-secondary)] mt-1 mb-4 max-w-2xl">{intro}</p>}
      {children}
    </section>
  );
}

function TableSkeleton({ rows = 4, cols = 3 }) {
  return (
    <div className="animate-pulse space-y-2 p-6">
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
    <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm mb-4">
      Erro ao carregar dados: {message}
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function AdminClubReportsPage() {
  const [months, setMonths] = useState(12);

  const { data: liability, isLoading: loadingLiability, error: errLiability } = useQuery({
    queryKey: ['club-points-liability'],
    queryFn: clubReportsAPI.getPointsLiability,
  });
  const { data: revenue, isLoading: loadingRevenue, error: errRevenue } = useQuery({
    queryKey: ['club-revenue', months],
    queryFn: () => clubReportsAPI.getRevenue(months),
  });
  const { data: funnel, isLoading: loadingFunnel, error: errFunnel } = useQuery({
    queryKey: ['club-funnel'],
    queryFn: clubReportsAPI.getFunnel,
  });

  const isLoading = loadingLiability || loadingRevenue || loadingFunnel;

  return (
    <div className="py-8 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">Relatórios do Clube</h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Um resumo simples de como está o clube de assinaturas Relm Care e Care Plus.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="period-select" className="text-sm font-medium text-[var(--color-text-secondary)]">Período:</label>
            <select
              id="period-select"
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="select select-bordered bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] text-sm rounded-lg focus:ring-primary focus:border-primary p-2 h-10 min-h-10 font-medium"
            >
              <option value={3}>Últimos 3 meses</option>
              <option value={6}>Últimos 6 meses</option>
              <option value={12}>Últimos 12 meses</option>
              <option value={24}>Últimos 24 meses</option>
            </select>
          </div>
        </div>

        {errLiability && <ErrorBanner message={errLiability.message} />}
        {errRevenue && <ErrorBanner message={errRevenue.message} />}
        {errFunnel && <ErrorBanner message={errFunnel.message} />}

        {/* ── Resumo em texto (linguagem humana) ── */}
        {!isLoading && revenue && (
          <div className="rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] p-5 mb-8 flex gap-3">
            <MdInfoOutline className="text-[var(--color-primary,#1565C0)] text-xl flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[var(--color-text)] leading-relaxed">
              Hoje o clube tem{' '}
              <strong>{fmtNum(revenue.activePlus)} assinantes pagantes (Plus)</strong> e{' '}
              <strong>{fmtNum(revenue.activeCare)} membros no plano gratuito (Care)</strong>.
              {' '}Nos últimos {months} meses entrou, em média,{' '}
              <strong>{fmtBrl(revenue.mrrEquivalent)} por mês</strong>.
              {revenue.renewalRate != null && (
                <>
                  {' '}Dos assinantes cujo plano venceu,{' '}
                  <strong>{outOfTen(revenue.renewalRate)}</strong> renovaram.
                </>
              )}
            </p>
          </div>
        )}

        {/* ── Indicadores principais ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Receita média por mês"
            value={isLoading ? '…' : fmtBrl(revenue?.mrrEquivalent)}
            sub={`Média dos últimos ${months} meses`}
            hint="Quanto o clube arrecada, em média, a cada mês com as assinaturas."
            icon={MdTrendingUp}
            color="#1565C0"
          />
          <StatCard
            label="Assinantes pagantes (Plus)"
            value={isLoading ? '…' : fmtNum(revenue?.activePlus)}
            sub={revenue ? `+ ${fmtNum(revenue.activeCare)} no plano gratuito (Care)` : undefined}
            hint="Pessoas que hoje pagam a assinatura Plus e têm o clube ativo."
            icon={MdGroup}
            color="#2E7D32"
          />
          <StatCard
            label="Prêmios a resgatar"
            value={isLoading ? '…' : fmtBrl(liability?.liabilityBrl)}
            sub={liability ? `${fmtNum(liability.totalActivePoints)} pontos acumulados` : undefined}
            hint="Valor em reais que os clientes ainda podem trocar pelos pontos que já juntaram."
            icon={MdStars}
            color="#183757"
          />
          <StatCard
            label="Renovaram a assinatura"
            value={isLoading ? '…' : fmtPct(revenue?.renewalRate)}
            sub={
              revenue
                ? `${fmtNum(revenue.renewedCount)} de ${fmtNum(revenue.expiredPlusPeriod)} que venceram`
                : undefined
            }
            hint="Entre os que chegaram ao fim do plano, quantos voltaram a pagar. Quanto maior, melhor."
            icon={MdLoop}
            color="#2E7D32"
          />
          <StatCard
            label="Não renovaram"
            value={isLoading ? '…' : fmtPct(revenue?.churnRate)}
            sub={revenue ? `${fmtNum(revenue.churnCount)} deixaram de pagar` : undefined}
            hint="Entre os que venceram, quantos não renovaram. É o oposto do indicador ao lado."
            icon={MdCancel}
            color="#C62828"
          />
          <StatCard
            label="Indicações que deram certo"
            value={isLoading ? '…' : fmtNum(funnel?.completedReferrals)}
            sub={funnel ? `de ${fmtNum(funnel.totalReferrals)} indicações feitas` : undefined}
            hint="Amigos indicados por clientes que acabaram virando membros do clube."
            icon={MdShare}
            color="#6A1B9A"
          />
        </div>

        {/* ── Receita mês a mês ── */}
        <Section
          title="Quanto entrou, mês a mês"
          intro={`Total pago pelos assinantes em cada um dos últimos ${months} meses (anuidades e upgrades para o Plus).`}
        >
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
            {loadingRevenue ? (
              <TableSkeleton rows={6} cols={3} />
            ) : errRevenue ? null : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
                    <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Mês</th>
                    <th className="text-right px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Nº de pagamentos</th>
                    <th className="text-right px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Valor recebido</th>
                  </tr>
                </thead>
                <tbody>
                  {(revenue?.monthlyRevenue ?? []).map((row, i) => (
                    <tr
                      key={row.month}
                      className={`border-b border-[var(--color-border)] last:border-0 ${i % 2 === 0 ? '' : 'bg-[var(--color-bg)]'}`}
                    >
                      <td className="px-4 py-3 text-[var(--color-text)] font-medium">{monthLabel(row.month)}</td>
                      <td className="px-4 py-3 text-right text-[var(--color-text)]">{fmtNum(row.paymentCount)}</td>
                      <td className="px-4 py-3 text-right text-[var(--color-text)] font-semibold">{fmtBrl(row.totalBrl)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[var(--color-bg)] border-t-2 border-[var(--color-border)]">
                    <td className="px-4 py-3 font-bold text-[var(--color-text)]">Total no período ({months} meses)</td>
                    <td className="px-4 py-3 text-right font-bold text-[var(--color-text)]">
                      {fmtNum(revenue?.monthlyRevenue?.reduce((s, m) => s + m.paymentCount, 0))}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[var(--color-text)]">
                      {fmtBrl(revenue?.totalRevenue)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </Section>

        {/* ── Origem dos membros ── */}
        <Section
          title="De onde vêm os membros"
          intro="Como cada membro chegou ao clube — se comprando uma bike, por indicação de um amigo ou por conta própria."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {loadingFunnel ? (
              <div className="col-span-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
                <TableSkeleton rows={4} cols={2} />
              </div>
            ) : errFunnel ? null : (
              <>
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
                        <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Como entrou</th>
                        <th className="text-right px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Membros</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: 'Ganhou o Plus ao comprar uma bike', value: funnel?.memberOrigins?.plusViaBikePurchase },
                        { label: 'Virou Plus por indicação', value: funnel?.memberOrigins?.plusViaReferral },
                        { label: 'Virou Care por indicação', value: funnel?.memberOrigins?.careViaReferral },
                        { label: 'Entrou no Care por conta própria', value: funnel?.memberOrigins?.careOrganic },
                      ].map((row, i) => (
                        <tr
                          key={row.label}
                          className={`border-b border-[var(--color-border)] last:border-0 ${i % 2 === 0 ? '' : 'bg-[var(--color-bg)]'}`}
                        >
                          <td className="px-4 py-3 text-[var(--color-text)]">{row.label}</td>
                          <td className="px-4 py-3 text-right font-semibold text-[var(--color-text)]">{fmtNum(row.value)}</td>
                        </tr>
                      ))}
                      <tr className="bg-[var(--color-bg)] border-t-2 border-[var(--color-border)]">
                        <td className="px-4 py-3 font-bold text-[var(--color-text)]">Total de membros</td>
                        <td className="px-4 py-3 text-right font-bold text-[var(--color-text)]">{fmtNum(funnel?.totalSubscriptions)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
                        <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Movimento no clube</th>
                        <th className="text-right px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Quantidade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: 'Pagamentos confirmados (entradas e renovações)', value: funnel?.upgradesAndRenewals },
                        { label: 'Indicações que viraram membro', value: funnel?.completedReferrals },
                        { label: 'Indicações ainda em aberto', value: funnel?.pendingReferrals },
                      ].map((row, i) => (
                        <tr
                          key={row.label}
                          className={`border-b border-[var(--color-border)] last:border-0 ${i % 2 === 0 ? '' : 'bg-[var(--color-bg)]'}`}
                        >
                          <td className="px-4 py-3 text-[var(--color-text)]">{row.label}</td>
                          <td className="px-4 py-3 text-right font-semibold text-[var(--color-text)]">{fmtNum(row.value)}</td>
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
        </Section>

        {/* ── Pontos acumulados ── */}
        <Section
          title="Pontos acumulados pelos clientes"
          intro="Os clientes juntam pontos e podem trocar por prêmios. Enquanto não trocam, esse valor fica reservado — é como um 'vale' que o clube ainda pode ter que honrar."
        >
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-sm overflow-hidden">
            {loadingLiability ? (
              <TableSkeleton rows={3} cols={2} />
            ) : errLiability ? null : (
              <table className="min-w-full text-sm">
                <tbody>
                  {[
                    { label: 'Total de pontos acumulados pelos clientes', value: fmtNum(liability?.totalActivePoints) },
                    { label: 'Quanto vale cada ponto', value: fmtBrl(liability?.pointValueBrl) },
                    { label: 'Valor total dos pontos a resgatar', value: fmtBrl(liability?.liabilityBrl), strong: true },
                    { label: 'Clientes que têm pontos', value: fmtNum(liability?.customersWithPoints) },
                    {
                      label: 'Números atualizados em',
                      value: liability?.computedAt ? new Date(liability.computedAt).toLocaleString('pt-BR') : '—',
                    },
                  ].map((row, i) => (
                    <tr
                      key={row.label}
                      className={`border-b border-[var(--color-border)] last:border-0 ${i % 2 === 0 ? '' : 'bg-[var(--color-bg)]'}`}
                    >
                      <td className="px-4 py-3 text-[var(--color-text-secondary)]">{row.label}</td>
                      <td className={`px-4 py-3 text-right font-semibold text-[var(--color-text)] ${row.strong ? 'text-base' : ''}`}>
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Section>

        {/* ── Auditoria e Controle de Resgates de Pontos ── */}
        <Section
          title="Auditoria e Controle de Resgates de Pontos"
          intro="Registro transparente dos resgates efetuados pelos clientes com o detalhamento exato dos pontos consumidos (Pontos Mensais vs. Pontos Acumulados de Compras)."
        >
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 shadow-sm space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)]">
                <span className="text-xs text-[var(--color-text-secondary)] font-medium block">Dedução Preferencial</span>
                <span className="text-sm font-bold text-amber-500 block mt-1">🟡 1º Pontos Mensais</span>
                <span className="text-[10px] text-[var(--color-text-secondary)] block mt-0.5">Expiram no fim do mês corrente</span>
              </div>
              <div className="p-4 bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)]">
                <span className="text-xs text-[var(--color-text-secondary)] font-medium block">Dedução Secundária</span>
                <span className="text-sm font-bold text-emerald-500 block mt-1">🟢 2º Pontos de Compras</span>
                <span className="text-[10px] text-[var(--color-text-secondary)] block mt-0.5">Validade de 12 meses (365 dias)</span>
              </div>
              <div className="p-4 bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)]">
                <span className="text-xs text-[var(--color-text-secondary)] font-medium block">Serviços Gratuítos do Plano</span>
                <span className="text-sm font-bold text-blue-500 block mt-1">🛠️ Cota Mensal (Sem Pts)</span>
                <span className="text-[10px] text-[var(--color-text-secondary)] block mt-0.5">Uso de serviço grátis não gera/gasta pontos</span>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
