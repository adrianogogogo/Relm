import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCustomerAuthStore } from '../store/customerAuthStore';

export default function Header() {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { isAuthenticated: isCustomerAuth } = useCustomerAuthStore();

  const navItems = [
    { path: '/', label: 'Início' },
    { path: '/garantia', label: 'Garantia' },
    { path: '/vantagens', label: 'Vantagens' },
    { path: '/eventos', label: 'Eventos' },
    { path: '/seguro', label: 'Seguro' },
    { path: '/newsletter', label: 'Newsletter' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-primary shadow-lg sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="bg-white bg-white-always rounded-xl px-3 py-1.5 block shrink-0">
            <img src="/logo-relm.png" alt="Relm Care+" className="h-9 w-auto" />
          </Link>

          {/* Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg transition-all ${
                  isActive(item.path)
                    ? 'bg-header-active font-semibold'
                    : 'text-white hover:bg-primary-600'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Auth buttons */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/admin"
                  className="hidden md:block px-4 py-2 rounded-lg bg-header-active font-semibold hover:bg-primary-50 dark:hover:bg-secondary-600 transition-all"
                >
                  Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="px-4 py-2 rounded-lg border-2 border-white text-white hover:bg-white hover:text-primary transition-all font-semibold"
                >
                  Sair
                </button>
                <div className="hidden md:block text-white text-sm">
                  <p className="font-semibold">{user?.name}</p>
                  <p className="text-xs text-primary-100">{user?.role}</p>
                </div>
              </>
            ) : isCustomerAuth ? (
              <Link
                to="/cliente/dashboard"
                className="px-6 py-2 rounded-lg bg-header-active font-semibold hover:bg-primary-50 dark:hover:bg-secondary-600 transition-all"
              >
                Minha Conta
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/cliente/login"
                  className="px-4 py-2 rounded-lg bg-header-active font-semibold hover:bg-primary-50 dark:hover:bg-secondary-600 transition-all text-sm"
                >
                  Sou Cliente
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg border-2 border-white text-white font-semibold hover:bg-header-active transition-all text-sm"
                >
                  Equipe Relm
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden mt-4 flex flex-wrap gap-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-1 rounded-lg text-sm transition-all ${
                isActive(item.path)
                  ? 'bg-header-active font-semibold'
                  : 'text-white hover:bg-primary-600'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
