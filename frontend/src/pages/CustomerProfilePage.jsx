import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerPortalAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Card, PageHeader, Button } from '../components/ui';

export default function CustomerProfilePage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Profile Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Password Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['customer-profile'],
    queryFn: customerPortalAPI.getMe,
    onSuccess: (data) => {
      if (data) {
        setFullName(data.fullName || '');
        setPhone(data.phone || '');
        setAddress(data.address || '');
        setCity(data.city || '');
        setState(data.state || '');
        setZipCode(data.zipCode || '');
      }
    },
  });

  const data = profile || { fullName: user?.name, email: user?.email };

  // Sync state with loaded data once when editing starts
  const startEditing = () => {
    setFullName(data.fullName || '');
    setPhone(data.phone || '');
    setAddress(data.address || '');
    setCity(data.city || '');
    setState(data.state || '');
    setZipCode(data.zipCode || '');
    setProfileError('');
    setProfileSuccess('');
    setIsEditing(true);
  };

  const updateProfileMutation = useMutation({
    mutationFn: customerPortalAPI.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries(['customer-profile']);
      setProfileSuccess('Perfil atualizado com sucesso!');
      setProfileError('');
      setTimeout(() => {
        setIsEditing(false);
        setProfileSuccess('');
      }, 2000);
    },
    onError: (err) => {
      setProfileError(err?.response?.data?.message || 'Erro ao atualizar perfil.');
      setProfileSuccess('');
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: customerPortalAPI.updatePassword,
    onSuccess: () => {
      setPasswordSuccess('Senha atualizada com sucesso!');
      setPasswordError('');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setIsChangingPassword(false);
        setPasswordSuccess('');
      }, 2000);
    },
    onError: (err) => {
      setPasswordError(err?.response?.data?.message || 'Erro ao atualizar senha.');
      setPasswordSuccess('');
    },
  });

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setProfileError('O nome completo não pode ser vazio.');
      return;
    }
    if (!phone.trim()) {
      setProfileError('O telefone não pode ser vazio.');
      return;
    }
    updateProfileMutation.mutate({
      fullName,
      phone,
      address,
      city,
      state,
      zipCode,
    });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('A nova senha e a confirmação não coincidem.');
      return;
    }
    updatePasswordMutation.mutate({
      oldPassword,
      newPassword,
    });
  };

  const fields = [
    { label: 'Nome completo', value: data?.fullName },
    { label: 'E-mail', value: data?.email },
    { label: 'Telefone', value: data?.phone },
    { label: 'CPF', value: data?.cpf || '—' },
    { label: 'Endereço', value: data?.address || '—' },
    { label: 'Cidade', value: data?.city || '—' },
    { label: 'Estado', value: data?.state || '—' },
    { label: 'CEP', value: data?.zipCode || '—' },
  ];

  return (
    <div className="py-8 px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader title="Meu Perfil" subtitle="Seus dados cadastrais na Relm Care+" />

        {isLoading ? (
          <div className="flex justify-center py-16">
            <span className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {/* CARD DE INFORMAÇÕES DE PERFIL */}
            <Card>
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100 dark:border-slate-800/60">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 dark:bg-primary-400/15 flex items-center justify-center text-2xl font-bold text-primary dark:text-primary-400 shrink-0">
                    {data?.fullName?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-bold text-gray-800 dark:text-slate-100 truncate">{data?.fullName}</p>
                    <p className="text-gray-500 dark:text-slate-400 text-sm truncate">{data?.email}</p>
                  </div>
                </div>
                {!isEditing && (
                  <Button variant="outline" onClick={startEditing}>
                    Editar Perfil
                  </Button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  {profileError && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded text-sm font-medium">
                      {profileError}
                    </div>
                  )}
                  {profileSuccess && (
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 rounded text-sm font-medium">
                      {profileSuccess}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nome Completo *</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Telefone *</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Endereço</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Cidade</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Estado</label>
                        <input
                          type="text"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">CEP</label>
                        <input
                          type="text"
                          value={zipCode}
                          onChange={(e) => setZipCode(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-4 border-t border-gray-100 dark:border-slate-800/60">
                    <Button variant="ghost" type="button" onClick={() => setIsEditing(false)} disabled={updateProfileMutation.isLoading}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={updateProfileMutation.isLoading}>
                      {updateProfileMutation.isLoading ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {fields.map((f) => (
                    <div key={f.label}>
                      <p className="text-xs text-gray-400 dark:text-slate-500 uppercase font-semibold mb-1">{f.label}</p>
                      <p className="text-gray-800 dark:text-slate-200">{f.value || '—'}</p>
                    </div>
                  ))}
                </div>
              )}

              {data?.createdAt && !isEditing && (
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-6 pt-4 border-t border-gray-100 dark:border-slate-800/60">
                  Cliente desde {new Date(data.createdAt).toLocaleDateString('pt-BR')}
                </p>
              )}
            </Card>

            {/* SEÇÃO ALTERAR SENHA */}
            <Card>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800/60 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-slate-200">Segurança da Conta</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Gerencie sua senha de acesso</p>
                </div>
                {!isChangingPassword && (
                  <Button variant="outline" onClick={() => setIsChangingPassword(true)}>
                    Alterar Senha
                  </Button>
                )}
              </div>

              {isChangingPassword && (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  {passwordError && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded text-sm font-medium">
                      {passwordError}
                    </div>
                  )}
                  {passwordSuccess && (
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 rounded text-sm font-medium">
                      {passwordSuccess}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Senha Atual</label>
                      <input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nova Senha</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Confirmar Nova Senha</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-4 border-t border-gray-100 dark:border-slate-800/60">
                    <Button variant="ghost" type="button" onClick={() => setIsChangingPassword(false)} disabled={updatePasswordMutation.isLoading}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={updatePasswordMutation.isLoading}>
                      {updatePasswordMutation.isLoading ? 'Salvando...' : 'Salvar Nova Senha'}
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
