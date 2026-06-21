import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { MdPersonAdd, MdEdit, MdDelete, MdToggleOff, MdToggleOn, MdClose, MdVpnKey } from 'react-icons/md';
import { Card, PageHeader, StatusChip, Button } from '../components/ui';

const ROLES = [
  { value: 'ADMIN_RELM', label: 'Admin Relm' },
  { value: 'GERENTE_RELM', label: 'Gerente Relm' },
  { value: 'SUPORTE_RELM', label: 'Suporte Relm' },
  { value: 'LOJA', label: 'Loja' },
  { value: 'DISTRIBUIDOR', label: 'Distribuidor' },
];

// Cor (hex) por perfil — usada no StatusChip (fundo a 12%, texto cheio)
const ROLE_HEX = {
  ADMIN_RELM: '#F44336',
  GERENTE_RELM: '#FB8C00',
  SUPORTE_RELM: '#FF9800',
  LOJA: '#4CAF50',
  DISTRIBUIDOR: '#2196F3',
};

const EMPTY = { name: '', email: '', password: '', role: 'SUPORTE_RELM', storeId: '', distributorId: '' };

function useStores() {
  return useQuery({
    queryKey: ['admin-users-stores'],
    queryFn: () => api.get('/admin-users/stores').then((r) => r.data),
  });
}

function useDistributors() {
  return useQuery({
    queryKey: ['admin-users-distributors'],
    queryFn: () => api.get('/admin-users/distributors').then((r) => r.data),
  });
}

function LinkFields({ form, setForm, stores = [], distributors = [] }) {
  if (form.role === 'LOJA') {
    return (
      <div>
        <label className="label">Loja vinculada</label>
        <select className="input" value={form.storeId || ''} onChange={(e) => setForm({ ...form, storeId: e.target.value, distributorId: '' })}>
          <option value="">— Nenhuma —</option>
          {stores.map((s) => <option key={s.id} value={s.id}>{s.tradeName}</option>)}
        </select>
      </div>
    );
  }
  if (form.role === 'DISTRIBUIDOR') {
    return (
      <div>
        <label className="label">Distribuidor vinculado</label>
        <select className="input" value={form.distributorId || ''} onChange={(e) => setForm({ ...form, distributorId: e.target.value, storeId: '' })}>
          <option value="">— Nenhum —</option>
          {distributors.map((d) => <option key={d.id} value={d.id}>{d.tradeName}</option>)}
        </select>
      </div>
    );
  }
  return null;
}

function NewUserModal({ onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const { data: stores = [] } = useStores();
  const { data: distributors = [] } = useDistributors();

  const mutation = useMutation({
    mutationFn: (data) => api.post('/admin-users', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      onClose();
    },
    onError: (e) => setError(e.response?.data?.message || 'Erro ao criar usuário'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Senha mínima de 6 caracteres.'); return; }
    mutation.mutate({
      ...form,
      storeId: form.storeId || undefined,
      distributorId: form.distributorId || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-title text-lg font-bold text-gray-900 dark:text-slate-100">Novo Usuário do Sistema</h3>
          <button onClick={onClose}><MdClose className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200" /></button>
        </div>

        {error && <div className="bg-error/10 border-l-4 border-error text-error p-3 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nome</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">E-mail</label>
            <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label className="label">Senha inicial</label>
            <input type="password" className="input" placeholder="Mín. 6 caracteres" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <div>
            <label className="label">Perfil</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value, storeId: '', distributorId: '' })}>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <LinkFields form={form} setForm={setForm} stores={stores} distributors={distributors} />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-outline flex-1">Cancelar</button>
            <button type="submit" disabled={mutation.isPending} className="btn btn-primary flex-1">
              {mutation.isPending ? 'Criando...' : 'Criar usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditUserModal({ user: target, onClose }) {
  const queryClient = useQueryClient();
  const { data: stores = [] } = useStores();
  const { data: distributors = [] } = useDistributors();

  const [form, setForm] = useState({
    name: target.name,
    email: target.email,
    role: target.role,
    storeId: target.storeId || '',
    distributorId: target.distributorId || '',
    active: target.active,
  });
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('dados');

  const updateMutation = useMutation({
    mutationFn: (data) => api.patch(`/admin-users/${target.id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      onClose();
    },
    onError: (e) => setError(e.response?.data?.message || 'Erro ao salvar'),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (password) => api.patch(`/admin-users/${target.id}/reset-password`, { password }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      setNewPassword('');
      setShowPasswordField(false);
      setTab('dados');
    },
    onError: (e) => setError(e.response?.data?.message || 'Erro ao redefinir senha'),
  });

  const handleSave = (e) => {
    e.preventDefault();
    setError('');
    updateMutation.mutate({
      name: form.name,
      email: form.email,
      role: form.role,
      storeId: form.storeId || null,
      distributorId: form.distributorId || null,
      active: form.active,
    });
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) { setError('Senha mínima de 6 caracteres.'); return; }
    resetPasswordMutation.mutate(newPassword);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-title text-lg font-bold text-gray-900 dark:text-slate-100">Editar Usuário</h3>
            <p className="text-xs text-gray-400 dark:text-slate-500">{target.email}</p>
          </div>
          <button onClick={onClose}><MdClose className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200" /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 border-b border-gray-200 dark:border-slate-800">
          <button
            onClick={() => setTab('dados')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'dados' ? 'border-primary text-primary dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
          >
            Dados
          </button>
          <button
            onClick={() => setTab('senha')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'senha' ? 'border-primary text-primary dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
          >
            Senha
          </button>
        </div>

        {error && <div className="bg-error/10 border-l-4 border-error text-error p-3 rounded mb-4 text-sm">{error}</div>}

        {tab === 'dados' && (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="label">Nome</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label">Perfil</label>
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value, storeId: '', distributorId: '' })}>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <LinkFields form={form} setForm={setForm} stores={stores} distributors={distributors} />
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="active-edit"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
              />
              <label htmlFor="active-edit" className="text-sm text-gray-700 dark:text-slate-300">Usuário ativo</label>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn btn-outline flex-1">Cancelar</button>
              <button type="submit" disabled={updateMutation.isPending} className="btn btn-primary flex-1">
                {updateMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </form>
        )}

        {tab === 'senha' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Define uma nova senha para <span className="font-semibold text-gray-700 dark:text-slate-200">{target.name}</span>. O usuário precisará usar essa senha no próximo login.
            </p>
            <div>
              <label className="label">Nova senha</label>
              <input
                type="password"
                className="input"
                placeholder="Mín. 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn btn-outline flex-1">Cancelar</button>
              <button type="submit" disabled={resetPasswordMutation.isPending} className="btn btn-primary flex-1 flex items-center justify-center gap-2">
                <MdVpnKey size={14} />
                {resetPasswordMutation.isPending ? 'Redefinindo...' : 'Redefinir senha'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/admin-users').then((r) => r.data),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => api.patch(`/admin-users/${id}/toggle-active`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries(['admin-users']),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin-users/${id}`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries(['admin-users']),
  });

  const handleDelete = (u) => {
    if (!confirm(`Excluir permanentemente o usuário "${u.name}"? Esta ação não pode ser desfeita.`)) return;
    deleteMutation.mutate(u.id);
  };

  return (
    <div className="py-8 px-6">
      <div className="max-w-5xl mx-auto">
        <PageHeader
          title="Usuários do Sistema"
          subtitle={`${users.length} usuário(s) — acessos internos da equipe Relm`}
          action={
            <Button icon={MdPersonAdd} onClick={() => setShowNewModal(true)}>Novo Usuário</Button>
          }
        />

        {isLoading ? (
          <div className="text-center py-12 text-gray-400 dark:text-slate-500">Carregando...</div>
        ) : (
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/40 border-b border-gray-200 dark:border-slate-800 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">
                  <tr>
                    <th className="px-6 py-3 text-left">Usuário</th>
                    <th className="px-6 py-3 text-left">Perfil</th>
                    <th className="px-6 py-3 text-left">Vinculado a</th>
                    <th className="px-6 py-3 text-left">Cadastro</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {users.map((u) => (
                    <tr key={u.id} className={`hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors ${!u.active ? 'opacity-50' : ''}`}>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-800 dark:text-slate-100 text-sm">{u.name}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">{u.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <StatusChip
                          label={ROLES.find((r) => r.value === u.role)?.label || u.role}
                          color={ROLE_HEX[u.role]}
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">
                        {u.store?.tradeName || u.distributor?.tradeName || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400 dark:text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4">
                        <StatusChip
                          label={u.active ? 'Ativo' : 'Inativo'}
                          variant={u.active ? 'success' : 'neutral'}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* Editar */}
                          <button
                            onClick={() => setEditingUser(u)}
                            className="p-1.5 text-gray-400 hover:text-primary rounded transition-colors"
                            title="Editar usuário"
                          >
                            <MdEdit size={16} />
                          </button>

                          {/* Toggle ativo */}
                          {u.id !== user?.id && (
                            <button
                              onClick={() => toggleMutation.mutate(u.id)}
                              disabled={toggleMutation.isPending}
                              title={u.active ? 'Desativar' : 'Ativar'}
                              className="text-gray-400 hover:text-primary transition-colors"
                            >
                              {u.active
                                ? <MdToggleOn size={22} className="text-success" />
                                : <MdToggleOff size={22} />}
                            </button>
                          )}

                          {/* Excluir */}
                          {u.id !== user?.id && (
                            <button
                              onClick={() => handleDelete(u)}
                              disabled={deleteMutation.isPending}
                              className="p-1.5 text-gray-400 hover:text-error rounded transition-colors"
                              title="Excluir usuário"
                            >
                              <MdDelete size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/40 text-xs text-gray-400 dark:text-slate-500 border-t border-gray-200 dark:border-slate-800">
                {users.length} usuário{users.length !== 1 ? 's' : ''}
              </div>
            </div>
          </Card>
        )}
      </div>

      {showNewModal && <NewUserModal onClose={() => setShowNewModal(false)} />}
      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} />}
    </div>
  );
}
