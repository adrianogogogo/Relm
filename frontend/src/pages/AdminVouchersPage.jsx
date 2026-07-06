import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rewardsAPI } from '../services/api';
import { Card, PageHeader, Button } from '../components/ui';
import { MdReceipt, MdSearch, MdCheck, MdQrCodeScanner } from 'react-icons/md';

export default function AdminVouchersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch all vouchers
  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ['admin-vouchers'],
    queryFn: rewardsAPI.getAllVouchers,
  });

  // Use voucher mutation
  const useVoucherMutation = useMutation({
    mutationFn: rewardsAPI.useVoucher,
    onSuccess: (data) => {
      setSuccessMsg(`Voucher ${data.code} consumido com sucesso!`);
      setErrorMsg('');
      setVoucherCodeInput('');
      queryClient.invalidateQueries({ queryKey: ['admin-vouchers'] });
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Falha ao utilizar o voucher. Verifique se o código está correto, ativo ou se já expirou.');
      setSuccessMsg('');
    },
  });

  const handleUseVoucher = (e) => {
    e.preventDefault();
    if (!voucherCodeInput.trim()) {
      setErrorMsg('Por favor, informe o código do voucher.');
      return;
    }
    useVoucherMutation.mutate(voucherCodeInput.trim().toUpperCase());
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString('pt-BR');
  };

  // Filter vouchers
  const filteredVouchers = vouchers.filter((v) => {
    const codeMatch = v.code.toLowerCase().includes(searchTerm.toLowerCase());
    const customerMatch = v.customer?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const itemMatch = v.catalogItem?.title.toLowerCase().includes(searchTerm.toLowerCase());
    return codeMatch || customerMatch || itemMatch;
  });

  return (
    <div className="py-8 px-6">
      <div className="max-w-5xl mx-auto">
        <PageHeader
          title="Vouchers Resgatados"
          subtitle="Valide os vouchers apresentados pelos clientes e gerencie as trocas"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Quick Redeem Card */}
          <Card className="lg:col-span-1">
            <h3 className="font-title font-bold text-lg text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <MdQrCodeScanner className="text-purple-500" /> Consumir Voucher
            </h3>

            {successMsg && (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 p-3 rounded-lg text-xs mb-4">
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 p-3 rounded-lg text-xs mb-4">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleUseVoucher} className="space-y-4">
              <div>
                <label className="label">Código do Voucher *</label>
                <input
                  type="text"
                  placeholder="Ex: RLM-X89J2"
                  className="input font-mono font-bold tracking-widest text-center"
                  value={voucherCodeInput}
                  onChange={(e) => setVoucherCodeInput(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                loading={useVoucherMutation.isPending}
              >
                <MdCheck /> Confirmar Retirada
              </Button>
            </form>
          </Card>

          {/* Search & List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                  <MdSearch size={18} />
                </span>
                <input
                  type="text"
                  placeholder="Pesquisar por código, cliente ou prêmio..."
                  className="input pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-16">
                <span className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : filteredVouchers.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-gray-500">Nenhum voucher encontrado.</p>
              </Card>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-800 text-gray-500 dark:text-slate-400 font-semibold">
                      <th className="p-4">Código</th>
                      <th className="p-4">Cliente</th>
                      <th className="p-4">Prêmio</th>
                      <th className="p-4">Expira em</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-800 dark:text-slate-200">
                    {filteredVouchers.map((v) => {
                      const isUsed = v.status === 'USED';
                      const isExpired = new Date(v.expiresAt) < new Date() && !isUsed;
                      return (
                        <tr key={v.id} className="hover:bg-gray-50/30 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="p-4 font-mono font-bold tracking-wider text-purple-700 dark:text-purple-300">
                            {v.code}
                          </td>
                          <td className="p-4">{v.customer?.name}</td>
                          <td className="p-4">{v.catalogItem?.title}</td>
                          <td className="p-4">{formatDate(v.expiresAt)}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isUsed
                                ? 'bg-gray-250 text-gray-700 dark:bg-slate-800'
                                : isExpired
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}>
                              {isUsed ? 'Utilizado' : isExpired ? 'Expirado' : 'Disponível'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
