import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { UserPlus, Pencil, Trash2, ToggleLeft, ToggleRight, X, KeyRound } from 'lucide-react';

const ROLES = [
  { value: 'ADMIN_RELM', label: 'Admin Relm' },
  { value: 'GERENTE_RELM', label: 'Gerente Relm' },
  { value: 'SUPORTE_RELM', label: 'Suporte Relm' },
  { value: 'LOJA', label: 'Loja' },
  { value: 'DISTRIBUIDOR', label: 'Distribuidor' },
];

const ROLE_COLOR = {
  ADMIN_RELM: 'bg-red-100 text-red-800',
  GERENTE_RELM: 'bg-orange-100 text-orange-800',
  SUPORTE_RELM: 'bg-yellow-100 text-yellow-800',
  LOJA: 'bg-green-100 text-green-800',
  DISTRIBUIDOR: 'bg-blue-100 text-blue-800',
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
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold">Novo Usuário do Sistema</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
        </div>

        {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

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
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-bold">Editar Usuário</h3>
            <p className="text-xs text-gray-400">{target.email}</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 border-b">
          <button
            onClick={() => setTab('dados')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'dados' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Dados
          </button>
          <button
            onClick={() => setTab('senha')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'senha' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Senha
          </button>
        </div>

        {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

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
                className="rounded border-gray-300 h-4 w-4"
              />
              <label htmlFor="active-edit" className="text-sm text-gray-700">Usuário ativo</label>
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
            <p className="text-sm text-gray-500">
              Define uma nova senha para <span className="font-semibold text-gray-700">{target.name}</span>. O usuário precisará usar essa senha no próximo login.
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
                <KeyRound size={14} />
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
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Usuários do Sistema</h1>
            <p className="text-gray-500 text-sm mt-1">Gerencie os acessos internos da equipe Relm</p>
          </div>
          <button onClick={() => setShowNewModal(true)} className="btn btn-primary flex items-center gap-2">
            <UserPlus size={16} /> Novo Usuário
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Carregando...</div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-3 text-left">Usuário</th>
                  <th className="px-6 py-3 text-left">Perfil</th>
                  <th className="px-6 py-3 text-left">Vinculado a</th>
                  <th className="px-6 py-3 text-left">Cadastro</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className={`hover:bg-gray-50 ${!u.active ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-800 text-sm">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${ROLE_COLOR[u.role] || 'bg-gray-100 text-gray-700'}`}>
                        {ROLES.find((r) => r.value === u.role)?.label || u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {u.store?.tradeName || u.distributor?.tradeName || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${u.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {u.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* Editar */}
                        <button
                          onClick={() => setEditingUser(u)}
                          className="p-1.5 text-gray-400 hover:text-primary rounded transition-colors"
                          title="Editar usuário"
                        >
                          <Pencil size={16} />
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
                              ? <ToggleRight size={22} className="text-green-500" />
                              : <ToggleLeft size={22} />}
                          </button>
                        )}

                        {/* Excluir */}
                        {u.id !== user?.id && (
                          <button
                            onClick={() => handleDelete(u)}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                            title="Excluir usuário"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-3 bg-gray-50 text-xs text-gray-400 border-t">
              {users.length} usuário{users.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>

      {showNewModal && <NewUserModal onClose={() => setShowNewModal(false)} />}
      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} />}
    </div>
  );
}
