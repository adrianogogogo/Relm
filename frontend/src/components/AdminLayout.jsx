import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isAdmin = user?.role === 'ADMIN_RELM' || user?.role === 'GERENTE_RELM';
  const isStore = user?.role === 'LOJA';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Menu items baseado no role
  const menuItems = [
    {
      title: 'Dashboard',
      icon: '📊',
      path: '/admin',
      roles: ['ADMIN_RELM', 'GERENTE_RELM', 'LOJA'],
    },
    {
      title: 'Clientes',
      icon: '👥',
      path: '/admin/customers',
      roles: ['ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA'],
    },
    {
      title: 'Lojas',
      icon: '🏪',
      path: '/admin/stores',
      roles: ['ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'DISTRIBUIDOR'],
    },
    {
      title: 'Eventos',
      icon: '📅',
      path: '/admin/events',
      roles: ['ADMIN_RELM', 'GERENTE_RELM', 'LOJA'],
    },
    {
      title: 'Memberships',
      icon: '💎',
      path: '/admin/memberships',
      roles: ['ADMIN_RELM', 'GERENTE_RELM'],
    },
    {
      title: 'Garantias',
      icon: '🛡️',
      path: '/admin/warranties',
      roles: ['ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA'],
    },
    {
      title: 'Relatórios',
      icon: '📈',
      path: '/admin/reports',
      roles: ['ADMIN_RELM', 'GERENTE_RELM'],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* SIDEBAR */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gray-900 text-white transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            {sidebarOpen ? (
              <h1 className="text-2xl font-bold">Relm Admin</h1>
            ) : (
              <span className="text-2xl">🚴</span>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white"
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4">
          {filteredMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                isActive(item.path)
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span className="font-medium">{item.title}</span>}
            </Link>
          ))}
        </nav>

        {/* User Info */}
        <div className="border-t border-gray-800 p-4">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                {user?.email?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <p className="text-xs text-gray-400">{user?.role}</p>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold mx-auto mb-4">
              {user?.email?.[0]?.toUpperCase()}
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            <span>🚪</span>
            {sidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {isAdmin ? 'Painel Administrativo' : 'Painel da Loja'}
              </h2>
              <p className="text-sm text-gray-600">
                Bem-vindo(a), {user?.email}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Badge do role */}
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isAdmin
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {user?.role}
              </span>
              {/* Link para o site público */}
              <Link
                to="/"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                🌐 Ver Site Público
              </Link>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
