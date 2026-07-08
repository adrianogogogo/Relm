import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partnersAPI } from '../services/api';
import { Card, PageHeader, Button } from '../components/ui';
import { MdAdd, MdEdit, MdDelete, MdStorefront } from 'react-icons/md';
import { useAuthStore } from '../store/authStore';

const CATEGORY_OPTIONS = [
  { value: 'CAFE',  label: 'Café' },
  { value: 'HOTEL', label: 'Hotel' },
  { value: 'PROVA', label: 'Prova / Evento esportivo' },
  { value: 'OUTRO', label: 'Outro' },
];

const TIER_OPTIONS = [
  { value: 'CARE', label: 'CARE (todos os membros)' },
  { value: 'PLUS', label: 'PLUS (exclusivo)' },
];

const EMPTY_FORM = {
  name: '',
  category: 'CAFE',
  description: '',
  benefit: '',
  minTier: 'CARE',
  city: '',
  link: '',
  logoUrl: '',
  active: true,
};

function PartnerModal({ partner, onClose }) {
  const queryClient = useQueryClient();
  const isEdit = !!partner?.id;
  const [form, setForm] = useState(isEdit ? {
    name: partner.name,
    category: partner.category,
    description: partner.description ?? '',
    benefit: partner.benefit,
    minTier: partner.minTier,
    city: partner.city ?? '',
    link: partner.link ?? '',
    logoUrl: partner.logoUrl ?? '',
    active: partner.active,
  } : { ...EMPTY_FORM });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit ? partnersAPI.update(partner.id, data) : partnersAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
      onClose();
    },
    onError: (err) => setError(err.response?.data?.message || 'Erro ao salvar parceiro.'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.benefit) {
      setError('Nome e benefício são obrigatórios.');
      return;
    }
    mutation.mutate({
      ...form,
      description: form.description || undefined,
      city: form.city || undefined,
      link: form.link || undefined,
      logoUrl: form.logoUrl || undefined,
    });
  };

  const field = (label, key, type = 'text', required = false) => (
    <div>
      <label className="label">{label}{required && ' *'}</label>
      <input
        type={type}
        className="input"
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        required={required}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 shadow-xl border border-gray-100 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
        <h3 className="font-title font-bold text-lg text-gray-900 dark:text-slate-100">
          {isEdit ? 'Editar Parceiro' : 'Novo Parceiro'}
        </h3>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 p-3 rounded-lg text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {field('Nome *', 'name', 'text', true)}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Categoria *</label>
              <select className="input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tier mínimo *</label>
              <select className="input" value={form.minTier} onChange={(e) => setForm((f) => ({ ...f, minTier: e.target.value }))}>
                {TIER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Benefício * <span className="text-xs font-normal text-gray-400">(a vantagem para o membro)</span></label>
            <input
              type="text"
              className="input"
              value={form.benefit}
              onChange={(e) => setForm((f) => ({ ...f, benefit: e.target.value }))}
              placeholder="Ex: 10% de desconto em todas as compras"
              required
            />
          </div>

          <div>
            <label className="label">Descrição <span className="text-xs font-normal text-gray-400">(opcional)</span></label>
            <textarea
              className="input min-h-[70px]"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Informações adicionais sobre o parceiro..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {field('Cidade', 'city')}
            {field('Link (URL)', 'link', 'url')}
          </div>

          {field('URL do Logo', 'logoUrl', 'url')}

          <div className="flex items-center gap-2 py-1">
            <input
              type="checkbox"
              id="partner-active"
              className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            <label htmlFor="partner-active" className="text-sm font-medium text-gray-700 dark:text-slate-300">
              Parceiro ativo (visível no portal do cliente)
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" type="button" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" type="submit" className="flex-1" loading={mutation.isPending}>Salvar</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminPartnersPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);

  const canWrite = ['ADMIN_RELM', 'GERENTE_RELM'].includes(user?.role);

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ['admin-partners'],
    queryFn: partnersAPI.getAll,
  });

  const inactivateMutation = useMutation({
    mutationFn: (id) => partnersAPI.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-partners'] }),
  });

  const openCreate = () => { setEditingPartner(null); setShowModal(true); };
  const openEdit = (p) => { setEditingPartner(p); setShowModal(true); };

  const CATEGORY_LABELS = { CAFE: 'Café', HOTEL: 'Hotel', PROVA: 'Prova', OUTRO: 'Outro' };
  const TIER_LABELS = { CARE: 'CARE', PLUS: 'PLUS' };

  return (
    <div className="py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Gerenciamento de Parcerias"
          subtitle="Cadastre cafés, hotéis, provas e outros parceiros com vantagens para os membros do clube"
        />

        {canWrite && (
          <div className="flex justify-end mb-6">
            <Button variant="primary" onClick={openCreate} className="flex items-center gap-1.5">
              <MdAdd size={18} /> Novo Parceiro
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <span className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : partners.length === 0 ? (
          <Card className="p-12 text-center">
            <MdStorefront size={40} className="text-gray-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum parceiro cadastrado. Clique em "Novo Parceiro" para começar.</p>
          </Card>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-800 text-gray-500 dark:text-slate-400 font-semibold">
                  <th className="p-4">Nome</th>
                  <th className="p-4">Categoria</th>
                  <th className="p-4">Benefício</th>
                  <th className="p-4">Tier mín.</th>
                  <th className="p-4">Cidade</th>
                  <th className="p-4">Status</th>
                  {canWrite && <th className="p-4 text-right">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-800 dark:text-slate-200">
                {partners.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/30 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 font-bold">{p.name}</td>
                    <td className="p-4 text-xs">{CATEGORY_LABELS[p.category] ?? p.category}</td>
                    <td className="p-4 text-xs max-w-xs truncate">{p.benefit}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.minTier === 'PLUS'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}>
                        {TIER_LABELS[p.minTier] ?? p.minTier}
                      </span>
                    </td>
                    <td className="p-4 text-xs">{p.city ?? '—'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.active
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {p.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    {canWrite && (
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                            <MdEdit /> Editar
                          </Button>
                          {p.active && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-rose-500 border-rose-500 hover:bg-rose-500 hover:text-white"
                              onClick={() => {
                                if (confirm('Deseja inativar este parceiro?')) {
                                  inactivateMutation.mutate(p.id);
                                }
                              }}
                            >
                              <MdDelete /> Inativar
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <PartnerModal partner={editingPartner} onClose={() => setShowModal(false)} />
        )}
      </div>
    </div>
  );
}
