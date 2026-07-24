import { Link, Outlet, useLocation } from 'react-router-dom';
import WhatsAppFloatingButton from './WhatsAppFloatingButton';
import { useAuthStore } from '../store/authStore';
import { useSidebarStore } from '../store/sidebarStore';
import TopBarChrome from './TopBarChrome';
import BannerCarousel from './BannerCarousel';
import { getBannerTargetForPath } from '../config/bannerTargets';
import { NoiseTexture, StatsMarquee } from './ui/kinetic';
import {
  MdDashboard,
  MdEvent,
  MdCardGiftcard,
  MdDescription,
  MdPerson,
  MdLogout,
  MdChevronLeft,
  MdChevronRight,
  MdBuild,
  MdWorkspacePremium,
  MdEmojiEvents,
  MdStorefront,
  MdShoppingBag,
} from 'react-icons/md';

const MENU = [
  { path: '/cliente/dashboard', label: 'Início', icon: MdDashboard },
  { path: '/cliente/compras', label: 'Minhas Compras', icon: MdShoppingBag },
  { path: '/cliente/assinatura', label: 'Minha Assinatura', icon: MdWorkspacePremium },
  { path: '/cliente/oficina', label: 'Oficina / Revisões', icon: MdBuild },
  { path: '/cliente/resgate', label: 'Resgatar Prêmios', icon: MdCardGiftcard },
  { path: '/cliente/eventos', label: 'Meus Eventos', icon: MdEvent },
  { path: '/cliente/vantagens', label: 'Vantagens', icon: MdCardGiftcard },
  { path: '/cliente/seguros', label: 'Cotações de Seguro', icon: MdDescription },
  { path: '/cliente/ranking', label: 'Ranking', icon: MdEmojiEvents },
  { path: '/cliente/parcerias', label: 'Parcerias', icon: MdStorefront },
  { path: '/cliente/perfil', label: 'Meu Perfil', icon: MdPerson },
];

export default function CustomerLayout() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { collapsed, toggle } = useSidebarStore();
  const isPlus = user?.currentTier === 'PLUS';

  const marqueeItems = [
    { value: 'RELM CARE+', label: isPlus ? 'MÓDULO PLUS ATIVO' : 'SISTEMA PADRÃO' },
    { value: user?.name?.toUpperCase() || 'CLIENTE', label: 'OPERACIONAL' },
    { value: 'GARANTIA', label: 'TELEMETRIA OK' },
  ];

  return (
    <div className="kinetic-portal relative flex min-h-screen bg-[#e0e5ec] text-[#2d3436] transition-colors duration-300">
      <NoiseTexture />
      {/* Sidebar — Painel de Controle Industrial Neumórfico (Chassis Level 0) */}
      <aside
        className={`${
          collapsed ? 'w-[76px]' : 'w-64'
        } bg-[#e0e5ec] text-[#2d3436] flex flex-col shrink-0 border-r border-white/60 shadow-[8px_0_16px_#babecc] z-20 transition-[width] duration-300`}
      >
        {/* Logo + toggle + Status LED */}
        <div
          className={`${
            collapsed ? 'px-2 justify-center' : 'px-5 justify-between'
          } py-4 border-b border-[#babecc]/40 min-h-[72px] flex items-center gap-2`}
        >
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Link to="/" className="block">
                <img src="/logo-white.png" alt="Relm Care+" className="h-8 w-auto filter invert brightness-0" />
              </Link>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#d1d9e6] shadow-[inset_1px_1px_3px_#babecc,inset_-1px_-1px_3px_#ffffff]">
                <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                <span className="font-mono text-[10px] font-bold text-[#4a5568]">PWR</span>
              </div>
            </div>
          )}
          <button
            onClick={toggle}
            className="p-2 text-[#4a5568] hover:text-[#ff4757] transition-colors shrink-0 rounded-xl bg-[#e0e5ec] shadow-[3px_3px_6px_#babecc,-3px_-3px_6px_#ffffff] active:shadow-[inset_2px_2px_4px_#babecc,inset_-2px_-2px_4px_#ffffff]"
            title={collapsed ? 'Expandir painel' : 'Recolher painel'}
            aria-label={collapsed ? 'Expandir painel' : 'Recolher painel'}
          >
            {collapsed ? <MdChevronRight size={20} /> : <MdChevronLeft size={20} />}
          </button>
        </div>

        {/* User Info Housing */}
        {!collapsed && (
          <div className="mx-3 my-3 p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_3px_3px_6px_#babecc,inset_-3px_-3px_6px_#ffffff] border border-white/40 font-mono">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#ff4757] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-[2px_2px_4px_rgba(166,50,60,0.4)]">
                {user?.name?.charAt(0)?.toUpperCase() || 'C'}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs text-[#2d3436] uppercase tracking-tight truncate">{user?.name}</p>
                <p className="text-[10px] text-[#4a5568] truncate font-medium">{user?.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Menu — Teclas Mecânicas 3D Empilhadas */}
        <nav className={`flex-1 overflow-y-auto py-3 ${collapsed ? 'px-2' : 'px-3'} space-y-2 font-sans`}>
          {MENU.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 ${
                  collapsed ? 'justify-center px-2' : 'px-3.5'
                } py-2.5 rounded-xl transition-all text-xs font-bold uppercase tracking-wider ${
                  active
                    ? 'bg-[#ff4757] text-white shadow-[3px_3px_6px_rgba(166,50,60,0.35),-2px_-2px_4px_rgba(255,255,255,0.6)] translate-y-[1px]'
                    : 'bg-[#e0e5ec] text-[#4a5568] shadow-[4px_4px_8px_#babecc,-4px_-4px_8px_#ffffff] hover:text-[#ff4757] hover:shadow-[6px_6px_10px_#babecc,-6px_-6px_10px_#ffffff]'
                }`}
              >
                <item.icon
                  size={18}
                  className={`shrink-0 ${active ? 'text-white' : 'text-[#4a5568] group-hover:text-[#ff4757]'}`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Rodapé: Telemetria & Interruptor de Saída */}
        <div className="border-t border-[#babecc]/40 p-3 font-mono">
          {!collapsed && (
            <div className="px-3 py-2 mb-2 flex items-center justify-between text-[10px] text-[#4a5568] font-bold rounded-lg bg-[#d1d9e6]/50 shadow-[inset_1px_1px_3px_#babecc]">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                <span>RELM CARE+ SYS</span>
              </span>
              <span>v1.0</span>
            </div>
          )}
          <button
            onClick={logout}
            title={collapsed ? 'Sair' : undefined}
            className={`flex items-center gap-3 w-full ${
              collapsed ? 'justify-center px-2' : 'px-3.5'
            } py-2.5 text-[#ff4757] font-bold uppercase tracking-wider text-xs rounded-xl bg-[#e0e5ec] shadow-[3px_3px_6px_#babecc,-3px_-3px_6px_#ffffff] hover:shadow-[5px_5px_8px_#babecc,-5px_-5px_8px_#ffffff] active:translate-y-[2px] active:shadow-[inset_3px_3px_6px_#babecc,inset_-3px_-3px_6px_#ffffff] transition-all`}
          >
            <MdLogout size={18} />
            {!collapsed && <span>DESCONECTAR</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-auto min-w-0 bg-[#e0e5ec]">
        {/* Topbar Industrial */}
        <header className="h-16 border-b border-[#babecc]/40 bg-[#e0e5ec] px-6 flex items-center justify-between shrink-0 transition-colors duration-300 font-mono shadow-[0_4px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#4a5568] font-bold">
            <span>PAINEL CLIENTE</span>
            <span>///</span>
            <span className="font-bold text-[#ff4757]">
              {MENU.find((m) => m.path === location.pathname)?.label || 'PAINEL'}
            </span>
          </div>

          <TopBarChrome
            user={user}
            roleLabel="Cliente"
            onLogout={logout}
            profilePath="/cliente/perfil"
            fallbackInitial="C"
            enableNotifications={false}
          />
        </header>

        {/* Layout Top Marquee */}
        <div className="px-6 pt-4">
          <StatsMarquee items={marqueeItems} speed={40} />
        </div>

        <div className="flex-1 bg-[#e0e5ec] p-4 md:p-6">
          <BannerCarousel {...getBannerTargetForPath(location.pathname)} />
          <Outlet />
        </div>
      </main>
      <WhatsAppFloatingButton />
    </div>
  );
}
