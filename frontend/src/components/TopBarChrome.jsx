import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useThemeStore } from '../store/themeStore';
import {
  MdLightMode,
  MdDarkMode,
  MdNotificationsNone,
  MdPerson,
  MdLogout,
} from 'react-icons/md';

/**
 * Cluster do topo à direita (§8.2), compartilhado pelos 3 portais.
 * Ordem: toggle de tema · sino de notificações · avatar do usuário.
 *
 * Props:
 *  - user: objeto do usuário logado ({ name, role, email, ... })
 *  - roleLabel: texto do papel/role a exibir no menu do avatar
 *  - onLogout: callback de logout (reaproveita o do layout/store)
 *  - profilePath: rota de "Meu Perfil" (opcional; só exibe quando definido)
 *  - fallbackInitial: inicial usada quando não há nome ('A' | 'C' | 'L')
 */
export default function TopBarChrome({
  user,
  roleLabel,
  onLogout,
  profilePath,
  fallbackInitial = 'U',
}) {
  const { theme, toggleTheme } = useThemeStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const notifRef = useRef(null);
  const menuRef = useRef(null);

  // Fecha os dropdowns ao clicar fora.
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initial = user?.name?.charAt(0)?.toUpperCase() || fallbackInitial;

  return (
    <div className="flex items-center gap-2">
      {/* Toggle de tema */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 transition-all"
        title="Alternar tema"
        aria-label="Alternar tema"
      >
        {theme === 'dark' ? <MdLightMode size={20} /> : <MdDarkMode size={20} />}
      </button>

      {/* Sino de notificações */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => {
            setNotifOpen((v) => !v);
            setMenuOpen(false);
          }}
          className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 transition-all"
          title="Notificações"
          aria-label="Notificações"
          aria-haspopup="true"
          aria-expanded={notifOpen}
        >
          <MdNotificationsNone size={20} />
        </button>

        {notifOpen && (
          <div className="absolute right-0 mt-2 w-72 rounded-xl border border-gray-200 dark:border-slate-700 bg-surface dark:bg-surface-dark shadow-lg z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
              <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                Notificações
              </p>
            </div>
            <div className="flex flex-col items-center justify-center text-center py-8 px-4">
              <MdNotificationsNone
                size={36}
                className="text-gray-300 dark:text-slate-600 mb-2"
              />
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Nenhuma notificação
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Avatar do usuário */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => {
            setMenuOpen((v) => !v);
            setNotifOpen(false);
          }}
          className="w-9 h-9 rounded-full bg-primary-600 hover:bg-primary-700 flex items-center justify-center text-white font-bold text-sm transition-colors"
          title={user?.name || 'Usuário'}
          aria-label="Menu do usuário"
          aria-haspopup="true"
          aria-expanded={menuOpen}
        >
          {initial}
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 dark:border-slate-700 bg-surface dark:bg-surface-dark shadow-lg z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
              <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate">
                {user?.name || 'Usuário'}
              </p>
              {roleLabel && (
                <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                  {roleLabel}
                </p>
              )}
            </div>
            <div className="py-1">
              {profilePath && (
                <Link
                  to={profilePath}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <MdPerson size={18} />
                  <span>Meu Perfil</span>
                </Link>
              )}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onLogout?.();
                }}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-error hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <MdLogout size={18} />
                <span>Sair</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
