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

  return (
    <header className="bg-[#e0e5ec] dark:bg-[#1c2128] border-b border-[#babecc]/50 dark:border-white/10 shadow-[0_4px_12px_#babecc] dark:shadow-[0_4px_12px_#12161b] sticky top-0 z-50 font-sans transition-colors duration-300">
      <nav className="container mx-auto px-4 py-3.5">
        <div className="flex items-center justify-between gap-4">
          {/* Logo + LED Status */}
          <div className="flex items-center gap-3">
            <Link to="/" className="block shrink-0">
              <img src="/logo-white.png" alt="Relm Care+" className="h-9 w-auto filter invert brightness-0 dark:invert-0 dark:brightness-100" />
            </Link>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#d1d9e6] dark:bg-[#12161b] shadow-[inset_1px_1px_3px_#babecc,inset_-1px_-1px_3px_#ffffff] dark:shadow-[inset_1px_1px_3px_#0e1114,inset_-1px_-1px_3px_#242b35] font-mono text-[10px] font-bold text-[#4a5568] dark:text-[#a0aec0]">
              <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
              <span>SYS ONLINE</span>
            </div>
          </div>

          {/* Navigation — Teclas 3D Neumórficas */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
                    active
                      ? 'bg-[#183757] dark:bg-[#2196F3] text-white shadow-[3px_3px_6px_rgba(24,55,87,0.35),-2px_-2px_4px_rgba(255,255,255,0.6)] dark:shadow-[3px_3px_6px_rgba(33,150,243,0.35)] translate-y-[1px]'
                      : 'bg-[#e0e5ec] dark:bg-[#1c2128] text-[#4a5568] dark:text-[#a0aec0] shadow-[3px_3px_6px_#babecc,-3px_-3px_6px_#ffffff] dark:shadow-[3px_3px_6px_#12161b,-3px_-3px_6px_#262c35] hover:text-[#183757] dark:hover:text-[#2196F3]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Auth buttons + Theme Toggle */}
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-[#e0e5ec] dark:bg-[#1c2128] text-[#183757] dark:text-[#2196F3] shadow-[3px_3px_6px_#babecc,-3px_-3px_6px_#ffffff] dark:shadow-[3px_3px_6px_#12161b,-3px_-3px_6px_#262c35] active:translate-y-[2px] transition-all"
              title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? <MdLightMode size={18} className="text-[#2196F3]" /> : <MdDarkMode size={18} className="text-[#183757]" />}
            </button>
            {isAuthenticated ? (
              <>
                <Link
                  to={getDashboardPath()}
                  className="px-4 py-2 rounded-xl bg-[#183757] text-white text-xs font-bold uppercase tracking-wider shadow-[3px_3px_6px_rgba(24,55,87,0.35),-2px_-2px_4px_rgba(255,255,255,0.6)] active:translate-y-[2px] transition-all"
                >
                  Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="px-4 py-2 rounded-xl bg-[#e0e5ec] text-[#183757] text-xs font-bold uppercase tracking-wider shadow-[3px_3px_6px_#babecc,-3px_-3px_6px_#ffffff] hover:shadow-[5px_5px_8px_#babecc,-5px_-5px_8px_#ffffff] active:translate-y-[2px] transition-all"
                >
                  Sair
                </button>
                <div className="hidden lg:block text-[#2d3436] text-right font-mono">
                  <p className="font-bold text-xs uppercase tracking-tight">{user?.name}</p>
                  <p className="text-[10px] text-[#4a5568]">{user?.userType}</p>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="px-4.5 py-2 rounded-xl bg-[#183757] text-white text-xs font-bold uppercase tracking-wider shadow-[3px_3px_6px_rgba(24,55,87,0.35),-2px_-2px_4px_rgba(255,255,255,0.6)] active:translate-y-[2px] transition-all"
                >
                  Entrar
                </Link>
                <Link
                  to="/cliente/cadastro"
                  className="px-4 py-2 rounded-xl bg-[#e0e5ec] text-[#2d3436] text-xs font-bold uppercase tracking-wider shadow-[3px_3px_6px_#babecc,-3px_-3px_6px_#ffffff] hover:text-[#183757] hover:shadow-[5px_5px_8px_#babecc,-5px_-5px_8px_#ffffff] active:translate-y-[2px] transition-all"
                >
                  Criar conta
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden mt-3 flex flex-wrap gap-2 pt-2 border-t border-[#babecc]/40">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                  active
                    ? 'bg-[#183757] text-white shadow-[2px_2px_4px_rgba(24,55,87,0.35)]'
                    : 'bg-[#e0e5ec] text-[#4a5568] shadow-[2px_2px_4px_#babecc,-2px_-2px_4px_#ffffff]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
