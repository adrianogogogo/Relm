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
    <div className="kinetic-portal relative flex min-h-screen bg-app dark:bg-app-dark transition-colors duration-300">
      <NoiseTexture />
      {/* Sidebar — Kinetic Brutalist */}
      <aside
        className={`${
          collapsed ? 'w-[70px]' : 'w-64'
        } bg-sidebar-gradient text-white flex flex-col shrink-0 border-r-2 border-white/10 z-20 transition-[width] duration-300`}
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
                {user?.name?.charAt(0)?.toUpperCase() || 'L'}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-white uppercase tracking-tight truncate">{user?.name}</p>
                <p className="text-xs text-white/60 truncate">
                  {user?.store?.tradeName || user?.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Menu */}
        <nav className={`flex-1 overflow-y-auto py-4 ${collapsed ? 'px-2' : 'px-3'} space-y-1 font-kinetic`}>
          {MENU.map((item) => {
            const active = isActive(item.path);
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
              onClick={handleLogout}
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
            <span>Portal da Loja</span>
            <span>/</span>
            <span className="font-bold text-gray-800 dark:text-slate-200">
              {MENU.find((m) => isActive(m.path))?.label || 'Painel'}
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
        <StatsMarquee items={marqueeItems} speed={40} className="py-2.5 border-b-2 border-primary/20" />

        <div className="flex-1 bg-app dark:bg-app-dark transition-colors duration-300">
          <BannerCarousel {...getBannerTargetForPath(location.pathname)} />
          <Outlet />
        </div>
      </main>
    </div>
  );
}
