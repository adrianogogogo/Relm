import React from 'react';
import { getConvenienceDetailsByName } from '../data/convenienceDetails';
import { Button } from './ui';
import {
  MdClose,
  MdCheckCircle,
  MdAccessTime,
  MdStar,
  MdInfoOutline,
  MdStorefront,
  MdCalendarMonth,
  MdVerified,
  MdShield,
} from 'react-icons/md';

export default function ConvenienceDetailModal({
  service,
  store,
  onClose,
  onAction,
  actionLabel = 'Agendar / Consumir nesta Loja',
}) {
  if (!service) return null;

  const masterName = service.masterService?.name || service.name || 'Conveniência';
  const masterCategory = service.masterService?.category || service.category || 'Conveniências & Hub do Ciclista';
  const masterDesc = service.masterService?.description || service.description || '';

  const details = getConvenienceDetailsByName(masterName);
  const icon = details?.icon || '⭐';

  const isFree = service.plusRule === 'FREE' || details?.plusBenefitText?.includes('GRATUITO');
  const priceCare = service.price !== undefined ? Number(service.price) : (service.defaultPrice || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-fadeIn">
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-3xl bg-white shadow-2xl dark:bg-slate-900 overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="relative border-b border-slate-200 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-50 p-6 dark:border-slate-800 dark:from-amber-500/20 dark:to-slate-800/80">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-white font-extrabold text-3xl shadow-lg shadow-amber-500/30 shrink-0">
                {icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    {masterCategory}
                  </span>
                  {details?.estimatedTime && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      <MdAccessTime className="h-3.5 w-3.5" /> {details.estimatedTime}
                    </span>
                  )}
                </div>

                <h3 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
                  {masterName}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white transition-all"
            >
              <MdClose className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 overflow-y-auto p-6 text-slate-700 dark:text-slate-300 text-sm">
          
          {/* Summary / Description */}
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <p className="leading-relaxed text-slate-700 dark:text-slate-200">
              {details?.summary || masterDesc}
            </p>
          </div>

          {/* Items & Facilities Included */}
          {details?.itemsIncluded && (
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white">
                <MdVerified className="h-5 w-5 text-emerald-500" />
                Facilidades & Insumos Inclusos Nesta Conveniência:
              </h4>

              <div className="grid gap-2.5 sm:grid-cols-2">
                {details.itemsIncluded.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-800/90 font-semibold text-xs text-slate-800 dark:text-slate-200"
                  >
                    <span className="text-lg leading-none">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Usage Rules & Guidelines */}
          {details?.rules && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-extrabold text-blue-900 dark:text-blue-300">
                <MdInfoOutline className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Orientações & Regras de Uso:
              </h4>

              <ul className="space-y-1.5 pl-2 text-xs text-blue-800 dark:text-blue-200">
                {details.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Relm Plus vs Care Price Comparison Card */}
          <div className="rounded-2xl border border-amber-300/80 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-5 dark:border-amber-700/60 dark:from-amber-950/40">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                  <MdStar className="h-4 w-4 text-amber-500" />
                  BENEFÍCIO RELM PLUS
                </div>
                <h5 className="text-base font-extrabold text-amber-950 dark:text-amber-200 mt-0.5">
                  {details?.plusBenefitText || (isFree ? 'GRATUITO NO RELM PLUS' : 'DESCONTO EXCLUSIVO NO PLUS')}
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {priceCare > 0 ? `Valor padrão (Plano Care): R$ ${priceCare.toFixed(2)}` : 'Atendimento cortesia da rede Relm'}
                </p>
              </div>

              <div className="rounded-xl bg-amber-500 px-4 py-2 text-white font-extrabold text-sm shadow-md shrink-0">
                {isFree ? '100% GRATUITO' : 'DESCONTO PLUS'}
              </div>
            </div>
          </div>

          {store && (
            <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-3 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <MdStorefront className="h-5 w-5 text-cyan-600 shrink-0" />
              <span>Disponível na unidade: <strong className="text-slate-900 dark:text-white">{store.tradeName}</strong> ({store.city}/{store.state})</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/80">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>

          {onAction && (
            <Button onClick={onAction} className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold">
              <MdCalendarMonth className="h-5 w-5" /> {actionLabel}
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}
