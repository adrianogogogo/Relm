import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storeServicesAPI, masterServicesAPI } from '../services/api';
import { Card, Button } from './ui';
import ConvenienceDetailModal from './ConvenienceDetailModal';
import { getServicePlusInfo } from '../pages/CustomerStoresPage';
import {
  MdBuild,
  MdAccessTime,
  MdStar,
  MdAdd,
  MdEdit,
  MdDelete,
  MdCalendarMonth,
  MdCheckCircle,
  MdLocalOffer,
  MdInfoOutline,
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

const RULE_LABELS = {
  FREE: 'Gratuito no Relm Plus',
  DISCOUNT_PERCENT: 'Desconto % no Relm Plus',
  FIXED_PRICE: 'Valor Especial no Relm Plus',
};

function AddEditStoreServiceModal({ storeId, storeService, masterServices, onClose }) {
  const queryClient = useQueryClient();
  const isEdit = !!storeService?.id;

  const [masterServiceId, setMasterServiceId] = useState(
    storeService?.masterServiceId || masterServices[0]?.id || ''
  );
  const [customName, setCustomName] = useState(storeService?.customName || '');
  const [customDescription, setCustomDescription] = useState(
    storeService?.customDescription || ''
  );
  const [price, setPrice] = useState(storeService?.priceCare ?? storeService?.price ?? 100);
  const [plusRule, setPlusRule] = useState(storeService?.plusRule || 'FREE');
  const [plusDiscountPercent, setPlusDiscountPercent] = useState(
    storeService?.plusDiscountPercent || 20
  );
  const [plusPrice, setPlusPrice] = useState(storeService?.plusPrice || 50);
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    storeService?.estimatedMinutes || 60
  );
  // Vazio = não resgatável por pontos. Guardado como string para o input
  // conseguir ficar vazio — a conversão para null acontece no submit.
  const [pointsCost, setPointsCost] = useState(
    storeService?.pointsCost != null ? String(storeService.pointsCost) : ''
  );
  const [isCustomPoints, setIsCustomPoints] = useState(false);
  const [active, setActive] = useState(storeService?.active ?? true);
  const [error, setError] = useState('');

  const upsertMutation = useMutation({
    mutationFn: (data) =>
      isEdit
        ? storeServicesAPI.update(storeService.id, data)
        : storeServicesAPI.upsert(storeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-services', storeId] });
      onClose();
    },
    onError: (err) =>
      setError(err.response?.data?.message || 'Erro ao salvar serviço da loja.'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isEdit && !masterServiceId) {
      setError('Selecione um serviço do catálogo mestre.');
      return;
    }

    const calculatedPointsCost = !isCustomPoints
      ? Math.floor((Number(price) || 0) / 0.05)
      : pointsCost.trim() === '' ? null : Number(pointsCost);

    upsertMutation.mutate({
      masterServiceId,
      customName: customName.trim() || undefined,
      customDescription: customDescription.trim() || undefined,
      price: Number(price),
      plusRule,
      plusDiscountPercent: plusRule === 'DISCOUNT_PERCENT' ? Number(plusDiscountPercent) : null,
      plusPrice: plusRule === 'FIXED_PRICE' ? Number(plusPrice) : null,
      estimatedMinutes: Number(estimatedMinutes) || 60,
      pointsCost: calculatedPointsCost,
      active,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800">
        <h3 className="mb-4 text-xl font-bold text-slate-800 dark:text-white">
          {isEdit ? 'Editar Serviço da Loja' : 'Vincular Serviço à Loja'}
        </h3>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Serviço do Catálogo Mestre *
              </label>
              <select
                value={masterServiceId}
                onChange={(e) => {
                  const selId = e.target.value;
                  setMasterServiceId(selId);
                  const selMs = masterServices.find((m) => m.id === selId);
                  if (selMs) {
                    setEstimatedMinutes(selMs.defaultEstimatedMinutes || 60);
                  }
                }}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-sm focus:border-cyan-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              >
                {masterServices.map((ms) => (
                  <option key={ms.id} value={ms.id}>
                    {ms.name} ({ms.category || 'Geral'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Preço Padrão Care (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-sm focus:border-cyan-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Tempo Estimado (minutos)
              </label>
              <input
                type="number"
                min="15"
                step="15"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-sm focus:border-cyan-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* Atribuição de Pontos Intuitiva (100% Automática por Padrão) */}
            <div className="sm:col-span-2 space-y-3">
              {!isCustomPoints ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <MdCheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Atribuição Automática de Pontos Relm Care+
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCustomPoints(true)}
                      className="text-[11px] font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white underline transition"
                    >
                      ✏️ Personalizar Pontos
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-200/80 dark:border-slate-800 shadow-xs">
                      <span className="text-[11px] text-slate-700 dark:text-slate-300 font-bold block mb-0.5">🎯 Pontos para trocar de graça:</span>
                      <strong className="text-emerald-700 dark:text-emerald-400 font-black text-sm">{Math.floor((Number(price) || 0) / 0.05)} Pts</strong>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-cyan-200/80 dark:border-slate-800 shadow-xs">
                      <span className="text-[11px] text-slate-700 dark:text-slate-300 font-bold block mb-0.5">🛍️ Pontos de presente na compra:</span>
                      <strong className="text-cyan-700 dark:text-cyan-400 font-black text-sm">+{Math.floor(Number(price) || 0)} Pts</strong>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block mt-0.5">({Math.floor(Number(price) || 0) * 2} Pts no Plus ⚡)</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-[#0A1929] dark:text-white">Personalização Manual de Pontos:</label>
                    <button
                      type="button"
                      onClick={() => setIsCustomPoints(false)}
                      className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold underline hover:opacity-80 transition"
                    >
                      ⚡ Voltar ao Automático
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      🎯 Pontos para trocar de graça (Resgate pelo cliente)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      placeholder="Ex: 1000"
                      value={pointsCost}
                      onChange={(e) => setPointsCost(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 font-black focus:outline-none focus:border-cyan-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white shadow-xs transition"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-cyan-50/60 p-3.5 dark:bg-slate-700/50">
            <label className="block text-sm font-bold text-cyan-900 dark:text-cyan-200">
              Regra de Benefício Relm Plus ⭐
            </label>
            <select
              value={plusRule}
              onChange={(e) => setPlusRule(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-cyan-200 bg-white p-2.5 text-sm focus:border-cyan-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            >
              <option value="FREE">Gratuito (100% Coberto pelo Plano Plus)</option>
              <option value="DISCOUNT_PERCENT">Desconto em Porcentagem (%)</option>
              <option value="FIXED_PRICE">Valor Fixo Especial para Plus (R$)</option>
            </select>

            {plusRule === 'DISCOUNT_PERCENT' && (
              <div className="mt-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Porcentagem de Desconto no Plus (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={plusDiscountPercent}
                  onChange={(e) => setPlusDiscountPercent(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2 text-sm focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </div>
            )}

            {plusRule === 'FIXED_PRICE' && (
              <div className="mt-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Valor Cobrado do Membro Plus (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={plusPrice}
                  onChange={(e) => setPlusPrice(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2 text-sm focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Nome Customizado (Opcional - substitui o nome padrão)
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Deixe em branco para usar o nome padrão"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-sm focus:border-cyan-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Observações / Detalhes Inclusos na Loja
            </label>
            <textarea
              rows={2}
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder="Informações específicas desta loja para este serviço..."
              className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-sm focus:border-cyan-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="activeService"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
            />
            <label htmlFor="activeService" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Disponível para agendamento nesta loja
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? 'Salvando...' : 'Salvar Serviço'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StoreServicesSection({ storeId, isAdmin = false }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedStoreService, setSelectedStoreService] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODAS');
  const [plusRuleFilter, setPlusRuleFilter] = useState('ALL'); // 'ALL' | 'FREE' | 'DISCOUNT'
  const [selectedConvenienceDetail, setSelectedConvenienceDetail] = useState(null);

  const { data: storeServices = [], isLoading } = useQuery({
    queryKey: ['store-services', storeId],
    queryFn: () =>
      isAdmin
        ? storeServicesAPI.getByStore(storeId, false)
        : storeServicesAPI.getPublicByStore(storeId),
  });

  const { data: masterServices = [] } = useQuery({
    queryKey: ['admin-master-services'],
    queryFn: () => masterServicesAPI.getAll(true),
    enabled: isAdmin,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => storeServicesAPI.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['store-services', storeId] }),
  });

  // Extract unique categories from store's services
  const availableCategories = [
    'TODAS',
    ...Array.from(
      new Set(
        storeServices
          .map((s) => s.masterService?.category)
          .filter(Boolean)
      )
    ),
  ];

  const filteredStoreServices = storeServices.filter((service) => {
    const name = service.displayName || service.masterService?.name || '';
    const desc = service.displayDescription || service.masterService?.description || '';
    const category = service.masterService?.category || 'Oficina';

    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'TODAS' || category === selectedCategory;

    const matchesPlusRule =
      plusRuleFilter === 'ALL' ||
      (plusRuleFilter === 'FREE' && service.plusRule === 'FREE') ||
      (plusRuleFilter === 'DISCOUNT' && service.plusRule !== 'FREE');

    return matchesSearch && matchesCategory && matchesPlusRule;
  });

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <MdBuild className="h-5 w-5 text-cyan-600" />
            Serviços & Oficina da Loja
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tabela de serviços disponíveis para clientes Care e Plus nesta unidade.
          </p>
        </div>

        {isAdmin && (
          <Button
            size="sm"
            onClick={() => {
              setSelectedStoreService(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5"
          >
            <MdAdd className="h-4 w-4" /> Adicionar Serviço
          </Button>
        )}
      </div>

      {/* Interactive Filter Bar */}
      {storeServices.length > 0 && (
        <div className="space-y-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Buscar por serviço ou palavra-chave..."
              className="w-full max-w-sm rounded-lg border border-slate-300 bg-white p-2 text-xs focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />

            {/* Plus Rule Toggle */}
            <div className="flex items-center gap-1 rounded-lg bg-white p-1 shadow-sm dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <button
                onClick={() => setPlusRuleFilter('ALL')}
                className={`rounded px-2.5 py-1 font-semibold transition-all ${
                  plusRuleFilter === 'ALL'
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setPlusRuleFilter('FREE')}
                className={`rounded px-2.5 py-1 font-semibold transition-all ${
                  plusRuleFilter === 'FREE'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                ✨ Gratuitos no Plus
              </button>
              <button
                onClick={() => setPlusRuleFilter('DISCOUNT')}
                className={`rounded px-2.5 py-1 font-semibold transition-all ${
                  plusRuleFilter === 'DISCOUNT'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                🏷️ Com Desconto
              </button>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-1 pt-1">
            {availableCategories.map((cat) => {
              const isSelected = selectedCategory === cat;
              const count =
                cat === 'TODAS'
                  ? storeServices.length
                  : storeServices.filter((s) => s.masterService?.category === cat).length;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-cyan-600 text-white font-bold'
                      : 'bg-white text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>{cat === 'TODAS' ? 'Todas' : cat}</span>
                  <span className={`text-[10px] opacity-80 ${isSelected ? 'font-bold' : ''}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="py-6 text-center text-sm text-slate-400">Carregando serviços...</div>
      ) : storeServices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
          Nenhum serviço cadastrado para esta loja.
        </div>
      ) : filteredStoreServices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
          Nenhum serviço encontrado com os filtros selecionados.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredStoreServices.map((service) => {
            const name = service.displayName || service.masterService?.name || 'Serviço';
            const desc =
              service.displayDescription ||
              service.masterService?.description ||
              'Sem descrição informada.';
            const priceCare = service.priceCare ?? Number(service.price);
            const calculatedPlusPrice = service.calculatedPlusPrice;

            return (
              <div
                key={service.id}
                className={`relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800/80 ${
                  !service.active ? 'opacity-60' : ''
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-1 ${
                        service.masterService?.category === 'Conveniências & Hub do Ciclista'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                          : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300'
                      }`}>
                        {service.masterService?.category === 'Conveniências & Hub do Ciclista' ? '🌟 Conveniência & Hub' : (service.masterService?.category || 'Oficina')}
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white">{name}</h4>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300 shrink-0">
                      <MdAccessTime className="h-3.5 w-3.5" />
                      {service.estimatedMinutes} min
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {desc}
                  </p>

                  <div className="mt-3 rounded-lg bg-slate-50 p-2.5 text-xs space-y-1.5 dark:bg-slate-900/50">
                    {(() => {
                      const info = getServicePlusInfo(service);
                      return (
                        <>
                          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-semibold">
                            <span>Cliente Care:</span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              R$ {info.priceCare.toFixed(2)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between font-bold">
                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                              <MdStar className="h-4 w-4" /> Relm Plus:
                            </span>
                            <span className={info.plusRule === 'FREE' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                              {info.badgeText}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-700">
                  <button
                    onClick={() => setSelectedConvenienceDetail(service)}
                    className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400"
                  >
                    <MdInfoOutline className="h-4 w-4" /> Detalhes & Regras
                  </button>

                  {isAdmin ? (
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        onClick={() => {
                          setSelectedStoreService(service);
                          setIsModalOpen(true);
                        }}
                        className="flex items-center gap-1 text-xs font-semibold text-cyan-600 hover:underline dark:text-cyan-400"
                      >
                        <MdEdit className="h-4 w-4" /> Editar
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remover "${name}" desta loja?`)) {
                            deleteMutation.mutate(service.id);
                          }
                        }}
                        className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline dark:text-red-400"
                      >
                        <MdDelete className="h-4 w-4" /> Remover
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        navigate(`/cliente/oficina`, {
                          state: { storeId, storeServiceId: service.id },
                        })
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-cyan-700"
                    >
                      <MdCalendarMonth className="h-4 w-4" /> Agendar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <AddEditStoreServiceModal
          storeId={storeId}
          storeService={selectedStoreService}
          masterServices={masterServices}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedStoreService(null);
          }}
        />
      )}

      {selectedConvenienceDetail && (
        <ConvenienceDetailModal
          service={selectedConvenienceDetail}
          onClose={() => setSelectedConvenienceDetail(null)}
          onAction={() => setSelectedConvenienceDetail(null)}
          actionLabel="Entendido"
        />
      )}
    </Card>
  );
}
