import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MdStars, MdChevronRight, MdHistory } from 'react-icons/md';
import { customerPortalAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function PointsBalanceWidget() {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const { data: pointsData, isLoading } = useQuery({
    queryKey: ['customer-points', user?.id],
    queryFn: () => customerPortalAPI.getPointsBalance(),
    enabled: !!user?.id && (user?.userType === 'CUSTOMER' || user?.userType === 'CLIENTE'),
    refetchInterval: 20000,
  });

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user || (user.userType !== 'CUSTOMER' && user.userType !== 'CLIENTE')) {
    return null;
  }

  const balance = pointsData?.balance ?? pointsData?.total ?? 0;
  const monthly = pointsData?.monthly ?? 0;
  const accumulated = pointsData?.accumulated ?? 0;
  const isPlus = user?.currentTier === 'PLUS';

  return (
    <div className="relative font-sans" ref={containerRef}>
      {/* Botão Principal do Widget na Topbar */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-blue-500/20 hover:from-amber-500/30 hover:to-blue-500/30 border border-amber-500/40 dark:border-amber-400/40 text-amber-900 dark:text-amber-300 font-extrabold text-xs shadow-sm transition-all active:scale-95"
        title="Clique para ver o extrato de pontos"
      >
        <div className="p-1 rounded-lg bg-amber-500 text-slate-950 font-black shadow-xs">
          <MdStars className="w-4 h-4" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[10px] uppercase tracking-wider text-slate-600 dark:text-amber-200/80 font-bold leading-none">
            Meu Saldo
          </span>
          <span className="text-sm font-black text-slate-900 dark:text-white leading-tight">
            {isLoading ? '...' : `${balance.toLocaleString('pt-BR')} Pts`}
          </span>
        </div>
      </button>

      {/* Popover de Detalhamento dos Saldos */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <MdStars className="w-5 h-5 text-amber-500" />
              <h3 className="font-extrabold text-sm text-[#0A1929] dark:text-white">
                Detalhamento dos Pontos
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              {isPlus ? 'Plano Plus ⚡' : 'Plano Care 🚴'}
            </span>
          </div>

          <div className="py-3 space-y-3">
            {/* Saldo Mensal Renovável */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1">
                  🟡 Pontos Mensais (Plano)
                </span>
                <span className="font-black text-amber-900 dark:text-amber-200 text-sm">
                  {monthly.toLocaleString('pt-BR')} pts
                </span>
              </div>
              <p className="text-[10px] text-amber-800/80 dark:text-amber-300/70 font-medium">
                ⏳ Renovação mensal. Vencimento no último dia do mês corrente.
              </p>
            </div>

            {/* Saldo Acumulado de Compras */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1">
                  🟢 Pontos Acumulados (Compras)
                </span>
                <span className="font-black text-emerald-900 dark:text-emerald-200 text-sm">
                  {accumulated.toLocaleString('pt-BR')} pts
                </span>
              </div>
              <p className="text-[10px] text-emerald-800/80 dark:text-emerald-300/70 font-medium">
                📅 Validade estendida de 365 dias (12 meses a partir do ganho).
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <Link
              to="/cliente/catalogo"
              onClick={() => setOpen(false)}
              className="w-full py-2.5 px-4 bg-[#2196F3] hover:bg-blue-600 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <MdHistory className="w-4 h-4" />
              Resgatar Prêmios & Serviços
              <MdChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
