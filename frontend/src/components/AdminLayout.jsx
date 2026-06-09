import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import {
  LayoutDashboard,
  Shield,
  Users,
  Store,
  CalendarDays,
  Gift,
  FileText,
  Image,
  LogOut,
  UserCog,
  ClipboardList,
  Sun,
  Moon,
} from 'lucide-react';

const MENU_ITEMS = [
  {
    path: '/admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
    exact: true,
    roles: ['ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA', 'DISTRIBUIDOR'],
  },
  {
    path: '/admin/warranties',
    label: 'Garantias',
    icon: Shield,
    roles: ['ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA'],
  },
  {
    path: '/admin/customers',
    label: 'Clientes',
    icon: Users,
    roles: ['ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA', 'DISTRIBUIDOR'],
  },
  {
    path: '/admin/stores',
    label: 'Lojas',
    icon: Store,
    roles: ['ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA', 'DISTRIBUIDOR'],
  },
  {
    path: '/admin/events',
    label: 'Eventos',
    icon: CalendarDays,
    roles: ['ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM'],
  },
  {
    path: '/admin/benefits',
    label: 'Benefícios',
    icon: Gift,
    roles: ['ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM'],
  },
  {
    path: '/admin/insurances',
    label: 'Cotações de Seguro',
    icon: FileText,
    roles: ['ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA'],
  },
  {
    path: '/admin/banners',
    label: 'Banners',
    icon: Image,
    roles: ['ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM'],
  },
  {
    path: '/admin/users',
    label: 'Usuários do Sistema',
    icon: UserCog,
    roles: ['ADMIN_RELM'],
  },
  {
    path: '/admin/audit-logs',
    label: 'Logs de Auditoria',
    icon: ClipboardList,
    roles: ['ADMIN_RELM'],
  },
];

export default function AdminLayout() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const visibleItems = MENU_ITEMS.filter((item) =>
    item.roles.includes(user?.role)
  );

  const isActive = (item) =>
    item.exact
      ? location.pathname === item.path
      : location.pathname.startsWith(item.path);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-primary dark:bg-slate-900 text-white flex flex-col shadow-xl shrink-0 border-r dark:border-slate-800/50">
        {/* Logo */}
        <div className="p-6 border-b border-primary-600 dark:border-slate-800">
          <Link to="/" className="bg-white bg-white-always rounded-xl px-3 py-1.5 block">
            <img src="/logo-relm.png" alt="Relm Care+" className="h-8 w-auto" />
          </Link>
        </div>

        {/* User Info */}
        <div className="px-6 py-4 border-b border-primary-600 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-white truncate">{user?.name}</p>
              <p className="text-xs text-primary-200 dark:text-slate-400 truncate">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto py-4">
          {visibleItems.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-6 py-3 transition-all text-sm border-l-4 ${
                  active
                    ? 'bg-white/10 text-white font-semibold border-l-secondary'
                    : 'text-primary-200 dark:text-slate-400 border-l-transparent hover:bg-white/5 hover:text-white dark:hover:bg-slate-800/50 dark:hover:text-slate-100'
                }`}
              >
                <item.icon size={18} className="shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-primary-600 dark:border-slate-800">
          <button
            onClick={logout}
            className="flex items-center space-x-3 w-full px-4 py-2 rounded-lg text-white hover:bg-primary-600 dark:hover:bg-slate-800/50 transition-colors text-sm"
          >
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-auto">
        <header className="h-16 border-b border-gray-200 dark:border-slate-800/50 bg-white dark:bg-slate-900 px-6 flex items-center justify-between shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
            <span>Área Administrativa</span>
            <span>/</span>
            <span className="font-semibold text-gray-800 dark:text-slate-200">
              {MENU_ITEMS.find((m) => isActive(m))?.label || 'Painel'}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 transition-all"
              title="Alternar Tema"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        <div className="flex-1 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
