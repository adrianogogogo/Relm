import { Link, Outlet, useLocation } from 'react-router-dom';
import { useCustomerAuthStore } from '../store/customerAuthStore';
import { Shield, CalendarDays, Gift, FileText, User, LogOut, LayoutDashboard } from 'lucide-react';

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

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-primary text-white flex flex-col shadow-xl shrink-0">
        <div className="p-6 border-b border-primary-600">
          <Link to="/">
            <img src="/logo-relm.png" alt="Relm Care+" className="h-9 brightness-0 invert" />
          </Link>
        </div>

        <div className="px-6 py-4 border-b border-primary-600">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {customer?.fullName?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-white truncate">{customer?.fullName}</p>
              <p className="text-xs text-primary-200 truncate">{customer?.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {MENU.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-6 py-3 transition-colors text-sm ${
                  active ? 'bg-white text-primary font-semibold' : 'text-white hover:bg-primary-600'
                }`}
              >
                <item.icon size={18} className="shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

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

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
