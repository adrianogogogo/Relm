import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Header() {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();

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
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="/logo-relm.png" 
              alt="Relm Bikes" 
              className="h-12 w-auto"
            />
          </Link>

          {/* Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg transition-all ${
                  isActive(item.path)
                    ? 'bg-white text-primary font-semibold'
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
                  className="hidden md:block px-4 py-2 rounded-lg bg-white text-primary font-semibold hover:bg-primary-50 transition-all"
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
            ) : (
              <Link
                to="/login"
                className="px-6 py-2 rounded-lg bg-white text-primary font-semibold hover:bg-primary-50 transition-all"
              >
                Entrar
              </Link>
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
                  ? 'bg-white text-primary font-semibold'
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
