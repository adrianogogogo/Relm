import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { MdClose, MdSearch, MdPerson, MdCheck } from 'react-icons/md';
import { warrantyAPI, customersAPI } from '../services/api';

const EMPTY_FORM = {
  serialNumber: '',
  model: '',
  productType: '',
  brand: 'Relm Bikes',
  purchaseDate: '',
  invoiceNumber: '',
  purchaseStoreName: '',
  purchaseStoreCity: '',
  purchaseStoreState: '',
  customerNotes: '',
  adminNotes: '',
};

/**
 * Modal de cadastro de garantia pelo painel admin (ADMIN_RELM/GERENTE_RELM).
 * Seleciona um cliente EXISTENTE (busca com debounce em /customers?search=)
 * e cadastra a garantia via warrantyAPI.create.
 */
export default function WarrantyCreateModal({ onClose, onSuccess }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  // Seleção de cliente
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const debounceRef = useRef(null);

  // Busca de clientes com debounce.
  useEffect(() => {
    if (selectedCustomer) return; // já selecionado, não busca
    const term = customerQuery.trim();
    if (term.length < 2) {
      setCustomerResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await customersAPI.getAll({ search: term, limit: 10 });
        // Formato esperado { data, total }
        setCustomerResults(Array.isArray(res?.data) ? res.data : []);
      } catch {
        setCustomerResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [customerQuery, selectedCustomer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const selectCustomer = (c) => {
    setSelectedCustomer(c);
    setCustomerResults([]);
    setCustomerQuery('');
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
  };

  const createMutation = useMutation({
    mutationFn: (payload) => warrantyAPI.create(payload),
    onSuccess: (data) => {
      const protocolo = data?.protocol_number || data?.protocolNumber || '';
      alert(`✅ Garantia cadastrada — protocolo ${protocolo}`);
      onSuccess?.();
      onClose?.();
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message;
      setError(Array.isArray(msg) ? msg.join(' • ') : msg);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!selectedCustomer) {
      setError('Selecione um cliente para vincular a garantia.');
      return;
    }
    if (!form.serialNumber.trim() || !form.model.trim() || !form.productType.trim()) {
      setError('Preencha número de série, modelo e tipo do produto.');
      return;
    }
    if (!form.invoiceNumber.trim() || !form.purchaseStoreName.trim()) {
      setError('Preencha a nota fiscal e a loja de compra.');
      return;
    }

    const payload = {
      customerId: selectedCustomer.id,
      serialNumber: form.serialNumber.trim(),
      model: form.model.trim(),
      productType: form.productType.trim(),
      brand: form.brand.trim() || 'Relm Bikes',
      ...(form.purchaseDate && { purchaseDate: form.purchaseDate }),
      invoiceNumber: form.invoiceNumber.trim(),
      purchaseStoreName: form.purchaseStoreName.trim(),
      ...(form.purchaseStoreCity.trim() && { purchaseStoreCity: form.purchaseStoreCity.trim() }),
      ...(form.purchaseStoreState.trim() && { purchaseStoreState: form.purchaseStoreState.trim() }),
      ...(form.customerNotes.trim() && { customerNotes: form.customerNotes.trim() }),
      ...(form.adminNotes.trim() && { adminNotes: form.adminNotes.trim() }),
    };

    createMutation.mutate(payload);
  };

  const submitting = createMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-surface-dark rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-auth-gradient text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-title text-2xl font-bold">Nova Garantia</h2>
            <p className="text-white/80 text-sm">Cadastro vinculado a um cliente existente</p>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200 p-2" disabled={submitting}>
            <MdClose className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-error/10 border border-error/30 text-error rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Seleção de cliente */}
          <div className="bg-gray-50 dark:bg-slate-900/40 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <MdPerson size={18} className="text-gray-500 dark:text-slate-400" /> Cliente *
            </h3>

            {selectedCustomer ? (
              <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-800/60 border border-primary/30 rounded-lg px-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-slate-100 truncate flex items-center gap-1.5">
                    <MdCheck className="text-success shrink-0" /> {selectedCustomer.fullName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-slate-400 truncate">{selectedCustomer.email}</p>
                </div>
                <button
                  type="button"
                  onClick={clearCustomer}
                  className="text-sm font-semibold text-primary dark:text-primary-400 hover:underline shrink-0"
                >
                  Trocar
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={customerQuery}
                    onChange={(e) => setCustomerQuery(e.target.value)}
                    placeholder="Buscar por nome, email ou CPF (mín. 2 caracteres)..."
                    className="input pl-10"
                  />
                </div>
                {searching && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">Buscando...</p>
                )}
                {!searching && customerResults.length > 0 && (
                  <ul className="mt-2 max-h-52 overflow-y-auto border border-gray-200 dark:border-slate-700 rounded-lg divide-y divide-gray-100 dark:divide-slate-800">
                    {customerResults.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => selectCustomer(c)}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800/60"
                        >
                          <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{c.fullName}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">{c.email}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {!searching && customerQuery.trim().length >= 2 && customerResults.length === 0 && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">Nenhum cliente encontrado.</p>
                )}
              </div>
            )}
          </div>

          {/* Produto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="serialNumber" className="label">Número de Série *</label>
              <input id="serialNumber" name="serialNumber" value={form.serialNumber} onChange={handleChange} className="input" />
            </div>
            <div>
              <label htmlFor="model" className="label">Modelo *</label>
              <input id="model" name="model" value={form.model} onChange={handleChange} className="input" />
            </div>
            <div>
              <label htmlFor="productType" className="label">Tipo do Produto *</label>
              <input id="productType" name="productType" value={form.productType} onChange={handleChange} className="input" placeholder="Ex.: Bicicleta, Acessório..." />
            </div>
            <div>
              <label htmlFor="brand" className="label">Marca</label>
              <input id="brand" name="brand" value={form.brand} onChange={handleChange} className="input" />
            </div>
            <div>
              <label htmlFor="purchaseDate" className="label">Data da Compra</label>
              <input id="purchaseDate" name="purchaseDate" type="date" value={form.purchaseDate} onChange={handleChange} className="input" />
            </div>
          </div>

          {/* Nota fiscal / loja */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="invoiceNumber" className="label">Nota Fiscal *</label>
              <input id="invoiceNumber" name="invoiceNumber" value={form.invoiceNumber} onChange={handleChange} className="input" />
            </div>
            <div>
              <label htmlFor="purchaseStoreName" className="label">Loja de Compra *</label>
              <input id="purchaseStoreName" name="purchaseStoreName" value={form.purchaseStoreName} onChange={handleChange} className="input" />
            </div>
            <div>
              <label htmlFor="purchaseStoreCity" className="label">Cidade</label>
              <input id="purchaseStoreCity" name="purchaseStoreCity" value={form.purchaseStoreCity} onChange={handleChange} className="input" />
            </div>
            <div>
              <label htmlFor="purchaseStoreState" className="label">Estado</label>
              <input id="purchaseStoreState" name="purchaseStoreState" value={form.purchaseStoreState} onChange={handleChange} className="input" placeholder="UF" maxLength={100} />
            </div>
          </div>

          {/* Observações */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="customerNotes" className="label">Observações do Cliente</label>
              <textarea id="customerNotes" name="customerNotes" value={form.customerNotes} onChange={handleChange} rows={2} className="input" />
            </div>
            <div>
              <label htmlFor="adminNotes" className="label">Notas Internas</label>
              <textarea id="adminNotes" name="adminNotes" value={form.adminNotes} onChange={handleChange} rows={2} className="input" />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-primary hover:bg-primary-600 text-white dark:bg-primary-400 dark:hover:bg-primary-300 dark:text-app-dark rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {submitting && <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              Cadastrar Garantia
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
