import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { MdLightMode, MdDarkMode } from 'react-icons/md';

export default function Header() {
  const location = useLocation();
  const { isAuthenticated, user, logout, getDashboardPath } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const navItems = [
    { path: '/', label: 'Início' },
    { path: '/garantia', label: 'Garantia' },
    { path: '/vantagens', label: 'Vantagens' },
    { path: '/eventos', label: 'Eventos' },
    { path: '/seguro', label: 'Seguro' },
    { path: '/newsletter', label: 'Newsletter' },
  ];

  const isActive = (path) => location.pathname === path;

  // Barra superior Azul Marinho (#0A1929) que destaca o logo branco da Relm Care+.
  const navBtn = (active) =>
    active
      ? 'bg-[#2196F3] text-white shadow-[3px_3px_6px_rgba(33,150,243,0.35)] translate-y-[1px]'
      : 'bg-[#0A1929] text-[#e2e8f0] shadow-[3px_3px_6px_#050c14,-3px_-3px_6px_#10263e] hover:text-white hover:bg-[#10263e]';

  return (
    <header className="bg-[#0A1929] border-b border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.45)] sticky top-0 z-50 font-sans">
      <nav className="container mx-auto px-4 py-3.5">
        <div className="flex items-center justify-between gap-4">
          {/* Logo branco + LED Status */}
          <div className="flex items-center gap-3">
            <Link to="/" className="block shrink-0">
              <img src="/logo-white.png" alt="Relm Care+" className="h-9 w-auto" />
            </Link>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#050c14] shadow-[inset_1px_1px_3px_#02060a,inset_-1px_-1px_3px_#10263e] font-mono text-[10px] font-bold text-[#94a3b8]">
              <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
              <span>SYS ONLINE</span>
            </div>
          </div>

          {/* Navigation — Teclas 3D Neumórficas Navy */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-150 ${navBtn(isActive(item.path))}`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Auth buttons + Theme Toggle */}
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-[#0A1929] text-[#2196F3] shadow-[3px_3px_6px_#050c14,-3px_-3px_6px_#10263e] active:translate-y-[2px] transition-all"
              title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? <MdLightMode size={18} className="text-[#2196F3]" /> : <MdDarkMode size={18} className="text-[#2196F3]" />}
            </button>
            {isAuthenticated ? (
              <>
                <Link
                  to={getDashboardPath()}
                  className="px-4 py-2 rounded-xl bg-[#2196F3] text-white text-xs font-bold uppercase tracking-wider shadow-[3px_3px_6px_rgba(33,150,243,0.35)] active:translate-y-[2px] transition-all"
                >
                  Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="px-4 py-2 rounded-xl bg-[#0A1929] text-[#e2e8f0] text-xs font-bold uppercase tracking-wider shadow-[3px_3px_6px_#050c14,-3px_-3px_6px_#10263e] hover:text-white active:translate-y-[2px] transition-all"
                >
                  Sair
                </button>
                <div className="hidden lg:block text-[#e2e8f0] text-right font-mono">
                  <p className="font-bold text-xs uppercase tracking-tight">{user?.name}</p>
                  <p className="text-[10px] text-[#94a3b8]">{user?.userType}</p>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="px-4.5 py-2 rounded-xl bg-[#2196F3] text-white text-xs font-bold uppercase tracking-wider shadow-[3px_3px_6px_rgba(33,150,243,0.35)] active:translate-y-[2px] transition-all"
                >
                  Entrar
                </Link>
                <Link
                  to="/cliente/cadastro"
                  className="px-4 py-2 rounded-xl bg-[#0A1929] text-[#e2e8f0] text-xs font-bold uppercase tracking-wider shadow-[3px_3px_6px_#050c14,-3px_-3px_6px_#10263e] hover:text-white active:translate-y-[2px] transition-all"
                >
                  Criar conta
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden mt-3 flex flex-wrap gap-2 pt-2 border-t border-white/10">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${navBtn(isActive(item.path))}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
