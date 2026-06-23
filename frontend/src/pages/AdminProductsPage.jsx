import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdAdd, MdEdit, MdDelete, MdClose } from 'react-icons/md';
import { productsAPI, storesAPI } from '../services/api';
import { PageHeader } from '../components/ui';

const EMPTY = { serialNumber: '', model: '', productType: '', brand: 'Relm Bikes', storeId: '' };

export default function AdminProductsPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null); // produto em edição (ou null = novo)
  const [form, setForm] = useState(EMPTY);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => productsAPI.getAll(),
  });
  const { data: stores = [] } = useQuery({
    queryKey: ['admin-stores-min'],
    queryFn: () => storesAPI.getAll(),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-products'] });

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editing
        ? productsAPI.update(editing.id, payload)
        : productsAPI.create(payload),
    onSuccess: () => {
      invalidate();
      closeModal();
    },
    onError: (e) => alert(`❌ ${e.response?.data?.message || e.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => productsAPI.remove(id),
    onSuccess: invalidate,
    onError: (e) => alert(`❌ ${e.response?.data?.message || e.message}`),
  });

  const openNew = () => { setEditing(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({
      serialNumber: p.serialNumber, model: p.model, productType: p.productType,
      brand: p.brand || 'Relm Bikes', storeId: p.storeId || '',
    });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditing(null); setForm(EMPTY); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.serialNumber.trim() || !form.model.trim() || !form.productType.trim()) {
      alert('Preencha série, modelo e tipo.');
      return;
    }
    const payload = editing
      ? { model: form.model, productType: form.productType, brand: form.brand, storeId: form.storeId || undefined }
      : { ...form, storeId: form.storeId || undefined };
    saveMutation.mutate(payload);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Produtos" subtitle="Catálogo usado no formulário de garantia." />
        <button onClick={openNew} className="btn btn-primary flex items-center gap-2">
          <MdAdd /> Novo produto
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-slate-800/50 text-left">
            <tr>
              <th className="px-4 py-3">Modelo</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Marca</th>
              <th className="px-4 py-3">Nº de Série</th>
              <th className="px-4 py-3">Loja</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Carregando…</td></tr>
            )}
            {!isLoading && products.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Nenhum produto cadastrado.</td></tr>
            )}
            {products.map((p) => (
              <tr key={p.id} className="border-t border-gray-100 dark:border-slate-800">
                <td className="px-4 py-3 font-medium">{p.model}</td>
                <td className="px-4 py-3">{p.productType}</td>
                <td className="px-4 py-3">{p.brand}</td>
                <td className="px-4 py-3 font-mono text-xs">{p.serialNumber}</td>
                <td className="px-4 py-3">{p.store?.tradeName || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(p)} className="text-gray-400 hover:text-primary" title="Editar"><MdEdit size={18} /></button>
                    <button
                      onClick={() => window.confirm(`Remover o produto "${p.model}"?`) && deleteMutation.mutate(p.id)}
                      disabled={deleteMutation.isPending}
                      className="text-gray-400 hover:text-error disabled:opacity-50" title="Remover"
                    ><MdDelete size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-surface-dark rounded-xl shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800">
              <h2 className="text-lg font-bold">{editing ? 'Editar produto' : 'Novo produto'}</h2>
              <button onClick={closeModal}><MdClose size={22} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Nº de Série *</label>
                <input
                  className="input" value={form.serialNumber}
                  readOnly={!!editing}
                  onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                />
                {editing && <p className="text-xs text-gray-400 mt-1">A série é imutável.</p>}
              </div>
              <div>
                <label className="label">Modelo *</label>
                <input className="input" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
              </div>
              <div>
                <label className="label">Tipo *</label>
                <input className="input" placeholder="Road, MTB, Gravel, E-bike, Acessórios" value={form.productType} onChange={(e) => setForm({ ...form, productType: e.target.value })} />
              </div>
              <div>
                <label className="label">Marca</label>
                <input className="input" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
              </div>
              <div>
                <label className="label">Loja (opcional)</label>
                <select className="input" value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value })}>
                  <option value="">—</option>
                  {stores.map((s) => <option key={s.id} value={s.id}>{s.tradeName}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="btn btn-outline flex-1">Cancelar</button>
                <button type="submit" disabled={saveMutation.isPending} className="btn btn-primary flex-1">
                  {saveMutation.isPending ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
