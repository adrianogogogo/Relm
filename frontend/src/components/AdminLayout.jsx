import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  Store,
  Calendar,
  Newspaper,
  Shield,
  LogOut,
  ImageIcon,
} from 'lucide-react';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/warranties', label: 'Garantias', icon: ShieldCheck },
    { path: '/admin/customers', label: 'Clientes', icon: Users },
    { path: '/admin/stores', label: 'Lojas', icon: Store },
    { path: '/admin/banners', label: 'Banners', icon: ImageIcon },
    { path: '/admin/events', label: 'Eventos', icon: Calendar },
    { path: '/admin/insurance', label: 'Seguros', icon: Shield },
    { path: '/newsletter', label: 'Newsletter', icon: Newspaper },
  ];

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white flex flex-col shadow-2xl">
        {/* Logo */}
        <div className="p-6 border-b border-blue-700">
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="/logo-relm.png" 
              alt="RELM Bikes" 
              className="h-12 w-auto"
              onError={(e) => {
                // Fallback if image doesn't load
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
            <div className="flex items-center space-x-2" style={{ display: 'none' }}>
              <div className="bg-white rounded-full p-2">
                <span className="text-blue-900 text-xl font-bold">R</span>
              </div>
              <div>
                <h1 className="text-lg font-bold">RELM BIKES</h1>
                <p className="text-xs text-blue-300">Care+ Admin</p>
              </div>
            </div>
          </Link>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-blue-700 bg-blue-800/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-lg font-semibold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name || 'Usuário'}</p>
              <p className="text-xs text-blue-300 truncate">{user?.role || 'Admin'}</p>
            </div>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-6 py-3 transition-all ${
                  active
                    ? 'bg-white text-blue-900 font-semibold border-r-4 border-blue-600'
                    : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-blue-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-all shadow-lg"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
