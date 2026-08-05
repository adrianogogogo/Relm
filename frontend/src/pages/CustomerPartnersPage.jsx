import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { partnersAPI } from '../services/api';
import { Card, PageHeader } from '../components/ui';
import {
  MdStorefront,
  MdHotel,
  MdDirectionsBike,
  MdMoreHoriz,
  MdLock,
  MdOpenInNew,
  MdLocationOn,
} from 'react-icons/md';

const CATEGORY_META = {
  CAFE:   { label: 'Cafés',   icon: MdStorefront,       color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
  HOTEL:  { label: 'Hotéis',  icon: MdHotel,            color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
  PROVA:  { label: 'Provas',  icon: MdDirectionsBike,   color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
  OUTRO:  { label: 'Outros',  icon: MdMoreHoriz,        color: 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300' },
};

const CATEGORY_ORDER = ['CAFE', 'HOTEL', 'PROVA', 'OUTRO'];

function PartnerCard({ partner }) {
  const meta = CATEGORY_META[partner.category] ?? CATEGORY_META.OUTRO;
  const Icon = meta.icon;
  const locked = !partner.eligible;

  return (
    <Card className={`flex flex-col gap-3 relative overflow-hidden transition-shadow hover:shadow-md ${locked ? 'opacity-80' : ''}`}>
      {/* Category badge */}
      <div className="flex items-center justify-between">
        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.color}`}>
          <Icon size={11} /> {meta.label}
        </span>
        {locked && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <MdLock size={11} /> Exclusivo PLUS
          </span>
        )}
      </div>

      {/* Logo + name */}
      <div className="flex items-center gap-3">
        {partner.logoUrl ? (
          <img src={partner.logoUrl} alt={partner.name} className="w-12 h-12 object-contain rounded-lg border border-gray-100 dark:border-slate-800 shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-lg border border-gray-100 dark:border-slate-800 flex items-center justify-center bg-gray-50 dark:bg-slate-900 shrink-0">
            <Icon size={22} className="text-gray-400" />
          </div>
        )}
        <div className="min-w-0">
          <h4 className="font-title font-bold text-gray-900 dark:text-slate-100 text-sm truncate">{partner.name}</h4>
          {partner.city && (
            <p className="text-[10px] text-gray-500 dark:text-slate-400 flex items-center gap-0.5">
              <MdLocationOn size={11} /> {partner.city}
            </p>
          )}
        </div>
      </div>

      {/* Benefit highlight */}
      <div className={`rounded-lg p-2.5 text-xs ${locked
        ? 'bg-gray-50 dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800 text-gray-400 dark:text-slate-500 select-none blur-[1px]'
        : 'bg-[#0A1929]/10 dark:bg-[#2196F3]/20 border border-[#183757]/30 text-[#0A1929] dark:text-[#2196F3] font-medium'
      }`}>
        {locked ? '••••••••••••••••••' : partner.benefit}
      </div>

      {partner.description && !locked && (
        <p className="text-[11px] text-gray-500 dark:text-slate-400 line-clamp-2">{partner.description}</p>
      )}

      {/* Footer */}
      <div className="pt-1 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
        {locked ? (
          <a
            href="/cliente/assinatura"
            className="text-xs text-amber-700 dark:text-amber-400 font-semibold underline flex items-center gap-1"
          >
            <MdLock size={13} /> Seja Plus para desbloquear
          </a>
        ) : partner.isStore ? (
          <Link
            to="/cliente/lojas"
            className="text-xs text-cyan-600 dark:text-cyan-400 font-bold underline flex items-center gap-1"
          >
            📍 Ver Loja & Conveniências <MdOpenInNew size={13} />
          </Link>
        ) : partner.link ? (
          <a
            href={partner.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#0A1929] dark:text-[#2196F3] font-semibold underline flex items-center gap-1"
          >
            Visitar <MdOpenInNew size={13} />
          </a>
        ) : (
          <span />
        )}
      </div>
    </Card>
  );
}

export default function CustomerPartnersPage() {
  const [activeCategory, setActiveCategory] = useState('ALL');

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ['customer-partners'],
    queryFn: partnersAPI.getForCustomer,
  });

  const categories = ['ALL', ...CATEGORY_ORDER.filter((c) =>
    partners.some((p) => p.category === c),
  )];

  const filtered = activeCategory === 'ALL'
    ? partners
    : partners.filter((p) => p.category === activeCategory);

  return (
    <div className="py-8 px-6">
      <div className="max-w-5xl mx-auto">
        <PageHeader
          title="Parcerias RELM"
          subtitle="Vantagens exclusivas em cafés, hotéis, provas e muito mais para membros do clube"
        />

        {/* Category filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => {
            const meta = cat === 'ALL' ? null : CATEGORY_META[cat];
            const Icon = meta?.icon;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                  activeCategory === cat
                    ? 'bg-[#0A1929] dark:bg-[#2196F3] text-white border-[#0A1929]'
                    : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-[#183757] hover:text-[#0A1929] dark:hover:text-[#2196F3]'
                }`}
              >
                {Icon && <Icon size={13} />}
                {cat === 'ALL' ? 'Todos' : meta?.label}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <span className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">Nenhum parceiro disponível no momento.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((partner) => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
