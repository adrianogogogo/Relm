import { Link, Outlet, useLocation } from 'react-router-dom';
import { useCustomerAuthStore } from '../store/customerAuthStore';
import { useThemeStore } from '../store/themeStore';
import { Shield, CalendarDays, Gift, FileText, User, LogOut, LayoutDashboard, Sun, Moon } from 'lucide-react';

const MENU = [
  { path: '/cliente/dashboard', label: 'Início', icon: LayoutDashboard },
  { path: '/cliente/garantias', label: 'Minhas Garantias', icon: Shield },
  { path: '/cliente/eventos', label: 'Meus Eventos', icon: CalendarDays },
  { path: '/cliente/vantagens', label: 'Vantagens', icon: Gift },
  { path: '/cliente/seguros', label: 'Cotações de Seguro', icon: FileText },
  { path: '/cliente/perfil', label: 'Meu Perfil', icon: User },
];

export default function CustomerLayout() {
  const location = useLocation();
  const { customer, logout } = useCustomerAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  return (
    <div className="flex min-h-screen bg-app dark:bg-app-dark transition-colors duration-300">
      {/* Sidebar — §8.1: gradiente vertical #0d2137 → #1a3a5c, largura fixa 260px */}
      <aside className="w-64 bg-sidebar-gradient text-white flex flex-col shrink-0 shadow-[4px_0_20px_rgba(0,0,0,0.15)] z-20">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10 min-h-[72px] flex items-center">
          <Link to="/" className="bg-white bg-white-always rounded-xl px-3 py-1.5 block">
            <img src="/logo-relm.png" alt="Relm Care+" className="h-8 w-auto" />
          </Link>
        </div>

        {/* User Info */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {customer?.fullName?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-white truncate">{customer?.fullName}</p>
              <p className="text-xs text-white/60 truncate">{customer?.email}</p>
            </div>
          </div>
        </div>

        {/* Menu — item ativo destacado com bg-white/10 + realce primary, inativos translúcidos */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {MENU.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm border-l-4 ${
                  active
                    ? 'bg-white/10 text-white font-semibold border-l-primary-300'
                    : 'text-white/75 font-normal border-l-transparent hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon
                  size={18}
                  className={`shrink-0 ${active ? 'text-white' : 'text-white/65'}`}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Rodapé: versão + logout */}
        <div className="border-t border-white/10">
          <div className="px-6 py-3 flex items-center gap-2 text-xs text-white/60">
            <span className="w-2 h-2 rounded-full bg-success inline-block" />
            <span>Relm Care+ — v1</span>
          </div>
          <div className="px-3 pb-4">
            <button
              onClick={logout}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-white/75 hover:bg-white/10 hover:text-white transition-colors text-sm"
            >
              <LogOut size={18} />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-auto min-w-0">
        {/* Topbar — §8.2: fundo claro/surface, border-b, sem sombra */}
        <header className="h-16 border-b border-gray-200 dark:border-slate-800/60 bg-surface dark:bg-surface-dark px-6 flex items-center justify-between shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
            <span>Área do Cliente</span>
            <span>/</span>
            <span className="font-semibold text-gray-800 dark:text-slate-200">
              {MENU.find((m) => m.path === location.pathname)?.label || 'Painel'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 transition-all"
              title="Alternar Tema"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        <div className="flex-1 bg-app dark:bg-app-dark transition-colors duration-300">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
