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
    { value: 'RELM CARE+', label: isPlus ? 'MEMBRO PLUS' : 'MEMBRO PADRÃO' },
    { value: user?.name?.toUpperCase() || 'CLIENTE', label: 'CONTA ATIVA' },
    { value: 'GARANTIA', label: 'COBERTURA TOTAL' },
  ];

  return (
    <div className="kinetic-portal relative flex min-h-screen bg-app dark:bg-app-dark transition-colors duration-300">
      <NoiseTexture />
      {isPlus && (
        <style>{`
          .text-primary, .text-primary-400, .text-primary-500, .text-primary-600, .border-l-primary-300 {
            color: #D4AF37 !important;
            border-color: #D4AF37 !important;
          }
          .btn-outline {
            border-color: #D4AF37 !important;
            color: #D4AF37 !important;
          }
          .btn-outline:hover {
            background-color: #D4AF37 !important;
            color: #ffffff !important;
          }
          .bg-primary, .btn-primary, .bg-primary-300, .bg-primary-500, .bg-primary-600 {
            background-color: #D4AF37 !important;
          }
          .hover\\:bg-primary-600:hover, .btn-primary:hover {
            background-color: #C5A028 !important;
          }
        `}</style>
      )}
      {/* Sidebar — Kinetic Brutalist (Solid Blue - No Gradient) */}
      <aside
        className={`${
          collapsed ? 'w-[70px]' : 'w-64'
        } bg-[#0d2137] text-white flex flex-col shrink-0 border-r-2 border-white/10 z-20 transition-[width] duration-300`}
      >
        {/* Logo + toggle */}
        <div
          className={`${
            collapsed ? 'px-2 justify-center' : 'px-6 justify-between'
          } py-5 border-b-2 border-white/10 min-h-[72px] flex items-center gap-2`}
        >
          {!collapsed && (
            <Link to="/" className="block">
              <img src="/logo-white.png" alt="Relm Care+" className="h-8 w-auto" />
            </Link>
          )}
          <button
            onClick={toggle}
            className="p-1.5 text-white/75 hover:bg-white/10 hover:text-white transition-colors shrink-0 rounded-none border border-white/20"
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? <MdChevronRight size={22} /> : <MdChevronLeft size={22} />}
          </button>
        </div>

        {/* User Info */}
        {!collapsed && (
          <div className="px-6 py-4 border-b-2 border-white/10 font-kinetic">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 border-2 border-white/30 bg-white/10 flex items-center justify-center text-white font-bold text-sm shrink-0 rounded-none">
                {user?.name?.charAt(0)?.toUpperCase() || 'C'}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-white uppercase tracking-tight truncate">{user?.name}</p>
                <p className="text-xs text-white/60 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Menu */}
        <nav className={`flex-1 overflow-y-auto py-4 ${collapsed ? 'px-2' : 'px-3'} space-y-1 font-kinetic`}>
          {MENU.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 ${
                  collapsed ? 'justify-center px-2' : 'px-3'
                } py-2.5 transition-all text-xs font-bold uppercase tracking-tight border-l-4 ${
                  active
                    ? 'bg-white/15 text-white border-l-primary-300 shadow-none'
                    : 'text-white/75 border-l-transparent hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon
                  size={20}
                  className={`shrink-0 ${active ? 'text-white' : 'text-white/65'}`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Rodapé */}
        <div className="border-t-2 border-white/10 font-kinetic">
          {!collapsed && (
            <div className="px-6 py-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/60">
              <span className="w-2 h-2 bg-success inline-block" />
              <span>Relm Care+ — v1</span>
            </div>
          )}
          <div className={`${collapsed ? 'px-2 pt-3' : 'px-3'} pb-4`}>
            <button
              onClick={logout}
              title={collapsed ? 'Sair' : undefined}
              className={`flex items-center gap-3 w-full ${
                collapsed ? 'justify-center px-2' : 'px-3'
              } py-2 text-white/75 hover:bg-white/15 hover:text-white transition-colors text-xs font-bold uppercase tracking-tight rounded-none border border-white/20`}
            >
              <MdLogout size={20} />
              {!collapsed && <span>Sair</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-auto min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b-2 border-gray-200 dark:border-slate-800 bg-surface dark:bg-surface-dark px-6 flex items-center justify-between shrink-0 transition-colors duration-300 font-kinetic">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500 dark:text-slate-400 font-bold">
            <span>Área do Cliente</span>
            <span>/</span>
            <span className="font-bold text-gray-800 dark:text-slate-200">
              {MENU.find((m) => m.path === location.pathname)?.label || 'Painel'}
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
        <StatsMarquee items={marqueeItems} speed={40} className="py-2.5 border-b-2 border-primary/20" />

        <div className="flex-1 bg-app dark:bg-app-dark transition-colors duration-300">
          <BannerCarousel {...getBannerTargetForPath(location.pathname)} />
          <Outlet />
        </div>
      </main>
      <WhatsAppFloatingButton />
    </div>
  );
}
