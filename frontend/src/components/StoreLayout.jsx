import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSidebarStore } from '../store/sidebarStore';
import TopBarChrome from './TopBarChrome';
import BannerCarousel from './BannerCarousel';
import { getBannerTargetForPath } from '../config/bannerTargets';
import { bgForPath } from '../config/cyclingBackgrounds';
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

import { useQuery } from '@tanstack/react-query';
import { storesAPI } from '../services/api';

const MENU = [
  { path: '/loja/dashboard', label: 'Início', icon: MdDashboard },
  { path: '/loja/clientes', label: 'Clientes', icon: MdPeople },
  { path: '/loja/vendas', label: 'Cadastrar Venda', icon: MdPointOfSale },
  { path: '/loja/vendas-lista', label: 'Minhas Vendas', icon: MdReceiptLong },
  { path: '/loja/pagamentos', label: 'Pagamentos (Anuidade)', icon: MdPayments },
  { path: '/loja/oficina', label: 'Oficina & Conveniências', icon: MdBuild },
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

  // Consulta dinamica dos dados atualizados da propria loja
  const { data: ownStore } = useQuery({
    queryKey: ['own-store-profile'],
    queryFn: () => storesAPI.getOwnProfile().catch(() => null),
    staleTime: 30000,
  });

  const activeStore = ownStore || user?.store;
  const storeLogoUrl = activeStore?.logoUrl || user?.store?.logoUrl;
  const storeTradeName = activeStore?.tradeName || user?.store?.tradeName || user?.name || 'MINHA LOJA';

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
      {/* Sidebar — Painel de Controle Industrial Neumórfico (Chassis Midnight Navy #0A1929) */}
      <aside
        className={`${
          collapsed ? 'w-[76px]' : 'w-64'
        } bg-[#0A1929] text-[#f0f2f5] flex flex-col shrink-0 border-r border-[#1e293b] shadow-[8px_0_16px_rgba(5,12,20,0.5)] z-20 transition-[width] duration-300`}
      >
        {/* Logo + toggle + Status LED */}
        <div
          className={`${
            collapsed ? 'px-2 justify-center' : 'px-5 justify-between'
          } py-4 border-b border-[#1e293b] min-h-[72px] flex items-center gap-2`}
        >
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Link to="/" className="block">
                <img src="/logo-white.png" alt="Relm Care+" className="h-8 w-auto filter brightness-100 invert-0" />
              </Link>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#050c14] shadow-[inset_1px_1px_3px_#02060a,inset_-1px_-1px_3px_#10263e]">
                <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                <span className="font-mono text-[10px] font-bold text-[#94a3b8]">STORE</span>
              </div>
            </div>
          )}
          <button
            onClick={toggle}
            className="p-2 text-[#94a3b8] hover:text-[#2196F3] transition-colors shrink-0 rounded-xl bg-[#0A1929] shadow-[3px_3px_6px_#050c14,-3px_-3px_6px_#10263e] active:shadow-[inset_2px_2px_4px_#050c14,inset_-2px_-2px_4px_#10263e]"
            title={collapsed ? 'Expandir painel' : 'Recolher painel'}
            aria-label={collapsed ? 'Expandir painel' : 'Recolher painel'}
          >
            {collapsed ? <MdChevronRight size={20} /> : <MdChevronLeft size={20} />}
          </button>
        </div>

        {/* User Info Housing - Card com Logo Grande da Marca (64x64px) */}
        {!collapsed ? (
          <div className="mx-3 my-3 p-3.5 rounded-2xl bg-[#071320] shadow-[inset_3px_3px_6px_#03080e,inset_-3px_-3px_6px_#0e243c] border border-white/10 font-mono">
            <div className="flex items-center gap-3.5">
              <Link
                to="/loja/perfil"
                title="Editar Logo e Perfil da Loja"
                className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-[#2196F3] font-black text-2xl shrink-0 overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.35),0_0_12px_rgba(33,150,243,0.3)] border-2 border-white/80 p-1 group relative transition-transform hover:scale-105"
              >
                {storeLogoUrl ? (
                  <img
                    src={storeLogoUrl}
                    alt={storeTradeName}
                    className="w-full h-full object-contain"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <span className="font-extrabold text-2xl tracking-tighter text-[#2196F3]">
                    {storeTradeName?.charAt(0)?.toUpperCase() || 'L'}
                  </span>
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-xs text-white uppercase tracking-tight truncate leading-tight">
                  {storeTradeName}
                </p>
                <p className="text-[11px] text-[#94a3b8] truncate font-medium mt-0.5">
                  {activeStore?.email || user?.email || 'contato@loja.com'}
                </p>
                <Link
                  to="/loja/perfil"
                  className="inline-flex items-center gap-1 text-[10px] text-[#2196F3] hover:text-white font-bold tracking-wider uppercase mt-1 transition-colors"
                >
                  <span>EDITAR PERFIL</span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="my-3 flex justify-center">
            <Link
              to="/loja/perfil"
              title={storeTradeName}
              className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#2196F3] font-bold text-base shrink-0 overflow-hidden shadow-[0_0_10px_rgba(33,150,243,0.4)] p-0.5 border border-white/80 transition-transform hover:scale-105"
            >
              {storeLogoUrl ? (
                <img
                  src={storeLogoUrl}
                  alt={storeTradeName}
                  className="w-full h-full object-contain"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                storeTradeName?.charAt(0)?.toUpperCase() || 'L'
              )}
            </Link>
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
                className={`group flex items-center gap-3 ${
                  collapsed ? 'justify-center px-2' : 'px-3.5'
                } py-2.5 rounded-xl transition-all text-xs font-bold uppercase tracking-wider ${
                  active
                    ? 'bg-[#2196F3] text-white shadow-[3px_3px_6px_rgba(33,150,243,0.35)] translate-y-[1px]'
                    : 'bg-[#0A1929] text-[#e2e8f0] shadow-[4px_4px_8px_#050c14,-4px_-4px_8px_#10263e] hover:text-white hover:bg-[#10263e] hover:shadow-[6px_6px_10px_#050c14,-6px_-6px_10px_#10263e]'
                }`}
              >
                <item.icon
                  size={18}
                  className={`shrink-0 ${active ? 'text-white' : 'text-[#94a3b8] group-hover:text-white'}`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Rodapé: Telemetria & Interruptor de Saída */}
        <div className="border-t border-[#1e293b] p-3 font-mono">
          {!collapsed && (
            <div className="px-3 py-2 mb-2 flex items-center justify-between text-[10px] text-[#94a3b8] font-bold rounded-lg bg-[#050c14] shadow-[inset_1px_1px_3px_#02060a]">
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
            } py-2.5 text-[#2196F3] font-bold uppercase tracking-wider text-xs rounded-xl bg-[#0A1929] shadow-[3px_3px_6px_#050c14,-3px_-3px_6px_#10263e] hover:shadow-[5px_5px_8px_#050c14,-5px_-5px_8px_#10263e] active:translate-y-[2px] transition-all`}
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

        <div className="relative flex-1 bg-[#e0e5ec] dark:bg-[#1c2128] p-4 md:p-6">
          {/* Fundo real de ciclismo, translucido, atras do conteudo da pagina */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-[0.08] dark:opacity-[0.13]"
            style={{ backgroundImage: `url(${bgForPath(location.pathname)})` }}
          />
          <div className="relative z-10">
            <BannerCarousel {...getBannerTargetForPath(location.pathname)} />
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
