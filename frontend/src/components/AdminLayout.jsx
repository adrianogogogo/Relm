import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
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

  const visibleItems = MENU_ITEMS.filter((item) =>
    item.roles.includes(user?.role)
  );

  const isActive = (item) =>
    item.exact
      ? location.pathname === item.path
      : location.pathname.startsWith(item.path);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-white flex flex-col shadow-xl shrink-0">
        {/* Logo */}
        <div className="p-6 border-b border-primary-600">
          <Link to="/" className="flex items-center space-x-3">
            <div className="bg-white rounded-full p-2">
              <span className="text-primary text-xl font-bold leading-none">R</span>
            </div>
            <div>
              <p className="font-bold text-white text-base leading-tight">RELM BIKES</p>
              <p className="text-xs text-primary-200">Care+ Admin</p>
            </div>
          </Link>
        </div>

        {/* User Info */}
        <div className="px-6 py-4 border-b border-primary-600">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-white truncate">{user?.name}</p>
              <p className="text-xs text-primary-200 truncate">{user?.role}</p>
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
                className={`flex items-center space-x-3 px-6 py-3 transition-colors text-sm ${
                  active
                    ? 'bg-white text-primary font-semibold'
                    : 'text-white hover:bg-primary-600'
                }`}
              >
                <item.icon size={18} className="shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-primary-600">
          <button
            onClick={logout}
            className="flex items-center space-x-3 w-full px-4 py-2 rounded-lg text-white hover:bg-primary-600 transition-colors text-sm"
          >
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
