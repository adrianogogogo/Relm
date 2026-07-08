import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rewardsAPI } from '../services/api';
import { Card, PageHeader, Button } from '../components/ui';
import { MdStars, MdAdd, MdEdit, MdDelete, MdCheck, MdClose, MdTimer } from 'react-icons/md';

const TIER_OPTIONS = [
  { value: '', label: 'Sem restrição (todos)' },
  { value: 'CARE', label: 'CARE ou superior' },
  { value: 'PLUS', label: 'PLUS exclusivo' },
];

export default function AdminCatalogPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pointsCost, setPointsCost] = useState(50);
  const [stock, setStock] = useState(10);
  const [active, setActive] = useState(true);
  const [presaleUntil, setPresaleUntil] = useState('');
  const [presaleTier, setPresaleTier] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch catalog
  const { data: catalog = [], isLoading } = useQuery({
    queryKey: ['admin-catalog'],
    queryFn: rewardsAPI.getCatalog,
  });

  const toLocalDatetime = (iso) => (iso ? iso.slice(0, 16) : '');

  const openCreateModal = () => {
    setEditingItem(null);
    setTitle('');
    setDescription('');
    setPointsCost(50);
    setStock(10);
    setActive(true);
    setPresaleUntil('');
    setPresaleTier('');
    setErrorMsg('');
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setTitle(item.title);
    setDescription(item.description);
    setPointsCost(item.pointsCost);
    setStock(item.stock);
    setActive(item.active);
    setPresaleUntil(toLocalDatetime(item.presaleUntil));
    setPresaleTier(item.presaleTier ?? '');
    setErrorMsg('');
    setShowModal(true);
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: rewardsAPI.createCatalogItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-catalog'] });
      setShowModal(false);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Falha ao criar item.');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => rewardsAPI.updateCatalogItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-catalog'] });
      setShowModal(false);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Falha ao atualizar item.');
    },
  });

  // Seed mutation
  const seedMutation = useMutation({
    mutationFn: rewardsAPI.seedCatalog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-catalog'] });
    }
  });

  const handleInactivate = (id) => {
    if (confirm('Deseja inativar esta recompensa? Ela não aparecerá para resgate.')) {
      updateMutation.mutate({ id, data: { active: false } });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !description || pointsCost <= 0 || stock < 0) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios corretamente.');
      return;
    }

    const payload = {
      title,
      description,
      pointsCost: Number(pointsCost),
      stock: Number(stock),
      active,
      presaleUntil: presaleUntil ? new Date(presaleUntil).toISOString() : null,
      presaleTier: presaleTier || null,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="py-8 px-6">
      <div className="max-w-5xl mx-auto">
        <PageHeader
          title="Gerenciamento do Catálogo"
          subtitle="Cadastre novos prêmios, gerencie o custo em pontos e controle o estoque físico"
        />

        <div className="flex justify-between items-center mb-6">
          <Button variant="primary" onClick={openCreateModal} className="flex items-center gap-1.5">
            <MdAdd size={18} /> Novo Prêmio
          </Button>

          {catalog.length === 0 && (
            <Button
              variant="outline"
              onClick={() => seedMutation.mutate()}
              loading={seedMutation.isPending}
            >
              Popular Catálogo Padrão
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <span className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : catalog.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">Nenhum prêmio cadastrado. Clique em "Novo Prêmio" ou "Popular Catálogo Padrão" para começar.</p>
          </Card>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-800 text-gray-500 dark:text-slate-400 font-semibold">
                  <th className="p-4">Título</th>
                  <th className="p-4">Descrição</th>
                  <th className="p-4">Custo (Pontos)</th>
                  <th className="p-4">Estoque</th>
                  <th className="p-4">Pré-venda</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-800 dark:text-slate-200">
                {catalog.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/30 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 font-bold">{item.title}</td>
                    <td className="p-4 text-xs max-w-xs truncate">{item.description}</td>
                    <td className="p-4 font-semibold text-purple-600 dark:text-purple-400">
                      {item.pointsCost} pts
                    </td>
                    <td className="p-4">{item.stock} un</td>
                    <td className="p-4">
                      {item.presaleUntil && item.presaleTier && new Date(item.presaleUntil) > new Date() ? (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                          <MdTimer size={12} /> {item.presaleTier} até {new Date(item.presaleUntil).toLocaleDateString('pt-BR')}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.active ? 'bg-emerald-100 text-emerald-850 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-850 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {item.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditModal(item)}>
                          <MdEdit /> Editar
                        </Button>
                        {item.active && (
                          <Button size="sm" variant="outline" className="text-rose-500 border-rose-500 hover:bg-rose-500 hover:text-white" onClick={() => handleInactivate(item.id)}>
                            <MdDelete /> Inativar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-100 dark:border-slate-800 space-y-4">
              <h3 className="font-title font-bold text-lg text-gray-900 dark:text-slate-100">
                {editingItem ? 'Editar Prêmio' : 'Novo Prêmio'}
              </h3>

              {errorMsg && (
                <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 p-3 rounded-lg text-xs">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Título do Prêmio *</label>
                  <input
                    type="text"
                    className="input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Caramanhola Relm Pro"
                    required
                  />
                </div>

                <div>
                  <label className="label">Descrição *</label>
                  <textarea
                    className="input min-h-[80px]"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrição detalhada do prêmio..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Custo em Pontos *</label>
                    <input
                      type="number"
                      className="input"
                      value={pointsCost}
                      onChange={(e) => setPointsCost(e.target.value)}
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Estoque Físico *</label>
                    <input
                      type="number"
                      className="input"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      min="0"
                      required
                    />
                  </div>
                </div>

                {/* Pré-venda exclusiva */}
                <div className="border border-amber-200 dark:border-amber-800 rounded-lg p-3 space-y-3 bg-amber-50/50 dark:bg-amber-950/20">
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <MdTimer size={14} /> Pré-venda exclusiva (opcional)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Fim da pré-venda</label>
                      <input
                        type="datetime-local"
                        className="input"
                        value={presaleUntil}
                        onChange={(e) => setPresaleUntil(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label">Tier mínimo</label>
                      <select
                        className="input"
                        value={presaleTier}
                        onChange={(e) => setPresaleTier(e.target.value)}
                      >
                        {TIER_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-[10px] text-amber-700 dark:text-amber-400">
                    Enquanto a data não passar, somente o tier selecionado pode ver e resgatar este item.
                  </p>
                </div>

                <div className="flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    id="active"
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                  />
                  <label htmlFor="active" className="text-sm font-medium text-gray-700 dark:text-slate-300">
                    Disponibilizar para resgate (Item Ativo)
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
                    Cancelar
                  </Button>
                  <Button variant="primary" type="submit" className="flex-1" loading={createMutation.isPending || updateMutation.isPending}>
                    Salvar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
