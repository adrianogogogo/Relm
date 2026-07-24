import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rewardsAPI, customersAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Card, PageHeader, Button } from '../components/ui';
import { MdReceipt, MdSearch, MdCheck, MdQrCodeScanner, MdAdd } from 'react-icons/md';

export default function AdminVouchersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Estados para a criação manual de voucher
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState('');
  const [debitPoints, setDebitPoints] = useState(true);
  const [expirationDays, setExpirationDays] = useState(60);
  const [searching, setSearching] = useState(false);
  const [modalError, setModalError] = useState('');
  const debounceRef = useRef(null);

  const { user } = useAuthStore();
  const isAdminOrGerente = user?.role === 'ADMIN_RELM' || user?.role === 'GERENTE_RELM';

  // Catálogo de prêmios para o dropdown na modal
  const { data: catalog = [] } = useQuery({
    queryKey: ['admin-catalog-items'],
    queryFn: () => rewardsAPI.getCatalog(),
    enabled: isCreateModalOpen,
  });

  // Debounce busca de clientes
  useEffect(() => {
    if (selectedCustomer) return;
    const term = customerQuery.trim();
    if (term.length < 2) {
      setCustomerResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await customersAPI.getAll({ search: term, pageSize: 20 });
        setCustomerResults(Array.isArray(res?.data) ? res.data : []);
      } catch (err) {
        setCustomerResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [customerQuery, selectedCustomer]);

  const selectCustomer = (c) => {
    setSelectedCustomer(c);
    setCustomerResults([]);
    setCustomerQuery('');
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setSelectedCustomer(null);
    setSelectedCatalogItem('');
    setDebitPoints(true);
    setExpirationDays(60);
    setCustomerQuery('');
    setCustomerResults([]);
    setModalError('');
  };

  // Mutação para criar o voucher manualmente
  const createManualVoucherMutation = useMutation({
    mutationFn: rewardsAPI.createManualVoucher,
    onSuccess: (data) => {
      setSuccessMsg(`Voucher manual ${data.voucherCode} gerado com sucesso!`);
      setErrorMsg('');
      closeCreateModal();
      queryClient.invalidateQueries({ queryKey: ['admin-vouchers'] });
    },
    onError: (err) => {
      setModalError(err.response?.data?.message || 'Falha ao criar voucher manual.');
    },
  });

  const handleCreateManualVoucher = () => {
    if (!selectedCustomer || !selectedCatalogItem) return;
    createManualVoucherMutation.mutate({
      customerId: selectedCustomer.id,
      catalogItemId: selectedCatalogItem,
      debitPoints,
      expirationDays,
    });
  };

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
    const q = searchTerm.toLowerCase();
    const codeMatch = v.code?.toLowerCase().includes(q);
    const customerMatch = v.customer?.fullName?.toLowerCase().includes(q);
    const itemMatch = v.catalogItem?.title?.toLowerCase().includes(q);
    return codeMatch || customerMatch || itemMatch;
  });

  return (
    <div className="py-8 px-6">
      <div className="max-w-5xl mx-auto">
        <PageHeader
          title="Vouchers Resgatados"
          subtitle="Valide os vouchers apresentados pelos clientes e gerencie as trocas"
          action={
            isAdminOrGerente && (
              <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                <MdAdd className="mr-1" /> Criar Voucher
              </Button>
            )
          }
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
                          <td className="p-4">{v.customer?.fullName}</td>
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

      {/* Modal de Criação Manual de Voucher */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 shadow-xl border border-gray-100 dark:border-slate-800 flex flex-col gap-4 relative max-h-[90vh] overflow-y-auto">
            <h3 className="font-title font-bold text-lg text-gray-900 dark:text-slate-100">
              Criar Voucher Manual
            </h3>
            
            {modalError && (
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 p-3 rounded-lg text-xs">
                {modalError}
              </div>
            )}

            {/* Busca de Cliente */}
            <div className="space-y-1 relative">
              <label className="label">Cliente *</label>
              {selectedCustomer ? (
                <div className="flex items-center justify-between p-2.5 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <div>
                    <p className="font-bold text-sm text-purple-950 dark:text-purple-300">{selectedCustomer.fullName}</p>
                    <p className="text-xs text-purple-600 dark:text-purple-400">{selectedCustomer.email} • CPF: {selectedCustomer.cpf || 'Não cadastrado'}</p>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-rose-500 hover:text-rose-700 font-bold px-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    onClick={clearCustomer}
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    placeholder="Pesquisar por nome, email, CPF ou telefone..."
                    className="input text-sm"
                    value={customerQuery}
                    onChange={(e) => setCustomerQuery(e.target.value)}
                  />
                  {searching && (
                    <span className="absolute right-3 top-9 text-xs text-gray-400">Buscando...</span>
                  )}
                  
                  {customerResults.length > 0 && (
                    <ul className="absolute right-0 left-0 z-10 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-700">
                      {customerResults.map((c) => (
                        <li
                          key={c.id}
                          className="p-2.5 hover:bg-purple-50/50 dark:hover:bg-slate-700/50 cursor-pointer text-xs transition-colors"
                          onClick={() => selectCustomer(c)}
                        >
                          <p className="font-bold text-gray-800 dark:text-slate-200">{c.fullName}</p>
                          <p className="text-gray-500 dark:text-slate-400">{c.email} • CPF: {c.cpf || 'N/A'}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Seleção de Recompensa */}
            <div className="space-y-1">
              <label className="label">Recompensa do Catálogo *</label>
              <select
                className="input text-sm"
                value={selectedCatalogItem}
                onChange={(e) => setSelectedCatalogItem(e.target.value)}
              >
                <option value="">Selecione um prêmio...</option>
                {catalog.filter(item => item.active).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title} ({item.pointsCost} pts) - Estoque: {item.stock}
                  </option>
                ))}
              </select>
            </div>

            {/* Dias de Validade */}
            <div className="space-y-1">
              <label className="label">Validade *</label>
              <select
                className="input text-sm"
                value={expirationDays}
                onChange={(e) => setExpirationDays(Number(e.target.value))}
              >
                <option value={30}>30 Dias</option>
                <option value={60}>60 Dias (Padrão)</option>
                <option value={90}>90 Dias</option>
              </select>
            </div>

            {/* Debitar Pontos */}
            <div className="flex items-center gap-2 py-2">
              <input
                type="checkbox"
                id="debitPoints"
                className="h-4.5 w-4.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                checked={debitPoints}
                onChange={(e) => setDebitPoints(e.target.checked)}
              />
              <label htmlFor="debitPoints" className="text-sm font-semibold text-gray-700 dark:text-slate-300 cursor-pointer">
                Debitar pontos do saldo do cliente
              </label>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-3 mt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={closeCreateModal}
                disabled={createManualVoucherMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleCreateManualVoucher}
                loading={createManualVoucherMutation.isPending}
                disabled={!selectedCustomer || !selectedCatalogItem}
              >
                Criar Voucher
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
