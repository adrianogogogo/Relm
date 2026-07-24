import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { rewardsAPI, customerPortalAPI } from '../services/api';
import { Card, PageHeader, Button } from '../components/ui';
import { MdCardGiftcard, MdStars, MdCheckCircle, MdOutlineHistory, MdLock, MdTimer } from 'react-icons/md';

function presaleDaysLeft(presaleUntil) {
  if (!presaleUntil) return null;
  const diff = new Date(presaleUntil) - new Date();
  if (diff <= 0) return null;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function CustomerCatalogPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isPlus = user?.currentTier === 'PLUS';

  const [selectedItem, setSelectedItem] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [generatedVoucher, setGeneratedVoucher] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch points balance
  const { data: pointsData } = useQuery({
    queryKey: ['customer-points', user?.id],
    queryFn: () => customerPortalAPI.getPointsBalance(),
    enabled: !!user?.id,
  });
  const balance = pointsData?.balance || 0;

  // Fetch rewards catalog — passa tier para filtrar pré-vendas server-side
  const { data: catalog = [], isLoading: loadingCatalog } = useQuery({
    queryKey: ['rewards-catalog', user?.currentTier],
    queryFn: () => rewardsAPI.getCatalog(user?.currentTier),
  });

  // Fetch my active vouchers
  const { data: vouchers = [], isLoading: loadingVouchers } = useQuery({
    queryKey: ['customer-vouchers', user?.id],
    queryFn: () => rewardsAPI.getVouchers(user?.id),
    enabled: !!user?.id,
  });

  // Redeem reward mutation
  const redeemMutation = useMutation({
    mutationFn: rewardsAPI.redeem,
    onSuccess: (data) => {
      setGeneratedVoucher(data);
      setShowConfirm(false);
      setErrorMsg('');
      queryClient.invalidateQueries({ queryKey: ['customer-points', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['customer-vouchers', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['rewards-catalog'] });
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Falha ao resgatar recompensa.');
      setShowConfirm(false);
    },
  });

  const handleRedeemRequest = (item) => {
    setErrorMsg('');
    if (balance < item.pointsCost) {
      setErrorMsg(`Saldo insuficiente. Você precisa de ${item.pointsCost} pontos, mas tem apenas ${balance}.`);
      return;
    }
    setSelectedItem(item);
    setShowConfirm(true);
  };

  const confirmRedeem = () => {
    if (!selectedItem) return;
    redeemMutation.mutate({
      customerId: user.id,
      catalogItemId: selectedItem.id,
    });
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="py-8 px-6">
      <div className="max-w-5xl mx-auto">
        <PageHeader
          title="Resgate de Prêmios"
          subtitle="Troque os seus pontos por equipamentos, acessórios ou vantagens exclusivas"
        />

        {/* Balance Card */}
        <div className="bg-[#0A1929] dark:bg-[#1c2128] border border-[#183757] rounded-2xl p-6 text-white mb-6 shadow-[6px_6px_14px_rgba(10,25,41,0.4)] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#2196F3]/20 rounded-full">
              <MdStars className="w-8 h-8 text-[#2196F3]" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-300 font-semibold">Meu Saldo Atual</p>
              <h2 className="text-3xl font-black font-title text-white">{balance} <span className="text-lg font-normal text-slate-300">pontos</span></h2>
            </div>
          </div>
          <div className="text-right text-xs opacity-90">
            <p className="font-bold text-white">{isPlus ? 'Acúmulo Turbo 2.0x Ativo ⚡' : 'Plano Gratuito: Acúmulo Padrão 1.0x'}</p>
            <p className="text-[10px] text-slate-300 mt-1">Pontos válidos por 365 dias a partir da transação.</p>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 px-4 py-3 rounded-lg text-sm mb-6">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Catalog Grid */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-title font-bold text-lg text-[#0A1929] dark:text-slate-100 mb-2 flex items-center gap-2">
              <MdCardGiftcard className="text-[#0A1929] dark:text-[#2196F3]" /> Vitrine de Recompensas
            </h3>

            {loadingCatalog ? (
              <div className="flex justify-center py-16">
                <span className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : catalog.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-500">Nenhuma recompensa cadastrada no momento.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {catalog.map((item) => {
                  const outOfStock = item.stock <= 0;
                  const canAfford = balance >= item.pointsCost;
                  const daysLeft = presaleDaysLeft(item.presaleUntil);
                  const inPresale = daysLeft !== null && item.presaleTier;
                  const isPresalePlus = inPresale && item.presaleTier === 'PLUS' && !isPlus;
                  return (
                    <Card key={item.id} className={`flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden ${isPresalePlus ? 'ring-1 ring-amber-400/60' : ''}`}>
                      {inPresale && (
                        <div className="bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 text-center">
                          {isPresalePlus
                            ? `Pré-venda exclusiva PLUS — ${daysLeft}d restantes`
                            : `Pré-venda — ${daysLeft}d restantes`}
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-title font-bold text-[#0A1929] dark:text-slate-100 text-base">{item.title}</h4>
                          <span className="px-2.5 py-1 bg-[#0A1929]/10 dark:bg-[#2196F3]/20 text-[#0A1929] dark:text-[#2196F3] rounded-full font-bold text-xs shrink-0 flex items-center gap-1">
                            <MdStars className="text-[#2196F3]" /> {item.pointsCost} pts
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-slate-400 line-clamp-2">{item.description}</p>
                      </div>

                      {/* CTA upgrade para CARE tentando resgatar pré-venda PLUS */}
                      {isPresalePlus && (
                        <div className="mt-3 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                          <MdLock size={14} className="shrink-0" />
                          <span>Disponível somente para membros <strong>PLUS</strong>. <a href="/cliente/assinatura" className="underline font-semibold">Seja Plus</a></span>
                        </div>
                      )}

                      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center gap-2">
                        <span className={`text-[10px] font-semibold ${outOfStock ? 'text-rose-500' : 'text-gray-500 dark:text-slate-400'}`}>
                          {outOfStock ? 'Esgotado' : `Estoque: ${item.stock} un`}
                        </span>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleRedeemRequest(item)}
                          disabled={outOfStock || !canAfford || isPresalePlus}
                        >
                          {isPresalePlus ? 'Bloqueado' : 'Resgatar'}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Vouchers & History */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="font-title font-bold text-lg text-[#0A1929] dark:text-slate-100 mb-2 flex items-center gap-2">
              <MdOutlineHistory className="text-[#0A1929] dark:text-[#2196F3]" /> Meus Vouchers
            </h3>

            {loadingVouchers ? (
              <div className="flex justify-center py-8">
                <span className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : vouchers.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-slate-400 text-center py-6">
                Você ainda não resgatou nenhum prêmio.
              </p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {vouchers.map((v) => {
                  const isUsed = v.status === 'USED';
                  const isExpired = new Date(v.expiresAt) < new Date() && !isUsed;
                  return (
                    <div
                      key={v.id}
                      className={`p-3 rounded-lg border text-xs space-y-2 relative overflow-hidden ${
                        isUsed
                          ? 'bg-gray-100 dark:bg-slate-900/20 border-gray-200 dark:border-slate-800/40 opacity-60'
                          : isExpired
                          ? 'bg-rose-50/50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-950/40 opacity-70'
                          : 'bg-white dark:bg-slate-900/40 border-[#183757]/30 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <span className="font-bold text-[#0A1929] dark:text-slate-200">
                          {v.catalogItem?.title}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          isUsed
                            ? 'bg-gray-200 text-gray-700'
                            : isExpired
                            ? 'bg-rose-200 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {isUsed ? 'Utilizado' : isExpired ? 'Expirado' : 'Disponível'}
                        </span>
                      </div>

                      {!isUsed && !isExpired && (
                        <div className="bg-[#0A1929]/10 dark:bg-[#2196F3]/20 border border-[#183757]/30 p-2 rounded text-center my-1 select-all font-mono font-bold text-sm tracking-wider text-[#0A1929] dark:text-[#2196F3]">
                          {v.code}
                        </div>
                      )}

                      <div className="flex justify-between text-[10px] text-gray-500 dark:text-slate-400">
                        <span>Resgatado: {formatDate(v.createdAt)}</span>
                        {!isUsed && <span>Validade: {formatDate(v.expiresAt)}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirm && selectedItem && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full p-6 shadow-xl border border-gray-100 dark:border-slate-800">
              <h3 className="font-title font-bold text-lg text-gray-900 dark:text-slate-100 mb-2">Confirmar Resgate</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                Você deseja confirmar o resgate de <strong>{selectedItem.title}</strong> por <strong>{selectedItem.pointsCost} pontos</strong>?
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" className="flex-1" onClick={confirmRedeem} loading={redeemMutation.isPending}>
                  Confirmar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {generatedVoucher && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full p-6 shadow-xl border border-gray-100 dark:border-slate-800 text-center space-y-4">
              <div className="flex justify-center text-emerald-500">
                <MdCheckCircle className="w-16 h-16" />
              </div>
              <h3 className="font-title font-bold text-xl text-gray-900 dark:text-slate-100">Resgate Concluído!</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Apresente o código abaixo na loja física para retirar a sua recompensa:
              </p>
              <div className="bg-[#0A1929]/10 dark:bg-[#2196F3]/20 border border-[#183757]/30 p-3 rounded font-mono font-black text-2xl tracking-wider text-[#0A1929] dark:text-[#2196F3] select-all">
                {generatedVoucher.voucherCode}
              </div>
              <p className="text-[10px] text-gray-500">
                Válido até {formatDate(generatedVoucher.expiresAt)} (60 dias)
              </p>
              <Button variant="primary" className="w-full" onClick={() => setGeneratedVoucher(null)}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
