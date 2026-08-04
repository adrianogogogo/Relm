import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storeServicesAPI, masterServicesAPI } from '../services/api';
import { Card, Button } from './ui';
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

    upsertMutation.mutate({
      masterServiceId,
      customName: customName.trim() || undefined,
      customDescription: customDescription.trim() || undefined,
      price: Number(price),
      plusRule,
      plusDiscountPercent: plusRule === 'DISCOUNT_PERCENT' ? Number(plusDiscountPercent) : null,
      plusPrice: plusRule === 'FIXED_PRICE' ? Number(plusPrice) : null,
      estimatedMinutes: Number(estimatedMinutes) || 60,
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
                className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-sm focus:border-cyan-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
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

      {isLoading ? (
        <div className="py-6 text-center text-sm text-slate-400">Carregando serviços...</div>
      ) : storeServices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
          Nenhum serviço cadastrado para esta loja.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {storeServices.map((service) => {
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
                    <h4 className="font-bold text-slate-900 dark:text-white">{name}</h4>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                      <MdAccessTime className="h-3.5 w-3.5" />
                      {service.estimatedMinutes} min
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {desc}
                  </p>

                  <div className="mt-3 rounded-lg bg-slate-50 p-2.5 text-xs space-y-1.5 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                      <span>Cliente Care:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        R$ {priceCare.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-semibold">
                      <span className="flex items-center gap-1">
                        <MdStar className="h-4 w-4" /> Relm Plus:
                      </span>
                      <span>
                        {service.plusRule === 'FREE' ? (
                          <span className="rounded bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                            GRATUITO
                          </span>
                        ) : (
                          `R$ ${calculatedPlusPrice.toFixed(2)}`
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-700">
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
                        navigate(`/customer/workshop`, {
                          state: { storeId, storeServiceId: service.id },
                        })
                      }
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-cyan-700"
                    >
                      <MdCalendarMonth className="h-4 w-4" /> Agendar Este Serviço
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
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </Card>
  );
}
