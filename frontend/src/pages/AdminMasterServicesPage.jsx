import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { masterServicesAPI } from '../services/api';
import { Card, PageHeader, Button } from '../components/ui';
import ConvenienceDetailModal from '../components/ConvenienceDetailModal';
import {
  MdAdd, MdEdit, MdDelete, MdBuild, MdAccessTime, MdCategory, MdInfoOutline,
  MdChecklist, MdWaterDrop, MdDonutLarge, MdCompress, MdAccessibilityNew, MdElectricBike, MdShower,
} from 'react-icons/md';

const CATEGORY_OPTIONS = [
  'Revisões Periódicas',
  'Freios & Hidráulica',
  'Rodas & Tubeless',
  'Suspensão & Amortecedores',
  'Ergonomia & Biomecânica',
  'Logística & E-Bikes',
  'Conveniências & Hub do Ciclista',
  'Outro',
];

// Ícone distinto por categoria (fallback MdBuild para categorias não mapeadas)
const CATEGORY_ICONS = {
  'Revisões Periódicas': MdChecklist,
  'Freios & Hidráulica': MdWaterDrop,
  'Rodas & Tubeless': MdDonutLarge,
  'Suspensão & Amortecedores': MdCompress,
  'Ergonomia & Biomecânica': MdAccessibilityNew,
  'Logística & E-Bikes': MdElectricBike,
  'Conveniências & Hub do Ciclista': MdShower,
};
const categoryIcon = (category) => CATEGORY_ICONS[category] || MdBuild;

const EMPTY_FORM = {
  name: '',
  description: '',
  category: 'Revisões Periódicas',
  defaultEstimatedMinutes: 60,
  defaultPrice: 50,
  defaultPointsCost: '',
  defaultPlusRule: 'FREE',
  active: true,
};

function MasterServiceModal({ service, onClose }) {
  const queryClient = useQueryClient();
  const isEdit = !!service?.id;
  const [form, setForm] = useState(
    isEdit
      ? {
          name: service.name,
          description: service.description || '',
          category: service.category || 'Revisões Periódicas',
          defaultEstimatedMinutes: service.defaultEstimatedMinutes || 60,
          defaultPrice: service.defaultPrice != null ? service.defaultPrice : 50,
          defaultPointsCost: service.defaultPointsCost != null ? String(service.defaultPointsCost) : '',
          defaultPlusRule: service.defaultPlusRule || 'FREE',
          active: service.active,
        }
      : { ...EMPTY_FORM }
  );
  const [isCustomPoints, setIsCustomPoints] = useState(false);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit ? masterServicesAPI.update(service.id, data) : masterServicesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-master-services'] });
      onClose();
    },
    onError: (err) =>
      setError(err.response?.data?.message || 'Erro ao salvar serviço no catálogo.'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('O nome do serviço é obrigatório.');
      return;
    }

    const calculatedPointsCost = !isCustomPoints
      ? Math.floor((Number(form.defaultPrice) || 0) / 0.05)
      : form.defaultPointsCost.trim() === '' ? null : Number(form.defaultPointsCost);

    mutation.mutate({
      ...form,
      defaultEstimatedMinutes: Number(form.defaultEstimatedMinutes) || 60,
      defaultPrice: Number(form.defaultPrice) || 0,
      defaultPointsCost: calculatedPointsCost,
    });
  };

  const currentPrice = Number(form.defaultPrice) || 0;
  const autoPointsCost = Math.floor(currentPrice / 0.05);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800 max-h-[90vh] overflow-y-auto">
        <h3 className="mb-4 text-xl font-bold text-slate-800 dark:text-white">
          {isEdit ? 'Editar Serviço Mestre' : 'Novo Serviço no Catálogo'}
        </h3>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Nome do Serviço *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Revisão Completa"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-sm focus:border-cyan-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Categoria
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-sm focus:border-cyan-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Tempo Estimado (min)
              </label>
              <input
                type="number"
                min="15"
                step="15"
                value={form.defaultEstimatedMinutes}
                onChange={(e) =>
                  setForm({ ...form, defaultEstimatedMinutes: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-sm focus:border-cyan-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
          </div>

          {/* Preço Padrão e Pontuação em Tempo Real */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Preço Sugerido (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={form.defaultPrice}
                onChange={(e) => setForm({ ...form, defaultPrice: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-sm font-bold focus:border-cyan-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Regra Benefício Relm Plus
              </label>
              <select
                value={form.defaultPlusRule}
                onChange={(e) => setForm({ ...form, defaultPlusRule: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-sm focus:border-cyan-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              >
                <option value="FREE">Gratuito (100% Coberto pelo Plus)</option>
                <option value="DISCOUNT_PERCENT">Desconto % no Plus</option>
                <option value="FIXED_PRICE">Preço Especial no Plus</option>
              </select>
            </div>
          </div>

          {/* Card Atribuição de Pontos em Tempo Real */}
          <div className="space-y-2">
            {!isCustomPoints ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    💡 Atribuição Automática de Pontos Relm Care+
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCustomPoints(true)}
                    className="text-[11px] font-bold text-slate-300 underline hover:text-white"
                  >
                    ✏️ Personalizar Pontos
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-300 pt-1">
                  <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">🎯 Pontos para trocar de graça:</span>
                    <strong className="text-emerald-400 text-sm">{autoPointsCost} Pts</strong>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">🛍️ Pontos de presente na compra:</span>
                    <strong className="text-blue-400 text-sm">+{Math.floor(currentPrice)} Pts</strong>
                    <span className="text-[9px] text-slate-400 block">({Math.floor(currentPrice * 2)} Pts no Plus ⚡)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white">Personalização Manual de Pontos:</label>
                  <button
                    type="button"
                    onClick={() => setIsCustomPoints(false)}
                    className="text-[11px] text-emerald-400 font-bold underline"
                  >
                    ⚡ Voltar ao Automático
                  </button>
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    🎯 Pontos para trocar de graça (Resgate pelo cliente)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    placeholder="Ex: 1000"
                    value={form.defaultPointsCost}
                    onChange={(e) => setForm({ ...form, defaultPointsCost: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Descrição Padrão dos Itens Inclusos
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Descreva o que está incluso por padrão neste serviço..."
              className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-sm focus:border-cyan-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="active"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
            />
            <label htmlFor="active" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Serviço Ativo no Catálogo Geral
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : isEdit ? 'Atualizar' : 'Criar Serviço'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminMasterServicesPage() {
  const queryClient = useQueryClient();
  const [selectedService, setSelectedService] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODAS');
  const [selectedConvenienceDetail, setSelectedConvenienceDetail] = useState(null);

  const { data: masterServices = [], isLoading } = useQuery({
    queryKey: ['admin-master-services'],
    queryFn: () => masterServicesAPI.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => masterServicesAPI.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-master-services'] }),
  });

  const categories = ['TODAS', ...CATEGORY_OPTIONS];

  const filteredServices = masterServices.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.category && s.category.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'TODAS' || s.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catálogo Mestre de Serviços"
        subtitle="Gerencie os modelos de serviços padrões oferecidos pela rede de lojas Relm."
        action={
          <Button
            onClick={() => {
              setSelectedService(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <MdAdd className="h-5 w-5" /> Novo Serviço Mestre
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Buscar por nome, palavra-chave ou descrição..."
            className="w-full max-w-md rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-sm focus:border-cyan-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Exibindo <span className="text-cyan-600 dark:text-cyan-400 font-bold">{filteredServices.length}</span> de {masterServices.length} serviços
          </span>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2">
          {categories.map((cat) => {
            const count =
              cat === 'TODAS'
                ? masterServices.length
                : masterServices.filter((s) => s.category === cat).length;
            const isSelected = selectedCategory === cat;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                <span>{cat === 'TODAS' ? 'Todas as Categorias' : cat}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500">Carregando catálogo...</div>
      ) : filteredServices.length === 0 ? (
        <Card className="py-12 text-center text-slate-500">
          Nenhum serviço mestre encontrado no catálogo.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service) => {
            const CategoryIcon = categoryIcon(service.category);
            return (
            <Card
              key={service.id}
              className={`relative flex flex-col justify-between transition-all ${
                !service.active ? 'opacity-60' : ''
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
                      <CategoryIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">
                        {service.name}
                      </h4>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <MdCategory className="h-3.5 w-3.5" />
                        {service.category || 'Geral'}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      service.active
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                    }`}
                  >
                    {service.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
                  {service.description || 'Sem descrição cadastrada.'}
                </p>

                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <MdAccessTime className="h-4 w-4" />
                  <span>Duração padrão: {service.defaultEstimatedMinutes} minutos</span>
                </div>

                {/* Points & Price Summary Badge */}
                <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">💰 Valor Tabela:</span>
                    <strong className="text-slate-900 dark:text-white">R$ {(service.defaultPrice || 50).toFixed(2)}</strong>
                  </div>
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>🎯 Resgate:</span>
                    <span>{service.defaultPointsCost || Math.floor((service.defaultPrice || 50) / 0.05)} pts</span>
                  </div>
                  <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 font-bold">
                    <span>🛍️ Pontos Compra:</span>
                    <span>+{Math.floor(service.defaultPrice || 50)} pts</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-700">
                <button
                  onClick={() => setSelectedConvenienceDetail(service)}
                  className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400"
                >
                  <MdInfoOutline className="h-4 w-4" /> Ficha Técnica
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedService(service);
                      setIsModalOpen(true);
                    }}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-cyan-600 hover:bg-cyan-50 dark:text-cyan-400 dark:hover:bg-slate-700"
                  >
                    <MdEdit className="h-4 w-4" /> Editar
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Deseja desativar o serviço "${service.name}"?`)) {
                        deleteMutation.mutate(service.id);
                      }
                    }}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-slate-700"
                  >
                    <MdDelete className="h-4 w-4" /> Desativar
                  </button>
                </div>
              </div>
            </Card>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <MasterServiceModal
          service={selectedService}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {selectedConvenienceDetail && (
        <ConvenienceDetailModal
          service={selectedConvenienceDetail}
          onClose={() => setSelectedConvenienceDetail(null)}
          onAction={() => setSelectedConvenienceDetail(null)}
          actionLabel="Fechar Ficha Técnico"
        />
      )}
    </div>
  );
}
