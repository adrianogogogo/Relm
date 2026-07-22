import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { MdSearch, MdAdd, MdDelete, MdCheckCircle, MdPersonAdd, MdClose } from 'react-icons/md';
import api, { salesAPI, customersAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Card, PageHeader, Button } from '../components/ui';

const WARRANTY_OPTIONS = [
  { value: '', label: 'Sem garantia' },
  { value: '60', label: '60 dias' },
  { value: '90', label: '90 dias' },
  { value: '180', label: '180 dias' },
  { value: '360', label: '360 dias' },
];

const emptyItem = () => ({
  commercialName: '',
  quantity: 1,
  serialNumber: '',
  unitPrice: '',
  warrantyDays: '',
});

const today = () => new Date().toISOString().slice(0, 10);

export default function StoreSalesPage() {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const paramCustomerId = searchParams.get('customerId');

  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Estado do Modal de Cadastro Rápido de Cliente
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickError, setQuickError] = useState('');
  const [quickForm, setQuickForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    cpf: '',
  });

  const [saleDate, setSaleDate] = useState(today());
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([emptyItem()]);
  const [invoiceFile, setInvoiceFile] = useState(null);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const debounceRef = useRef(null);

  // Carrega cliente automaticamente se vier na URL (?customerId=...)
  useEffect(() => {
    if (paramCustomerId && !selectedCustomer) {
      customersAPI.getOne(paramCustomerId)
        .then((data) => {
          if (data) setSelectedCustomer(data);
        })
        .catch((err) => console.error('Erro ao buscar cliente por ID:', err));
    }
  }, [paramCustomerId]);

  // Debounce busca de clientes — mesmo padrão usado em AdminVouchersPage.
  useEffect(() => {
    if (selectedCustomer) return undefined;
    const term = customerQuery.trim();
    if (term.length < 2) {
      setCustomerResults([]);
      return undefined;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await customersAPI.getAll({ search: term, pageSize: 20 });
        setCustomerResults(Array.isArray(res?.data) ? res.data : []);
      } catch {
        setCustomerResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [customerQuery, selectedCustomer]);

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerQuery('');
    setCustomerResults([]);
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerQuery('');
  };

  const handleQuickCustomerSubmit = async (e) => {
    e.preventDefault();
    setQuickError('');
    if (!quickForm.fullName || !quickForm.email || !quickForm.phone) {
      setQuickError('Nome, Email e Telefone são obrigatórios.');
      return;
    }
    try {
      setQuickLoading(true);
      const res = await api.post('/customers', {
        fullName: quickForm.fullName,
        email: quickForm.email,
        phone: quickForm.phone,
        ...(quickForm.cpf && { cpf: quickForm.cpf }),
        storeId: user?.storeId || undefined,
      });
      const newCustomer = res.data;
      selectCustomer(newCustomer);
      setShowQuickModal(false);
      setQuickForm({ fullName: '', email: '', phone: '', cpf: '' });
      setSuccessMsg(`Cliente "${newCustomer.fullName}" cadastrado e selecionado!`);
    } catch (err) {
      const msg = err.response?.data?.message;
      setQuickError(Array.isArray(msg) ? msg[0] : msg || 'Erro ao cadastrar cliente.');
    } finally {
      setQuickLoading(false);
    }
  };

  const updateItem = (index, field, value) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (index) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setCustomerQuery('');
    setSaleDate(today());
    setInvoiceNumber('');
    setNotes('');
    setItems([emptyItem()]);
    setInvoiceFile(null);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        customerId: selectedCustomer.id,
        saleDate,
        ...(invoiceNumber.trim() && { invoiceNumber: invoiceNumber.trim() }),
        ...(notes.trim() && { notes: notes.trim() }),
        items: items.map((item) => ({
          commercialName: item.commercialName.trim(),
          ...(item.quantity && { quantity: Number(item.quantity) }),
          ...(item.serialNumber.trim() && { serialNumber: item.serialNumber.trim() }),
          ...(item.unitPrice !== '' && { unitPrice: Number(item.unitPrice) }),
          ...(item.warrantyDays !== '' && { warrantyDays: Number(item.warrantyDays) }),
        })),
      };
      const sale = await salesAPI.create(payload);
      if (invoiceFile) {
        await salesAPI.uploadInvoice(sale.id, invoiceFile);
      }
      return sale;
    },
    onSuccess: (sale) => {
      setErrorMsg('');
      setSuccessMsg(`Venda registrada com ${sale.items?.length || items.length} item(ns).`);
      resetForm();
    },
    onError: (error) => {
      setSuccessMsg('');
      setErrorMsg(error.response?.data?.message || 'Erro ao registrar venda.');
    },
  });

  const hasEmptyCommercialName = items.some((it) => !it.commercialName.trim());
  const canSubmit = !!selectedCustomer && !hasEmptyCommercialName && !mutation.isPending;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    mutation.mutate();
  };

  return (
    <div className="py-8 px-6">
      <div className="max-w-4xl mx-auto">
        <PageHeader title="Cadastrar Venda" subtitle="Registre a venda e a vigência de garantia de cada item." />

        {successMsg && (
          <div className="mb-6 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 p-3 rounded-lg text-sm">
            <MdCheckCircle className="w-5 h-5 shrink-0" />
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mb-6 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 p-3 rounded-lg text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cliente */}
          <Card className="p-5 space-y-2 relative">
            <div className="flex items-center justify-between">
              <h2 className="font-title text-lg font-bold text-gray-900 dark:text-slate-100">Cliente</h2>
              <button
                type="button"
                onClick={() => setShowQuickModal(true)}
                className="btn bg-primary hover:bg-primary-600 text-white font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm"
              >
                <MdPersonAdd className="w-4 h-4" /> + Novo Cliente
              </button>
            </div>

            {selectedCustomer ? (
              <div className="flex items-center justify-between p-2.5 bg-primary/10 border border-primary/30 rounded-lg">
                <div>
                  <p className="font-bold text-sm text-gray-900 dark:text-slate-100">{selectedCustomer.fullName}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{selectedCustomer.email}</p>
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
              <div className="relative">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar cliente por nome, email, CPF ou telefone..."
                  className="input pl-10"
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                />
                {searching && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Buscando...</span>
                )}
                {customerResults.length > 0 && (
                  <ul className="absolute right-0 left-0 z-10 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-700">
                    {customerResults.map((c) => (
                      <li
                        key={c.id}
                        className="p-2.5 hover:bg-primary/5 cursor-pointer text-xs transition-colors"
                        onClick={() => selectCustomer(c)}
                      >
                        <p className="font-bold text-gray-800 dark:text-slate-200">{c.fullName}</p>
                        <p className="text-gray-500 dark:text-slate-400">{c.email}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </Card>

          {/* Venda */}
          <Card className="p-5 space-y-4">
            <h2 className="font-title text-lg font-bold text-gray-900 dark:text-slate-100">Venda</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Data da venda</label>
                <input
                  type="date"
                  className="input"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Nº da nota fiscal</label>
                <input
                  type="text"
                  className="input"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </div>
            <div>
              <label className="label">Observações</label>
              <textarea
                className="input"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Informações adicionais sobre a venda..."
              />
            </div>
          </Card>

          {/* Itens */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-title text-lg font-bold text-gray-900 dark:text-slate-100">Itens</h2>
              </div>
              <Button type="button" variant="outlined" icon={MdAdd} onClick={addItem}>
                Adicionar item
              </Button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
              💡 <strong>Produtos fora do catálogo:</strong> Você pode digitar livremente qualquer produto ou acessório no campo "Nome comercial".
            </p>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-slate-800 rounded-lg p-4 space-y-3"
                >
                  <div>
                    <label className="label">
                      Nome comercial <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={item.commercialName}
                      onChange={(e) => updateItem(index, 'commercialName', e.target.value)}
                      placeholder="Ex.: Bike Gravel X 2026 / Capacete Y tam. M"
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="label">Quantidade</label>
                      <input
                        type="number"
                        min="1"
                        className="input"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label">Série</label>
                      <input
                        type="text"
                        className="input"
                        value={item.serialNumber}
                        onChange={(e) => updateItem(index, 'serialNumber', e.target.value)}
                        placeholder="Opcional"
                      />
                    </div>
                    <div>
                      <label className="label">Valor unitário</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                        placeholder="Opcional"
                      />
                    </div>
                    <div>
                      <label className="label">Garantia</label>
                      <select
                        className="input"
                        value={item.warrantyDays}
                        onChange={(e) => updateItem(index, 'warrantyDays', e.target.value)}
                      >
                        {WARRANTY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={items.length === 1}
                      onClick={() => removeItem(index)}
                      className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <MdDelete className="w-4 h-4" /> Remover item
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Nota fiscal */}
          <Card className="p-5 space-y-2">
            <h2 className="font-title text-lg font-bold text-gray-900 dark:text-slate-100">Nota fiscal</h2>
            <input
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
              className="text-sm text-gray-600 dark:text-slate-400"
            />
            <p className="text-xs text-gray-400 dark:text-slate-500">
              Recomendado — será obrigatório em breve.
            </p>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={!canSubmit}>
              {mutation.isPending ? 'Registrando...' : 'Registrar Venda'}
            </Button>
          </div>
        </form>
      </div>

      {/* Modal de Cadastro Rápido de Cliente */}
      {showQuickModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-gray-100 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="font-title text-xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                <MdPersonAdd className="text-primary" /> Cadastrar Novo Cliente
              </h3>
              <button
                type="button"
                onClick={() => setShowQuickModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            {quickError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 rounded-lg text-xs font-semibold">
                {quickError}
              </div>
            )}

            <form onSubmit={handleQuickCustomerSubmit} className="space-y-4">
              <div>
                <label className="label">Nome Completo <span className="text-error">*</span></label>
                <input
                  type="text"
                  className="input"
                  required
                  placeholder="Ex: João da Silva"
                  value={quickForm.fullName}
                  onChange={(e) => setQuickForm({ ...quickForm, fullName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="label">E-mail <span className="text-error">*</span></label>
                  <input
                    type="email"
                    className="input"
                    required
                    placeholder="cliente@email.com"
                    value={quickForm.email}
                    onChange={(e) => setQuickForm({ ...quickForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Telefone <span className="text-error">*</span></label>
                  <input
                    type="text"
                    className="input"
                    required
                    placeholder="(11) 99999-9999"
                    value={quickForm.phone}
                    onChange={(e) => setQuickForm({ ...quickForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label">CPF (Opcional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="000.000.000-00"
                  value={quickForm.cpf}
                  onChange={(e) => setQuickForm({ ...quickForm, cpf: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowQuickModal(false)}
                  className="btn btn-outline text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={quickLoading}
                  className="btn btn-primary text-xs font-bold"
                >
                  {quickLoading ? 'Cadastrando...' : 'Salvar e Selecionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
