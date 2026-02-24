import { Link, useLocation, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Shield, 
  Users, 
  Store, 
  Calendar,
  FileText,
  ImageIcon,
  LogOut
} from 'lucide-react';

export default function AdminLayout() {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/warranties', label: 'Garantias', icon: Shield },
    { path: '/admin/customers', label: 'Clientes', icon: Users },
    { path: '/admin/stores', label: 'Lojas', icon: Store },
    { path: '/admin/banners', label: 'Banners', icon: ImageIcon },
    { path: '/admin/events', label: 'Eventos', icon: Calendar },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-white flex flex-col shadow-xl">
        {/* Logo */}
        <div className="p-6 border-b border-primary-600">
          <Link to="/" className="flex items-center space-x-3">
            <img src="/logo-relm.png" alt="RELM" className="h-12 w-auto" />
          </Link>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-primary-600">
          <p className="font-semibold text-sm">{user?.name || 'Admin'}</p>
          <p className="text-xs text-primary-200">{user?.role || 'ADMIN_RELM'}</p>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-6 py-3 transition-colors ${
                  isActive(item.path)
                    ? 'bg-white text-primary font-semibold'
                    : 'text-white hover:bg-primary-600'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-primary-600">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-2 rounded-lg text-white hover:bg-primary-600 transition-colors"
          >
            <LogOut size={20} />
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
