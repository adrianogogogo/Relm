import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useThemeStore } from '../store/themeStore';
import { notificationsAPI } from '../services/api';
import ChangePasswordModal from './ChangePasswordModal';
import {
  MdLightMode,
  MdDarkMode,
  MdNotifications,
  MdNotificationsNone,
  MdPerson,
  MdLock,
  MdLogout,
  MdDoneAll,
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
 *  - enableNotifications: quando false, o sino fica estático/vazio e NÃO faz
 *    fetch (usado no portal do cliente, que não tem notificações no v1).
 */
export default function TopBarChrome({
  user,
  roleLabel,
  onLogout,
  profilePath,
  fallbackInitial = 'U',
  enableNotifications = true,
}) {
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const notifRef = useRef(null);
  const menuRef = useRef(null);

  // Contador de não-lidas com polling a cada 30s (somente quando habilitado).
  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationsAPI.unreadCount,
    enabled: enableNotifications,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    staleTime: 10000,
  });
  const unreadCount = unreadData?.count ?? 0;

  // Lista das notificações — só busca quando o dropdown está aberto.
  const { data: notifications = [], isLoading: notifLoading } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: notificationsAPI.list,
    enabled: enableNotifications && notifOpen,
    staleTime: 0,
  });

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

  const invalidateNotifications = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
    } catch {
      // best-effort: ignora erros de marcação
    } finally {
      invalidateNotifications();
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        await notificationsAPI.markRead(notification.id);
      } catch {
        // ignora — segue para a navegação
      }
      invalidateNotifications();
    }
    setNotifOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const relativeTime = (date) => {
    try {
      return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: ptBR,
      });
    } catch {
      return '';
    }
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() || fallbackInitial;
  const hasUnread = enableNotifications && unreadCount > 0;

  return (
    <div className="flex items-center gap-2">
      {/* Toggle de tema 3D Neumórfico */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded-xl bg-[#e0e5ec] dark:bg-[#1c2128] text-[#183757] dark:text-[#2196F3] shadow-[3px_3px_6px_#babecc,-3px_-3px_6px_#ffffff] dark:shadow-[3px_3px_6px_#12161b,-3px_-3px_6px_#262c35] active:translate-y-[2px] transition-all"
        title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
        aria-label="Alternar tema"
      >
        {theme === 'dark' ? <MdLightMode size={18} className="text-[#2196F3]" /> : <MdDarkMode size={18} className="text-[#183757]" />}
      </button>

      {/* Sino de notificações */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => {
            setNotifOpen((v) => !v);
            setMenuOpen(false);
          }}
          className="relative p-2 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 transition-all"
          title="Notificações"
          aria-label="Notificações"
          aria-haspopup="true"
          aria-expanded={notifOpen}
        >
          {hasUnread ? (
            <MdNotifications size={20} />
          ) : (
            <MdNotificationsNone size={20} />
          )}
          {hasUnread && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-error text-white text-[10px] font-bold leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 mt-2 w-80 rounded-xl border border-gray-200 dark:border-slate-700 bg-surface dark:bg-surface-dark shadow-lg z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                Notificações
              </p>
              {enableNotifications && notifications.length > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-300 hover:underline"
                >
                  <MdDoneAll size={14} />
                  Marcar todas como lidas
                </button>
              )}
            </div>

            {!enableNotifications || (!notifLoading && notifications.length === 0) ? (
              <div className="flex flex-col items-center justify-center text-center py-8 px-4">
                <MdNotificationsNone
                  size={36}
                  className="text-gray-300 dark:text-slate-600 mb-2"
                />
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Nenhuma notificação
                </p>
              </div>
            ) : notifLoading ? (
              <div className="py-8 text-center text-sm text-gray-500 dark:text-slate-400">
                Carregando…
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors ${
                      n.read ? '' : 'bg-primary-50/60 dark:bg-primary-900/20'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && (
                        <span className="mt-1.5 w-2 h-2 rounded-full bg-primary-600 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm truncate ${
                            n.read
                              ? 'text-gray-700 dark:text-slate-300'
                              : 'font-semibold text-gray-900 dark:text-slate-100'
                          }`}
                        >
                          {n.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2">
                          {n.message}
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
                          {relativeTime(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
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
          <div className="absolute right-0 mt-2 w-64 rounded-xl border border-gray-200 dark:border-slate-700 bg-surface dark:bg-surface-dark shadow-lg z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
              <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate">
                {user?.name || 'Usuário'}
              </p>
              {user?.email && (
                <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                  {user.email}
                </p>
              )}
              {roleLabel && (
                <span className="inline-block mt-2 rounded-full bg-gray-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:text-slate-300">
                  {roleLabel}
                </span>
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
                  setPwdModalOpen(true);
                }}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <MdLock size={18} />
                <span>Alterar Senha</span>
              </button>
              <div className="my-1 border-t border-gray-200 dark:border-slate-700" />
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

      {/* Modal de troca de senha */}
      {pwdModalOpen && (
        <ChangePasswordModal onClose={() => setPwdModalOpen(false)} />
      )}
    </div>
  );
}
