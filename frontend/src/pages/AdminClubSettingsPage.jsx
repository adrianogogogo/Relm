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
    plusMonthlyPoints: 0,
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
        // ?? e não ||: zero é valor válido aqui (desliga o saldo mensal) e
        // seria engolido por um fallback truthy.
        plusMonthlyPoints: settings.plusMonthlyPoints ?? 0,
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

  return (
    <div className="py-8 px-6">
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title="Regras do Clube & Anuidade"
          subtitle="Configure o valor oficial da anuidade Care Plus, multiplicadores e parâmetros de gamificação."
        />

        {feedback && (
          <div
            className={`mb-6 rounded-xl p-4 text-sm font-semibold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
            }`}
          >
            {feedback.type === 'success' ? <MdCheckCircle size={20} /> : <MdWarning size={20} />}
            <span>{feedback.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção 1: Anuidade & Assinatura */}
          <Card>
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100 dark:border-slate-800">
              <div className="p-2.5 rounded-xl bg-[#0A1929] text-[#2196F3] shadow-[2px_2px_4px_#050c14]">
                <MdPayments size={22} />
              </div>
              <div>
                <h2 className="font-title font-bold text-lg text-[#0A1929] dark:text-slate-100">
                  Anuidade & Assinatura Care Plus
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Valor monetário padrão pré-preenchido nos registros de pagamento das lojas.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="label">Valor da Anuidade Care Plus (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="input font-mono font-bold text-lg text-[#0A1929] dark:text-white"
                  value={form.plusAnnualFee}
                  onChange={(e) => handleChange('plusAnnualFee', e.target.value)}
                  placeholder="299.00"
                />
                <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
                  Este valor será aplicado automaticamente em todas as cobranças de renovação anual.
                </p>
              </div>

              <div>
                <label className="label">Multiplicador de Pontos Care Plus *</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  required
                  className="input font-mono font-bold text-lg text-[#0A1929] dark:text-white"
                  value={form.plusPointsMultiplier}
                  onChange={(e) => handleChange('plusPointsMultiplier', e.target.value)}
                  placeholder="2.0"
                />
                <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
                  Fator de aceleração de acúmulo de pontos para membros Plus (ex: 2.0 = 2x pontos).
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="label">Pontos Mensais Care Plus (uso-ou-perde)</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  className="input font-mono font-bold text-lg text-[#0A1929] dark:text-white"
                  value={form.plusMonthlyPoints}
                  onChange={(e) => handleChange('plusMonthlyPoints', e.target.value)}
                  placeholder="0"
                />
                <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
                  Cota que renova todo mês e <strong>não acumula</strong>: o que não for usado
                  vira pó na virada do mês. Vale para qualquer resgate (prêmio ou serviço) e é
                  sempre gasta antes do saldo acumulado. <strong>Use 0 para desligar.</strong>
                </p>
                {/* O custo é o que decide esse número. Mostrar em reais evita
                    calibrar no escuro — 1000 pontos não significa nada sozinho. */}
                <p className="text-[11px] font-semibold text-[#2196F3] mt-1">
                  Custo estimado: R$ {(Number(form.plusMonthlyPoints || 0) * Number(form.pointValueBrl || 0)).toFixed(2)} por
                  membro Plus por mês
                  {' '}({(Number(form.plusMonthlyPoints || 0) * Number(form.pointValueBrl || 0) * 12).toFixed(2)} ao ano,
                  contra anuidade de R$ {Number(form.plusAnnualFee || 0).toFixed(2)}).
                </p>
              </div>
            </div>
          </Card>

          {/* Seção 2: Benefícios da Oficina & Vouchers */}
          <Card>
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100 dark:border-slate-800">
              <div className="p-2.5 rounded-xl bg-[#0A1929] text-[#2196F3] shadow-[2px_2px_4px_#050c14]">
                <MdBuild size={22} />
              </div>
              <div>
                <h2 className="font-title font-bold text-lg text-[#0A1929] dark:text-slate-100">
                  Oficina & Resgate de Prêmios
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Limites de serviços de manutenção e validade dos cupons resgatados.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="label">Cota Anual de Revisões Básicas (Care Gratuito) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="input font-mono font-bold text-[#0A1929] dark:text-white"
                  value={form.careQuotaAnnualRevisions}
                  onChange={(e) => handleChange('careQuotaAnnualRevisions', e.target.value)}
                />
                <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
                  Quantidade de revisões gratuitas liberadas por ano civil para o plano básico.
                </p>
              </div>

              <div>
                <label className="label">Validade dos Vouchers Resgatados (Dias) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="input font-mono font-bold text-[#0A1929] dark:text-white"
                  value={form.voucherValidityDays}
                  onChange={(e) => handleChange('voucherValidityDays', e.target.value)}
                />
                <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
                  Prazo máximo para o cliente apresentar o código do voucher na loja física.
                </p>
              </div>
            </div>
          </Card>

          {/* Seção 3: Pontuação & Bônus de Gamificação */}
          <Card>
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100 dark:border-slate-800">
              <div className="p-2.5 rounded-xl bg-[#0A1929] text-[#2196F3] shadow-[2px_2px_4px_#050c14]">
                <MdStars size={22} />
              </div>
              <div>
                <h2 className="font-title font-bold text-lg text-[#0A1929] dark:text-slate-100">
                  Gamificação & Bônus de Engajamento
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Pontos bonificados por indicações, aniversário e participação em eventos.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Bônus por Indicação (Pts)</label>
                <input
                  type="number"
                  min="0"
                  className="input font-mono text-[#0A1929] dark:text-white"
                  value={form.referralBonusPoints}
                  onChange={(e) => handleChange('referralBonusPoints', e.target.value)}
                />
              </div>

              <div>
                <label className="label">Bônus de Aniversário (Pts)</label>
                <input
                  type="number"
                  min="0"
                  className="input font-mono text-[#0A1929] dark:text-white"
                  value={form.birthdayBonusPoints}
                  onChange={(e) => handleChange('birthdayBonusPoints', e.target.value)}
                />
              </div>

              <div>
                <label className="label">Presença em Eventos (Pts)</label>
                <input
                  type="number"
                  min="0"
                  className="input font-mono text-[#0A1929] dark:text-white"
                  value={form.eventParticipationPoints}
                  onChange={(e) => handleChange('eventParticipationPoints', e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* Botão de Salvar */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={updateMutation.isPending}
              className="flex items-center gap-2 px-8 bg-[#2196F3] hover:bg-[#1e88e5] text-white font-bold"
            >
              <MdSave size={20} /> Salvar Regras do Clube
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
