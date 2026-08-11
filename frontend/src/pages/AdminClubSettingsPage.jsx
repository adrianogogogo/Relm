import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdSettings, MdPayments, MdStars, MdBuild, MdTimer, MdSave, MdCheckCircle, MdWarning } from 'react-icons/md';
import { clubSettingsAPI } from '../services/api';
import { Card, PageHeader, Button } from '../components/ui';

export default function AdminClubSettingsPage() {
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    plusAnnualFee: 299.00,
    plusPointsMultiplier: 2.0,
    plusMonthlyPoints: 200,
    careQuotaAnnualRevisions: 2,
    voucherValidityDays: 60,
    pointValueBrl: 0.05,
    referralBonusPoints: 500,
    birthdayBonusPoints: 200,
    eventParticipationPoints: 100,
  });

  const [feedback, setFeedback] = useState(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['club-settings-admin'],
    queryFn: clubSettingsAPI.get,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        plusAnnualFee: settings.plusAnnualFee ?? 299.00,
        plusPointsMultiplier: settings.plusPointsMultiplier ?? 2.0,
        plusMonthlyPoints: settings.plusMonthlyPoints ?? 200,
        careQuotaAnnualRevisions: settings.careQuotaAnnualRevisions ?? 2,
        voucherValidityDays: settings.voucherValidityDays ?? 60,
        pointValueBrl: settings.pointValueBrl ?? 0.05,
        referralBonusPoints: settings.referralBonusPoints ?? 500,
        birthdayBonusPoints: settings.birthdayBonusPoints ?? 200,
        eventParticipationPoints: settings.eventParticipationPoints ?? 100,
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: clubSettingsAPI.update,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['club-settings-admin'] });
      queryClient.invalidateQueries({ queryKey: ['payment-annual-fee'] });
      setFeedback({ type: 'success', text: 'Configurações do clube atualizadas com sucesso!' });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err) => {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Erro ao salvar as configurações.',
      });
    },
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFeedback(null);
    updateMutation.mutate({
      plusAnnualFee: Number(form.plusAnnualFee),
      plusPointsMultiplier: Number(form.plusPointsMultiplier),
      plusMonthlyPoints: Number(form.plusMonthlyPoints),
      careQuotaAnnualRevisions: Number(form.careQuotaAnnualRevisions),
      voucherValidityDays: Number(form.voucherValidityDays),
      pointValueBrl: Number(form.pointValueBrl),
      referralBonusPoints: Number(form.referralBonusPoints),
      birthdayBonusPoints: Number(form.birthdayBonusPoints),
      eventParticipationPoints: Number(form.eventParticipationPoints),
    });
  };

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center">
        <span className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const pointValue = Number(form.pointValueBrl) || 0.05;
  const voucherCostFor50 = Math.floor(50 / pointValue);
  const monthlyPts = Number(form.plusMonthlyPoints) || 0;
  const fromMonthlySim = Math.min(monthlyPts, voucherCostFor50);
  const fromAccumulatedSim = Math.max(0, voucherCostFor50 - fromMonthlySim);

  return (
    <div className="py-8 px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader
          title="Regras do Clube & Pontuação"
          subtitle="Painel intuitivo de configuração de pontos, benefícios e anuidade com simulador ao vivo."
        />

        {feedback && (
          <div
            className={`rounded-xl p-4 text-sm font-semibold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
            }`}
          >
            {feedback.type === 'success' ? <MdCheckCircle size={20} /> : <MdWarning size={20} />}
            <span>{feedback.text}</span>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form (2 Columns) */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
            {/* Bloco 1: Pontos de Compras nas Lojas */}
            <Card>
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100 dark:border-slate-800">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <MdStars size={24} />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-slate-100">
                    1. Pontos em Compras nas Lojas Credenciadas
                  </h2>
                  <p className="text-xs text-slate-400">
                    Define quanto o cliente pontua ao comprar produtos nas lojas parceiras.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Multiplicador de Pontos por Compra (Plus) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                    value={form.plusPointsMultiplier}
                    onChange={(e) => handleChange('plusPointsMultiplier', e.target.value)}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Ex: 2.0 significa que o membro Plus ganha 2x pontos em compras de produtos.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Valor Monetário de 1 Ponto (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                    value={form.pointValueBrl}
                    onChange={(e) => handleChange('pointValueBrl', e.target.value)}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Ex: R$ 0,05 significa que 1.000 pontos equivalem a R$ 50,00 em prêmios/vouchers.
                  </p>
                </div>
              </div>
            </Card>

            {/* Bloco 2: Pontos Mensais da Assinatura */}
            <Card>
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100 dark:border-slate-800">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                  <MdPayments size={24} />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-slate-100">
                    2. Pontos Mensais da Assinatura Plus
                  </h2>
                  <p className="text-xs text-slate-400">
                    Cota de pontos concedidos todo mês que expiram no fim do mês se não forem usados.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Valor da Anuidade Care Plus (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                    value={form.plusAnnualFee}
                    onChange={(e) => handleChange('plusAnnualFee', e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Pontos Mensais Renováveis (Membro Plus) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                    value={form.plusMonthlyPoints}
                    onChange={(e) => handleChange('plusMonthlyPoints', e.target.value)}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Cota mensal que vence na virada do mês.
                  </p>
                </div>
              </div>
            </Card>

            {/* Bloco 3: Gamificação & Validades */}
            <Card>
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100 dark:border-slate-800">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                  <MdTimer size={24} />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-slate-100">
                    3. Gamificação & Validade dos Vouchers
                  </h2>
                  <p className="text-xs text-slate-400">
                    Bônus por indicação/aniversário e prazo dos cupons resgatados.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Validade dos Vouchers (Dias) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                    value={form.voucherValidityDays}
                    onChange={(e) => handleChange('voucherValidityDays', e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Bônus por Indicação (Pts)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                    value={form.referralBonusPoints}
                    onChange={(e) => handleChange('referralBonusPoints', e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Bônus de Aniversário (Pts)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                    value={form.birthdayBonusPoints}
                    onChange={(e) => handleChange('birthdayBonusPoints', e.target.value)}
                  />
                </div>
              </div>
            </Card>

            <div className="pt-2">
              <Button type="submit" variant="primary" isLoading={updateMutation.isPending} className="w-full sm:w-auto py-3.5 px-8">
                <MdSave className="w-5 h-5 mr-2" />
                Salvar Regras de Pontuação
              </Button>
            </div>
          </form>

          {/* Live Simulator Widget (Right Column) */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl sticky top-6">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm border-b border-slate-800 pb-3">
                <MdStars className="w-5 h-5" />
                <span>⚡ Simulador em Tempo Real</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Veja instantaneamente como suas configurações vão funcionar na prática para os clientes e lojistas:
              </p>

              <div className="space-y-4 text-xs">
                <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1.5">
                  <span className="font-bold text-white block flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span> 🛒 Compra de Produto (R$ 100,00)
                  </span>
                  <p className="text-slate-300 leading-normal">
                    O cliente recebe <strong className="text-emerald-400 font-bold">{(100 * Number(form.plusPointsMultiplier || 1)).toFixed(0)} Pontos Acumulados</strong>.
                  </p>
                  <span className="text-[10px] text-slate-500 block">📅 Validade: 365 dias (12 meses a partir da compra).</span>
                </div>

                <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1.5">
                  <span className="font-bold text-white block flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span> 📅 Início do Mês (Plano Plus)
                  </span>
                  <p className="text-slate-300 leading-normal">
                    O cliente recebe <strong className="text-amber-400 font-bold">{monthlyPts} Pontos Mensais</strong>.
                  </p>
                  <span className="text-[10px] text-slate-500 block">⏳ Validade: Expiram no último dia do mês corrente.</span>
                </div>

                <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1.5">
                  <span className="font-bold text-white block flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span> 🎁 Resgate de Voucher de R$ 50,00
                  </span>
                  <p className="text-slate-300 leading-normal">
                    Custa <strong className="text-white font-bold">{voucherCostFor50} pontos</strong>.
                    O sistema abate primeiro <strong className="text-amber-400 font-bold">{fromMonthlySim} pts Mensais</strong> e a diferença (<strong className="text-emerald-400 font-bold">{fromAccumulatedSim} pts</strong>) dos Pontos Acumulados.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
