import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { MdAdd, MdEdit, MdDelete, MdClose, MdUploadFile, MdDownload } from 'react-icons/md';
import { productsAPI } from '../services/api';
import { PageHeader } from '../components/ui';

// Normaliza cabeçalhos (minúsculo, sem acento) para casar colunas da planilha.
const norm = (s) => String(s).trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const cell = (row, key) => {
  for (const k of Object.keys(row)) if (norm(k) === key) return String(row[k] ?? '').trim();
  return '';
};

const EMPTY = { name: '', brand: 'Relm Bikes', sku: '', model: '', year: '', description: '' };
const OTHER = '__other__';

export default function AdminProductsPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [otherBrand, setOtherBrand] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => productsAPI.getAll(),
  });

  // Marcas para o dropdown: as já cadastradas + 'Relm Bikes', ordenadas.
  const brandOptions = Array.from(
    new Set(['Relm Bikes', ...products.map((p) => p.brand).filter(Boolean)]),
  ).sort();

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-products'] });

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editing ? productsAPI.update(editing.id, payload) : productsAPI.create(payload),
    onSuccess: () => { invalidate(); closeModal(); },
    onError: (e) => alert(`❌ ${e.response?.data?.message || e.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => productsAPI.remove(id),
    onSuccess: invalidate,
    onError: (e) => alert(`❌ ${e.response?.data?.message || e.message}`),
  });

  const importMutation = useMutation({
    mutationFn: (rows) => productsAPI.bulkCreate(rows),
    onSuccess: (res) => { invalidate(); alert(`✅ ${res.created} produto(s) importado(s).`); },
    onError: (e) => alert(`❌ ${e.response?.data?.message || e.message}`),
  });

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite reimportar o mesmo arquivo
    if (!file) return;
    try {
      const wb = XLSX.read(await file.arrayBuffer());
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      const rows = json
        .map((r) => {
          const y = Number(cell(r, 'ano'));
          return {
            name: cell(r, 'nome'),
            brand: cell(r, 'marca') || undefined,
            sku: cell(r, 'sku') || undefined,
            model: cell(r, 'modelo') || undefined,
            year: Number.isInteger(y) && y > 0 ? y : undefined,
            description: cell(r, 'descricao') || undefined,
          };
        })
        .filter((r) => r.name);
      if (rows.length === 0) {
        alert('Nenhuma linha com "Nome" encontrada. Use os cabeçalhos do modelo.');
        return;
      }
      if (!window.confirm(`Importar ${rows.length} produto(s)?`)) return;
      importMutation.mutate(rows);
    } catch {
      alert('Não foi possível ler a planilha. Use .xlsx ou .csv com os cabeçalhos do modelo.');
    }
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([['Nome', 'Marca', 'SKU', 'Modelo', 'Ano', 'Descrição']]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Produtos');
    XLSX.writeFile(wb, 'modelo-produtos.xlsx');
  };

  const openNew = () => { setEditing(null); setForm(EMPTY); setOtherBrand(false); setShowModal(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name || '', brand: p.brand || 'Relm Bikes', sku: p.sku || '',
      model: p.model || '', year: p.year ? String(p.year) : '', description: p.description || '',
    });
    setOtherBrand(!!p.brand && !brandOptions.includes(p.brand));
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditing(null); setForm(EMPTY); setOtherBrand(false); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { alert('Informe o nome do produto.'); return; }
    saveMutation.mutate({
      name: form.name.trim(),
      brand: form.brand.trim() || undefined,
      sku: form.sku.trim() || undefined,
      model: form.model.trim() || undefined,
      year: form.year ? Number(form.year) : undefined,
      description: form.description.trim() || undefined,
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Produtos" subtitle="Catálogo usado no formulário de garantia." />
        <div className="flex items-center gap-2">
          <button onClick={handleDownloadTemplate} className="btn btn-outline flex items-center gap-2" title="Baixar planilha modelo">
            <MdDownload /> Modelo
          </button>
          <label className="btn btn-outline flex items-center gap-2 cursor-pointer">
            <MdUploadFile /> {importMutation.isPending ? 'Importando…' : 'Importar planilha'}
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} disabled={importMutation.isPending} />
          </label>
          <button onClick={openNew} className="btn btn-primary flex items-center gap-2">
            <MdAdd /> Novo produto
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-slate-800/50 text-left">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Marca</th>
              <th className="px-4 py-3">Modelo</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Ano</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Carregando…</td></tr>}
            {!isLoading && products.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Nenhum produto cadastrado.</td></tr>
            )}
            {products.map((p) => (
              <tr key={p.id} className="border-t border-gray-100 dark:border-slate-800">
                <td className="px-4 py-3 font-medium">{p.name || p.model || '—'}</td>
                <td className="px-4 py-3">{p.brand}</td>
                <td className="px-4 py-3">{p.model || '—'}</td>
                <td className="px-4 py-3 font-mono text-xs">{p.sku || '—'}</td>
                <td className="px-4 py-3">{p.year || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(p)} className="text-gray-400 hover:text-primary" title="Editar"><MdEdit size={18} /></button>
                    <button
                      onClick={() => window.confirm(`Remover "${p.name || p.model}"?`) && deleteMutation.mutate(p.id)}
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
              <h2 className="text-lg font-bold">{editing ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button onClick={closeModal}><MdClose size={22} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <input
                  className="input" placeholder="Nome *" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <select
                  className="input"
                  value={otherBrand ? OTHER : form.brand}
                  onChange={(e) => {
                    if (e.target.value === OTHER) { setOtherBrand(true); setForm({ ...form, brand: '' }); }
                    else { setOtherBrand(false); setForm({ ...form, brand: e.target.value }); }
                  }}
                >
                  {!form.brand && !otherBrand && <option value="">Marca</option>}
                  {brandOptions.map((b) => <option key={b} value={b}>{b}</option>)}
                  <option value={OTHER}>Outra marca…</option>
                </select>
                {otherBrand && (
                  <input
                    className="input mt-2" placeholder="Nome da marca"
                    value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input className="input" placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                <input className="input" placeholder="Modelo" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input className="input" type="number" placeholder="Ano" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
              </div>
              <div>
                <textarea className="input" rows={3} placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="text-primary font-semibold px-4">Cancelar</button>
                <button type="submit" disabled={saveMutation.isPending} className="btn btn-primary">
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
