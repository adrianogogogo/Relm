import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { masterServicesAPI, storeServicesAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Card, Button } from './ui';
import ConvenienceDetailModal from './ConvenienceDetailModal';
import { getServicePlusInfo } from '../pages/CustomerStoresPage';
import {
  MdAdd, MdEdit, MdDelete, MdBuild, MdAccessTime, MdCategory, MdInfoOutline,
  MdChecklist, MdWaterDrop, MdDonutLarge, MdCompress, MdAccessibilityNew,
  MdElectricBike, MdShower, MdCheckCircle, MdStar, MdCalendarMonth, MdStorefront,
} from 'react-icons/md';

export const CATEGORY_OPTIONS = [
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

const isConvenienceCategory = (category) =>
  category === 'Conveniências & Hub do Ciclista' ||
  category?.toLowerCase().includes('conveni') ||
  category?.toLowerCase().includes('hub');

// Adapta um MasterService ao formato que getServicePlusInfo espera, para que a
// linha "padrão da rede" e a linha "nesta loja" usem exatamente o mesmo cálculo.
const masterAsService = (m) => ({
  price: m.defaultPrice,
  plusRule: m.defaultPlusRule,
  plusDiscountPercent: m.defaultPlusDiscountPercent,
  plusPrice: m.defaultPlusPrice,
});

const pointsFromPrice = (price) => Math.floor((Number(price) || 0) / 0.05);

// ─────────────────────────────────────────────────────────────────────────────
// Modal 1: padrão da rede (MasterService)
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_MASTER_FORM = {
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
      : { ...EMPTY_MASTER_FORM }
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
      ? pointsFromPrice(form.defaultPrice)
      : form.defaultPointsCost.trim() === '' ? null : Number(form.defaultPointsCost);

    mutation.mutate({
      ...form,
      defaultEstimatedMinutes: Number(form.defaultEstimatedMinutes) || 60,
      defaultPrice: Number(form.defaultPrice) || 0,
      defaultPointsCost: calculatedPointsCost,
    });
  };

  const currentPrice = Number(form.defaultPrice) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800 max-h-[90vh] overflow-y-auto">
        <h3 className="mb-1 text-xl font-bold text-slate-800 dark:text-white">
          {isEdit ? 'Editar Padrão da Rede' : 'Novo Serviço no Catálogo'}
        </h3>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
          Estes valores viram a sugestão inicial para todas as lojas da rede.
        </p>

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
                  <option key={cat} value={cat}>{cat}</option>
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
                onChange={(e) => setForm({ ...form, defaultEstimatedMinutes: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-sm focus:border-cyan-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
          </div>

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

          <PointsField
            isCustom={isCustomPoints}
            setIsCustom={setIsCustomPoints}
            price={currentPrice}
            value={form.defaultPointsCost}
            onChange={(v) => setForm({ ...form, defaultPointsCost: v })}
          />

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
              id="masterActive"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
            />
            <label htmlFor="masterActive" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Serviço Ativo no Catálogo Geral
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : isEdit ? 'Atualizar' : 'Criar Serviço'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal 2: oferta da loja (StoreService)
// ─────────────────────────────────────────────────────────────────────────────

function StoreServiceModal({ storeId, master, storeService, onClose }) {
  const queryClient = useQueryClient();
  const isEdit = !!storeService?.id;

  const [customName, setCustomName] = useState(storeService?.customName || '');
  const [customDescription, setCustomDescription] = useState(storeService?.customDescription || '');
  const [price, setPrice] = useState(
    storeService?.priceCare ?? storeService?.price ?? master?.defaultPrice ?? 100
  );
  const [plusRule, setPlusRule] = useState(
    storeService?.plusRule || master?.defaultPlusRule || 'FREE'
  );
  const [plusDiscountPercent, setPlusDiscountPercent] = useState(
    storeService?.plusDiscountPercent ?? master?.defaultPlusDiscountPercent ?? 20
  );
  const [plusPrice, setPlusPrice] = useState(
    storeService?.plusPrice ?? master?.defaultPlusPrice ?? 50
  );
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    storeService?.estimatedMinutes || master?.defaultEstimatedMinutes || 60
  );
  // Vazio = não resgatável por pontos. Guardado como string para o input
  // conseguir ficar vazio — a conversão para null acontece no submit.
  const [pointsCost, setPointsCost] = useState(() => {
    const initial = storeService?.pointsCost ?? master?.defaultPointsCost;
    return initial != null ? String(initial) : '';
  });
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

    const calculatedPointsCost = !isCustomPoints
      ? pointsFromPrice(price)
      : pointsCost.trim() === '' ? null : Number(pointsCost);

    upsertMutation.mutate({
      // Em criação o backend exige o vínculo com o catálogo; em edição o
      // vínculo já existe e o endpoint não aceita trocá-lo.
      ...(isEdit ? {} : { masterServiceId: master.id }),
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
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800 max-h-[90vh] overflow-y-auto">
        <h3 className="mb-1 text-xl font-bold text-slate-800 dark:text-white">
          {isEdit ? 'Editar Oferta da Loja' : 'Ativar Serviço nesta Loja'}
        </h3>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
          <strong className="text-slate-700 dark:text-slate-300">{master?.name}</strong>
          {master?.defaultPrice != null && (
            <> · padrão da rede: R$ {Number(master.defaultPrice).toFixed(2)}</>
          )}
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
                className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-sm font-bold focus:border-cyan-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
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
          </div>

          <PointsField
            isCustom={isCustomPoints}
            setIsCustom={setIsCustomPoints}
            price={Number(price) || 0}
            value={pointsCost}
            onChange={setPointsCost}
          />

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
              id="storeServiceActive"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
            />
            <label htmlFor="storeServiceActive" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Disponível para agendamento nesta loja
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? 'Salvando...' : 'Salvar Serviço'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Bloco de pontos compartilhado pelos dois modais — a regra (preço / 0,05) e o
// escape manual eram idênticos nos dois formulários.
function PointsField({ isCustom, setIsCustom, price, value, onChange }) {
  if (!isCustom) {
    return (
      <div className="p-4 bg-emerald-50 border-2 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 rounded-2xl space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-black text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5 text-xs">
            <MdCheckCircle className="w-4 h-4 text-emerald-700 dark:text-emerald-400" /> Atribuição Automática de Pontos Relm Care+
          </span>
          <button
            type="button"
            onClick={() => setIsCustom(true)}
            className="text-[11px] font-extrabold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white underline transition"
          >
            ✏️ Personalizar Pontos
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-300 dark:border-slate-700 shadow-xs">
            <span className="text-[11px] text-slate-900 dark:text-slate-100 font-extrabold block mb-1">🎯 Pontos para trocar de graça:</span>
            <strong className="text-emerald-700 dark:text-emerald-400 font-black text-base">{pointsFromPrice(price)} Pts</strong>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-cyan-300 dark:border-slate-700 shadow-xs">
            <span className="text-[11px] text-slate-900 dark:text-slate-100 font-extrabold block mb-1">🛍️ Pontos de presente na compra:</span>
            <strong className="text-cyan-700 dark:text-cyan-400 font-black text-base">+{Math.floor(price)} Pts</strong>
            <span className="text-[10px] text-slate-700 dark:text-slate-300 font-bold block mt-0.5">({Math.floor(price * 2)} Pts no Plus ⚡)</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-100 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-2xl space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-black text-[#0A1929] dark:text-white">Personalização Manual de Pontos:</label>
        <button
          type="button"
          onClick={() => setIsCustom(false)}
          className="text-[11px] text-emerald-800 dark:text-emerald-400 font-extrabold underline hover:opacity-80 transition"
        >
          ⚡ Voltar ao Automático
        </button>
      </div>
      <div>
        <label className="block text-xs font-extrabold text-slate-900 dark:text-slate-100 mb-1.5">
          🎯 Pontos para trocar de graça (Resgate pelo cliente)
        </label>
        <input
          type="number"
          min="0"
          step="50"
          placeholder="Ex: 1000"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border-2 border-slate-300 bg-white p-3 text-xs text-slate-900 font-black focus:outline-none focus:border-cyan-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white shadow-xs transition"
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Seção unificada
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Catálogo único de serviços & conveniências.
 *
 * - `storeId` ausente  → visão só do padrão da rede (admin sem loja em contexto).
 * - `storeId` + gestão → cada card mostra padrão da rede + oferta da loja no
 *   mesmo lugar, incluindo os serviços que a loja ainda não ativou.
 * - `canManageStore` false e sem papel Relm → visão do cliente: só o que a loja
 *   realmente oferece, com o botão de agendar.
 */
export default function ServicesCatalogSection({ storeId = null, canManageStore = false }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const canManageMaster =
    user?.role === 'ADMIN_RELM' ||
    user?.role === 'GERENTE_RELM' ||
    user?.role === 'SUPORTE_RELM';

  // Modo gestão: mostra o catálogo inteiro da rede, não só o que a loja oferece.
  const manageMode = canManageMaster || canManageStore;

  const [masterModal, setMasterModal] = useState(null); // { service } | null
  const [storeModal, setStoreModal] = useState(null);   // { master, storeService } | null
  const [detail, setDetail] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODAS');
  const [scope, setScope] = useState('ALL'); // ALL | IN_STORE | AVAILABLE | INACTIVE

  const { data: masterServices = [], isLoading: loadingMaster } = useQuery({
    queryKey: ['admin-master-services'],
    queryFn: () => masterServicesAPI.getAll(),
    enabled: manageMode,
  });

  const { data: storeServices = [], isLoading: loadingStore } = useQuery({
    queryKey: ['store-services', storeId],
    queryFn: () =>
      canManageStore
        ? storeServicesAPI.getByStore(storeId, false)
        : storeServicesAPI.getPublicByStore(storeId),
    enabled: !!storeId,
  });

  const deleteStoreMutation = useMutation({
    mutationFn: (id) => storeServicesAPI.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['store-services', storeId] }),
    onError: (err) => alert(err.response?.data?.message || 'Erro ao desativar serviço da loja.'),
  });

  const reactivateStoreMutation = useMutation({
    mutationFn: (id) => storeServicesAPI.update(id, { active: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['store-services', storeId] }),
    onError: (err) => alert(err.response?.data?.message || 'Erro ao reativar serviço na loja.'),
  });

  const toggleMasterMutation = useMutation({
    mutationFn: ({ id, active }) =>
      active ? masterServicesAPI.update(id, { active: true }) : masterServicesAPI.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-master-services'] }),
    onError: (err) => alert(err.response?.data?.message || 'Erro ao alterar o catálogo geral.'),
  });

  // Uma linha por serviço: o padrão da rede e a oferta da loja lado a lado.
  const rows = useMemo(() => {
    if (!manageMode) {
      return storeServices.map((s) => ({ master: s.masterService, store: s }));
    }

    const byMaster = new Map(storeServices.map((s) => [s.masterServiceId, s]));
    return masterServices
      .map((m) => ({ master: m, store: byMaster.get(m.id) || null }))
      // Sem loja em contexto o catálogo inteiro aparece. Com loja, um serviço
      // fora do catálogo só faz sentido se a loja ainda o oferece.
      .filter((row) => !storeId || row.master.active || row.store);
  }, [manageMode, masterServices, storeServices, storeId]);

  const counts = useMemo(() => ({
    all: rows.length,
    inStore: rows.filter((r) => r.store && r.store.active).length,
    available: rows.filter((r) => !r.store).length,
    inactive: rows.filter((r) => r.store && !r.store.active).length,
    masterInactive: rows.filter((r) => !r.master?.active).length,
  }), [rows]);

  const filteredRows = rows.filter(({ master, store }) => {
    const name = store?.displayName || master?.name || '';
    const desc = store?.displayDescription || master?.description || '';
    const category = master?.category || '';
    const term = searchTerm.toLowerCase();

    const matchesSearch =
      name.toLowerCase().includes(term) ||
      desc.toLowerCase().includes(term) ||
      category.toLowerCase().includes(term);

    const matchesCategory = selectedCategory === 'TODAS' || category === selectedCategory;

    let matchesScope = true;
    if (scope === 'IN_STORE') matchesScope = !!store && store.active;
    else if (scope === 'AVAILABLE') matchesScope = !store;
    else if (scope === 'INACTIVE') matchesScope = storeId ? !!store && !store.active : !master?.active;

    return matchesSearch && matchesCategory && matchesScope;
  });

  const categories = manageMode
    ? ['TODAS', ...CATEGORY_OPTIONS]
    : ['TODAS', ...Array.from(new Set(rows.map((r) => r.master?.category).filter(Boolean)))];

  const isLoading = (manageMode && loadingMaster) || (!!storeId && loadingStore);

  const scopeButton = (value, label, tone) => (
    <button
      key={value}
      onClick={() => setScope(value)}
      className={`rounded-lg px-3 py-1.5 font-bold transition-all ${
        scope === value
          ? `${tone} text-white shadow-sm`
          : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-4">
      {canManageMaster && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button onClick={() => setMasterModal({ service: null })} className="flex items-center gap-2">
            <MdAdd className="h-5 w-5" /> Novo Serviço no Catálogo
          </Button>
        </div>
      )}

      {/* Filtros */}
      <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Buscar por nome, palavra-chave ou descrição..."
            className="w-full max-w-md rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-sm focus:border-cyan-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          />

          {manageMode && (
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-xs">
              {scopeButton('ALL', `Todos (${counts.all})`, 'bg-slate-700')}
              {storeId ? (
                <>
                  {scopeButton('IN_STORE', `🟢 Na loja (${counts.inStore})`, 'bg-emerald-600')}
                  {scopeButton('AVAILABLE', `➕ Disponíveis (${counts.available})`, 'bg-cyan-600')}
                  {scopeButton('INACTIVE', `⛔ Desativados (${counts.inactive})`, 'bg-rose-600')}
                </>
              ) : (
                scopeButton('INACTIVE', `⛔ Fora do catálogo (${counts.masterInactive})`, 'bg-rose-600')
              )}
            </div>
          )}
        </div>

        {/* Pills de categoria */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2">
          {categories.map((cat) => {
            const count =
              cat === 'TODAS'
                ? rows.length
                : rows.filter((r) => r.master?.category === cat).length;
            const isSelected = selectedCategory === cat;
            const isConveniencePill = isConvenienceCategory(cat);

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                  isSelected
                    ? isConveniencePill
                      ? 'bg-gradient-to-r from-purple-600 to-amber-600 text-white shadow-md shadow-purple-500/25 ring-2 ring-purple-400/40'
                      : 'bg-cyan-600 text-white shadow-sm'
                    : isConveniencePill
                    ? 'border-2 border-purple-400/60 bg-purple-50 text-purple-800 hover:bg-purple-100 dark:border-purple-600/50 dark:bg-purple-950/40 dark:text-purple-300 font-bold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                <span>{isConveniencePill && !isSelected ? '✨ ' : ''}{cat === 'TODAS' ? 'Todas as Categorias' : cat}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isSelected
                      ? 'bg-white/20 text-white font-bold'
                      : isConveniencePill
                      ? 'bg-purple-200 text-purple-900 dark:bg-purple-900/60 dark:text-purple-200 font-bold'
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
      ) : filteredRows.length === 0 ? (
        <Card className="py-12 text-center text-slate-500">
          Nenhum serviço encontrado com os filtros selecionados.
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredRows.map(({ master, store }) => (
            <ServiceCard
              key={master?.id || store?.id}
              master={master}
              store={store}
              storeId={storeId}
              canManageMaster={canManageMaster}
              canManageStore={canManageStore}
              manageMode={manageMode}
              onDetail={() => setDetail(store || master)}
              onEditMaster={() => setMasterModal({ service: master })}
              onToggleMaster={() => {
                const label = master.active ? 'desativar' : 'reativar';
                if (confirm(`Deseja ${label} "${master.name}" no catálogo geral da rede?`)) {
                  toggleMasterMutation.mutate({ id: master.id, active: !master.active });
                }
              }}
              onEditStore={() => setStoreModal({ master, storeService: store })}
              onToggleStore={() => {
                const name = store.displayName || master?.name;
                if (store.active) {
                  if (confirm(`Desativar "${name}" desta loja?`)) deleteStoreMutation.mutate(store.id);
                } else if (confirm(`Reativar "${name}" nesta loja?`)) {
                  reactivateStoreMutation.mutate(store.id);
                }
              }}
              onSchedule={() =>
                navigate('/cliente/oficina', { state: { storeId, storeServiceId: store.id } })
              }
            />
          ))}
        </div>
      )}

      {masterModal && (
        <MasterServiceModal service={masterModal.service} onClose={() => setMasterModal(null)} />
      )}

      {storeModal && (
        <StoreServiceModal
          storeId={storeId}
          master={storeModal.master}
          storeService={storeModal.storeService}
          onClose={() => setStoreModal(null)}
        />
      )}

      {detail && (
        <ConvenienceDetailModal
          service={detail}
          onClose={() => setDetail(null)}
          onAction={() => setDetail(null)}
          actionLabel="Fechar Ficha Técnica"
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Card único: padrão da rede em cima, oferta da loja embaixo
// ─────────────────────────────────────────────────────────────────────────────

function ServiceCard({
  master, store, storeId, canManageMaster, canManageStore, manageMode,
  onDetail, onEditMaster, onToggleMaster, onEditStore, onToggleStore, onSchedule,
}) {
  const category = master?.category || 'Oficina';
  const isConvenience = isConvenienceCategory(category);
  const CategoryIcon = categoryIcon(category);
  const name = store?.displayName || master?.name || 'Serviço';
  const description =
    store?.displayDescription || master?.description || 'Sem descrição cadastrada.';

  const masterInactive = manageMode && master && !master.active;
  const notInStore = !!storeId && manageMode && !store;
  const dimmed = masterInactive || notInStore || (store && !store.active);

  const masterPlus = master ? getServicePlusInfo(masterAsService(master)) : null;
  const storePlus = store ? getServicePlusInfo(store) : null;

  return (
    <div
      className={`relative flex flex-col justify-between rounded-2xl p-5 transition-all duration-200 ${
        masterInactive
          ? 'border-2 border-dashed border-rose-300 dark:border-rose-900/60 bg-slate-100/90 dark:bg-slate-900/90 grayscale-[85%] hover:grayscale-0'
          : notInStore
          ? 'border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/60 hover:border-cyan-400 dark:hover:border-cyan-700'
          : isConvenience
          ? 'border-2 border-purple-400/70 dark:border-purple-500/50 bg-gradient-to-br from-purple-50/80 via-white to-amber-50/60 dark:from-purple-950/30 dark:via-slate-800 dark:to-amber-950/20 shadow-lg shadow-purple-500/10 ring-1 ring-purple-400/30 hover:-translate-y-0.5'
          : 'border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5'
      } ${store && !store.active ? 'opacity-70' : ''}`}
    >
      <div className="space-y-3">
        {/* Faixa de destaque */}
        {masterInactive ? (
          <div className="flex items-center justify-between gap-2 pb-1 border-b border-rose-200 dark:border-rose-900/50">
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider">
              ⛔ Fora do catálogo da rede
            </span>
          </div>
        ) : isConvenience ? (
          <div className="flex items-center justify-between gap-2 pb-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-amber-600 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm shadow-purple-500/25">
              ✨ Hub & Conveniência
            </span>
            <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300">
              Amenidade Exclusiva
            </span>
          </div>
        ) : null}

        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl font-bold ${
                dimmed
                  ? 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  : isConvenience
                  ? 'bg-gradient-to-br from-purple-600 to-amber-500 text-white shadow-md shadow-purple-500/30 ring-2 ring-purple-300/60 dark:ring-purple-800'
                  : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300'
              }`}
            >
              <CategoryIcon className="h-6 w-6" />
            </div>
            <div>
              <h4 className={`font-bold text-base leading-tight ${
                masterInactive ? 'text-slate-500 line-through dark:text-slate-400' : 'text-slate-900 dark:text-white'
              }`}>
                {name}
              </h4>
              <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                isConvenience ? 'text-purple-700 dark:text-purple-300' : 'text-slate-500 dark:text-slate-400'
              }`}>
                <MdCategory className="h-3.5 w-3.5" /> {category}
              </span>
            </div>
          </div>

          {storeId && manageMode && (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold shrink-0 ${
              !store
                ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                : store.active
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
            }`}>
              {!store ? '＋ Não ativado' : store.active ? '🟢 Na loja' : '⛔ Desativado'}
            </span>
          )}
        </div>

        <p className={`text-sm line-clamp-3 ${
          dimmed ? 'text-slate-500 dark:text-slate-400' : 'text-slate-600 dark:text-slate-300'
        }`}>
          {description}
        </p>

        {/* Padrão da rede — só para quem gerencia */}
        {manageMode && master && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1.5 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <MdStorefront className="h-3.5 w-3.5" /> Padrão da rede
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium">💰 Valor Tabela:</span>
              <strong className="text-slate-900 dark:text-white">
                R$ {Number(master.defaultPrice || 0).toFixed(2)}
              </strong>
            </div>
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold">
              <span>🎯 Resgate:</span>
              <span>{master.defaultPointsCost ?? pointsFromPrice(master.defaultPrice)} pts</span>
            </div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1"><MdAccessTime className="h-3.5 w-3.5" /> Duração:</span>
              <span>{master.defaultEstimatedMinutes} min</span>
            </div>
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-bold">
              <span className="flex items-center gap-1"><MdStar className="h-3.5 w-3.5" /> Plus:</span>
              <span>{masterPlus.badgeText.replace('Plus: ', '')}</span>
            </div>
          </div>
        )}

        {/* Oferta desta loja */}
        {storeId && (
          store ? (
            <div className={`rounded-xl border p-3 text-xs space-y-1.5 ${
              isConvenience
                ? 'bg-purple-50/60 dark:bg-purple-950/30 border-purple-200/80 dark:border-purple-800/50'
                : 'bg-cyan-50/60 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-900/50'
            }`}>
              {manageMode && (
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
                  <MdBuild className="h-3.5 w-3.5" /> Nesta loja
                </div>
              )}
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-semibold">
                <span>Cliente Care:</span>
                <strong className="text-slate-900 dark:text-white">R$ {storePlus.priceCare.toFixed(2)}</strong>
              </div>
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <MdStar className="h-4 w-4" /> Relm Plus:
                </span>
                <span className={storePlus.plusRule === 'FREE' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                  {storePlus.badgeText.replace('Plus: ', '')}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1"><MdAccessTime className="h-3.5 w-3.5" /> Duração:</span>
                <span>{store.estimatedMinutes} min</span>
              </div>
            </div>
          ) : manageMode ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Ainda não oferecido nesta loja — ative para definir preço, pontos e regra Plus.
            </div>
          ) : null
        )}
      </div>

      {/* Ações */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-700/80">
        <button
          onClick={onDetail}
          className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 transition-colors"
        >
          <MdInfoOutline className="h-4 w-4" /> Ficha Técnica
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {canManageMaster && master && (
            <>
              <button
                onClick={onEditMaster}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                <MdEdit className="h-4 w-4" /> Padrão
              </button>
              {!storeId && (
                <button
                  onClick={onToggleMaster}
                  className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors ${
                    master.active
                      ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-slate-700'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {master.active ? <MdDelete className="h-4 w-4" /> : <MdCheckCircle className="h-4 w-4" />}
                  {master.active ? 'Desativar' : 'Reativar'}
                </button>
              )}
            </>
          )}

          {storeId && canManageStore && (
            store ? (
              <>
                <button
                  onClick={onEditStore}
                  className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-cyan-600 hover:bg-cyan-50 dark:text-cyan-400 dark:hover:bg-slate-700 transition-colors"
                >
                  <MdEdit className="h-4 w-4" /> Na loja
                </button>
                <button
                  onClick={onToggleStore}
                  className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors ${
                    store.active
                      ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-slate-700'
                      : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-slate-700'
                  }`}
                >
                  {store.active ? <MdDelete className="h-4 w-4" /> : <MdCheckCircle className="h-4 w-4" />}
                  {store.active ? 'Desativar' : 'Reativar'}
                </button>
              </>
            ) : (
              <button
                onClick={onEditStore}
                className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-cyan-700 transition-all"
              >
                <MdAdd className="h-4 w-4" /> Ativar nesta loja
              </button>
            )
          )}

          {storeId && !manageMode && store && (
            <button
              onClick={onSchedule}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-cyan-700"
            >
              <MdCalendarMonth className="h-4 w-4" /> Agendar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
