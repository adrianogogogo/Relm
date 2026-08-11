import { useState } from 'react';
import {
  MdClose,
  MdVpnKey,
  MdVisibility,
  MdVisibilityOff,
  MdCheckCircle,
} from 'react-icons/md';
import { Button } from './ui';

/**
 * Modal reutilizável para o ADMIN_RELM redefinir a senha de qualquer usuário
 * (Customer, StoreUser). Não exige a senha atual — o admin define diretamente
 * a nova senha.
 *
 * Props:
 *  - title: título do modal (ex.: "Redefinir senha do cliente")
 *  - userName: nome do usuário-alvo (exibido como contexto)
 *  - onSubmit(password): função async que envia a nova senha ao backend
 *  - onClose: fecha o modal
 */
export default function AdminResetPasswordModal({
  title = 'Redefinir senha',
  userName,
  onSubmit,
  onClose,
}) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('A confirmação não corresponde à nova senha.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(newPassword);
      setSuccess(true);
      setTimeout(() => onClose?.(), 1500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Não foi possível redefinir a senha. Tente novamente.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass =
    'w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 pr-10 text-sm font-extrabold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-600 transition';

  const renderField = (label, value, setValue, show, setShow) => (
    <div>
      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="new-password"
          disabled={submitting || success}
          className={fieldClass}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          tabIndex={-1}
          aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          {show ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Redefinir senha"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose?.();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <MdVpnKey size={20} className="text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-base font-extrabold text-[#0A1929] dark:text-white">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => !submitting && onClose?.()}
            aria-label="Fechar"
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
          >
            <MdClose size={20} />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center text-center px-6 py-10">
            <MdCheckCircle size={44} className="text-success mb-3" />
            <p className="text-sm font-medium text-gray-700 dark:text-slate-200">
              Senha redefinida com sucesso.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
            {userName && (
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Definindo nova senha para{' '}
                <span className="font-semibold text-gray-700 dark:text-slate-200">
                  {userName}
                </span>
                .
              </p>
            )}

            {renderField('Nova senha', newPassword, setNewPassword, showNew, setShowNew)}
            {renderField(
              'Confirmar nova senha',
              confirmPassword,
              setConfirmPassword,
              showConfirm,
              setShowConfirm,
            )}

            <p className="text-xs text-gray-400 dark:text-slate-500">
              A nova senha deve ter no mínimo 6 caracteres.
            </p>

            {error && (
              <div className="rounded-lg bg-error/10 border border-error/30 px-3 py-2 text-sm text-error">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="text"
                color="secondary"
                onClick={() => onClose?.()}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Salvando…' : 'Salvar'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
