import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { authAPI } from '../services/api';
import { Card, PageHeader, Button } from '../components/ui';
import { MdSave, MdCheckCircle } from 'react-icons/md';

/**
 * Perfil do usuário da equipe Relm / distribuidor (tabela User).
 * Permite editar nome e e-mail. Cargo é somente leitura (privilégio).
 * A troca de senha fica no menu do avatar (TopBarChrome → ChangePasswordModal).
 */
export default function AdminProfilePage() {
  const { user, setUser } = useAuthStore();

  const [form, setForm] = useState({ name: '', email: '' });
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) setForm({ name: user.name || '', email: user.email || '' });
  }, [user]);

  const mutation = useMutation({
    mutationFn: (data) => authAPI.updateProfile(data),
    onSuccess: (updated) => {
      setUser({ ...user, name: updated.name, email: updated.email });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    },
    onError: (err) =>
      alert(`Erro ao salvar perfil: ${err.response?.data?.message || err.message}`),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      alert('Nome e e-mail são obrigatórios.');
      return;
    }
    mutation.mutate({ name: form.name.trim(), email: form.email.trim() });
  };

  return (
    <div className="py-8 px-6">
      <div className="max-w-2xl mx-auto">
        <PageHeader title="Meu Perfil" subtitle="Seus dados de acesso na Relm Care+" />

        <Card>
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-slate-800/60">
            <div className="w-16 h-16 rounded-full bg-primary/10 dark:bg-primary-400/15 flex items-center justify-center text-2xl font-bold text-primary dark:text-primary-400 shrink-0">
              {form.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-gray-800 dark:text-slate-100 truncate">{form.name}</p>
              <p className="text-gray-500 dark:text-slate-400 text-sm truncate">{user?.role}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-xs text-gray-400 dark:text-slate-500 uppercase font-semibold mb-1">
                Nome
              </label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="input"
                placeholder="Seu nome"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs text-gray-400 dark:text-slate-500 uppercase font-semibold mb-1">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="input"
                placeholder="voce@relmbikes.com.br"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 dark:text-slate-500 uppercase font-semibold mb-1">
                Cargo
              </label>
              <p className="text-gray-800 dark:text-slate-200">{user?.role || '—'}</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={mutation.isPending} className="flex items-center gap-2">
                <MdSave className="h-4 w-4" />
                {mutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
              {success && (
                <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  <MdCheckCircle className="h-4 w-4" /> Perfil atualizado!
                </span>
              )}
            </div>
          </form>

          <p className="text-xs text-gray-400 dark:text-slate-500 mt-6 pt-4 border-t border-gray-100 dark:border-slate-800/60">
            Para alterar sua senha, use o menu do avatar no topo da tela → “Alterar Senha”.
          </p>
        </Card>
      </div>
    </div>
  );
}
