import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSidebarStore } from '../store/sidebarStore';
import TopBarChrome from './TopBarChrome';
import BannerCarousel from './BannerCarousel';
import { getBannerTargetForPath } from '../config/bannerTargets';
import { NoiseTexture, StatsMarquee } from './ui/kinetic';
import {
  MdDashboard,
  MdPeople,
  MdDescription,
  MdInventory2,
  MdEvent,
  MdCardGiftcard,
  MdLogout,
  MdChevronLeft,
  MdChevronRight,
  MdBuild,
  MdPayments,
  MdPointOfSale,
  MdReceiptLong,
} from 'react-icons/md';

const MENU = [
  { path: '/loja/dashboard', label: 'Início', icon: MdDashboard },
  { path: '/loja/clientes', label: 'Clientes', icon: MdPeople },
  { path: '/loja/vendas', label: 'Cadastrar Venda', icon: MdPointOfSale },
  { path: '/loja/vendas-lista', label: 'Minhas Vendas', icon: MdReceiptLong },
  { path: '/loja/pagamentos', label: 'Pagamentos (Anuidade)', icon: MdPayments },
  { path: '/loja/oficina', label: 'Oficina / Serviços', icon: MdBuild },
  { path: '/loja/seguros', label: 'Cotações de Seguro', icon: MdDescription },
  { path: '/loja/produtos', label: 'Produtos', icon: MdInventory2 },
  { path: '/loja/eventos', label: 'Eventos', icon: MdEvent },
  { path: '/loja/beneficios', label: 'Benefícios', icon: MdCardGiftcard },
];

export default function StoreLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { collapsed, toggle } = useSidebarStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname.startsWith(path);

  const marqueeItems = [
    { value: user?.store?.tradeName?.toUpperCase() || 'LOJA PARCEIRA', label: 'PORTAL LOJISTA' },
    { value: 'SISTEMA DE VENDAS', label: 'PAINEL ATIVO' },
    { value: 'GARANTIA RELM', label: 'GESTÃO UNIFICADA' },
  ];

  return (
    <div className="kinetic-portal relative flex min-h-screen bg-[#e0e5ec] dark:bg-[#1c2128] text-[#2d3436] dark:text-[#f0f2f5] transition-colors duration-300">
      <NoiseTexture />
      {/* Sidebar — Painel de Controle Industrial Neumórfico (Chassis Level 0) */}
      <aside
        className={`${
          collapsed ? 'w-[76px]' : 'w-64'
        } bg-[#e0e5ec] dark:bg-[#1c2128] text-[#2d3436] dark:text-[#f0f2f5] flex flex-col shrink-0 border-r border-white/60 dark:border-white/10 shadow-[8px_0_16px_#babecc] dark:shadow-[8px_0_16px_#12161b] z-20 transition-[width] duration-300`}
      >
        {/* Logo + toggle + Status LED */}
        <div
          className={`${
            collapsed ? 'px-2 justify-center' : 'px-5 justify-between'
          } py-4 border-b border-[#babecc]/40 dark:border-white/10 min-h-[72px] flex items-center gap-2`}
        >
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Link to="/" className="block">
                <img src="/logo-white.png" alt="Relm Care+" className="h-8 w-auto filter invert brightness-0 dark:invert-0 dark:brightness-100" />
              </Link>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#d1d9e6] dark:bg-[#12161b] shadow-[inset_1px_1px_3px_#babecc,inset_-1px_-1px_3px_#ffffff] dark:shadow-[inset_1px_1px_3px_#0e1114,inset_-1px_-1px_3px_#242b35]">
                <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                <span className="font-mono text-[10px] font-bold text-[#4a5568] dark:text-[#a0aec0]">STORE</span>
              </div>
            </div>
          )}
          <button
            onClick={toggle}
            className="p-2 text-[#4a5568] dark:text-[#a0aec0] hover:text-[#183757] dark:hover:text-[#2196F3] transition-colors shrink-0 rounded-xl bg-[#e0e5ec] dark:bg-[#1c2128] shadow-[3px_3px_6px_#babecc,-3px_-3px_6px_#ffffff] dark:shadow-[3px_3px_6px_#12161b,-3px_-3px_6px_#262c35] active:shadow-[inset_2px_2px_4px_#babecc,inset_-2px_-2px_4px_#ffffff]"
            title={collapsed ? 'Expandir painel' : 'Recolher painel'}
            aria-label={collapsed ? 'Expandir painel' : 'Recolher painel'}
          >
            {collapsed ? <MdChevronRight size={20} /> : <MdChevronLeft size={20} />}
          </button>
        </div>

        {/* User Info Housing */}
        {!collapsed && (
          <div className="mx-3 my-3 p-3 rounded-xl bg-[#e0e5ec] dark:bg-[#1c2128] shadow-[inset_3px_3px_6px_#babecc,inset_-3px_-3px_6px_#ffffff] dark:shadow-[inset_3px_3px_6px_#12161b,inset_-3px_-3px_6px_#262c35] border border-white/40 dark:border-white/10 font-mono">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#183757] dark:bg-[#2196F3] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-[2px_2px_4px_rgba(24,55,87,0.4)]">
                {user?.name?.charAt(0)?.toUpperCase() || 'L'}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs text-[#2d3436] dark:text-[#f0f2f5] uppercase tracking-tight truncate">{user?.name}</p>
                <p className="text-[10px] text-[#4a5568] dark:text-[#a0aec0] truncate font-medium">
                  {user?.store?.tradeName || user?.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Menu — Teclas Mecânicas 3D Empilhadas */}
        <nav className={`flex-1 overflow-y-auto py-3 ${collapsed ? 'px-2' : 'px-3'} space-y-2 font-sans`}>
          {MENU.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 ${
                  collapsed ? 'justify-center px-2' : 'px-3.5'
                } py-2.5 rounded-xl transition-all text-xs font-bold uppercase tracking-wider ${
                  active
                    ? 'bg-[#183757] dark:bg-[#2196F3] text-white shadow-[3px_3px_6px_rgba(24,55,87,0.35),-2px_-2px_4px_rgba(255,255,255,0.6)] dark:shadow-[3px_3px_6px_rgba(33,150,243,0.35)] translate-y-[1px]'
                    : 'bg-[#e0e5ec] dark:bg-[#1c2128] text-[#4a5568] dark:text-[#a0aec0] shadow-[4px_4px_8px_#babecc,-4px_-4px_8px_#ffffff] dark:shadow-[4px_4px_8px_#12161b,-4px_-4px_8px_#262c35] hover:text-[#183757] dark:hover:text-[#2196F3]'
                }`}
              >
                <item.icon
                  size={18}
                  className={`shrink-0 ${active ? 'text-white' : 'text-[#4a5568] dark:text-[#a0aec0] group-hover:text-[#183757] dark:group-hover:text-[#2196F3]'}`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Rodapé: Telemetria & Interruptor de Saída */}
        <div className="border-t border-[#babecc]/40 dark:border-white/10 p-3 font-mono">
          {!collapsed && (
            <div className="px-3 py-2 mb-2 flex items-center justify-between text-[10px] text-[#4a5568] dark:text-[#a0aec0] font-bold rounded-lg bg-[#d1d9e6]/50 dark:bg-[#12161b] shadow-[inset_1px_1px_3px_#babecc] dark:shadow-[inset_1px_1px_3px_#0e1114]">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                <span>STORE PANEL SYS</span>
              </span>
              <span>v1.0</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            title={collapsed ? 'Sair' : undefined}
            className={`flex items-center gap-3 w-full ${
              collapsed ? 'justify-center px-2' : 'px-3.5'
            } py-2.5 text-[#183757] dark:text-[#2196F3] font-bold uppercase tracking-wider text-xs rounded-xl bg-[#e0e5ec] dark:bg-[#1c2128] shadow-[3px_3px_6px_#babecc,-3px_-3px_6px_#ffffff] dark:shadow-[3px_3px_6px_#12161b,-3px_-3px_6px_#262c35] hover:shadow-[5px_5px_8px_#babecc,-5px_-5px_8px_#ffffff] active:translate-y-[2px] transition-all`}
          >
            <MdLogout size={18} />
            {!collapsed && <span>DESCONECTAR</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-auto min-w-0 bg-[#e0e5ec] dark:bg-[#1c2128] relative z-10">
        {/* Topbar Industrial */}
        <header className="h-16 border-b border-[#babecc]/40 dark:border-white/10 bg-[#e0e5ec] dark:bg-[#1c2128] px-6 flex items-center justify-between shrink-0 transition-colors duration-300 font-mono shadow-[0_4px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#4a5568] dark:text-[#a0aec0] font-bold">
            <span>PORTAL LOJA</span>
            <span>///</span>
            <span className="font-bold text-[#183757] dark:text-[#2196F3]">
              {MENU.find((m) => isActive(m.path))?.label || 'PAINEL'}
            </span>
          </div>

          <TopBarChrome
            user={user}
            roleLabel={user?.store?.tradeName || 'Loja'}
            onLogout={handleLogout}
            profilePath="/loja/perfil"
            fallbackInitial="L"
          />
        </header>

        {/* Layout Top Marquee */}
        <div className="px-6 pt-4">
          <StatsMarquee items={marqueeItems} speed={40} />
        </div>

        <div className="flex-1 bg-[#e0e5ec] dark:bg-[#1c2128] p-4 md:p-6">
          <BannerCarousel {...getBannerTargetForPath(location.pathname)} />
          <Outlet />
        </div>
      </main>
    </div>
  );
}
