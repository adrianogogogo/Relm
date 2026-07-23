import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerPortalAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import {
  KineticCard,
  KineticPageHeader,
  KineticStatCard,
  KineticButton,
  KineticInput,
  StatsMarquee,
  NoiseTexture,
  AnimatedSection,
} from '../components/ui/kinetic';
import { MdLock, MdShoppingCart, MdVerifiedUser, MdCalendarToday } from 'react-icons/md';

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

  // Derive stats for marquee
  const memberSince = data?.createdAt
    ? new Date(data.createdAt).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' })
    : null;

  const marqueeItems = [
    { value: data?.totalPurchases || '0', label: 'Compras' },
    { value: data?.activeWarranties || '0', label: 'Garantias Ativas' },
    ...(memberSince ? [{ value: memberSince, label: 'Cliente Desde' }] : []),
    { value: data?.points || '0', label: 'Pontos' },
  ];

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
    <div className="relative min-h-screen">
      {/* Noise texture overlay */}
      <NoiseTexture />

      <div className="py-8 px-4 md:px-8">
        <div className="max-w-[90vw] lg:max-w-5xl mx-auto space-y-0">

          {/* ── KINETIC PAGE HEADER ── */}
          <AnimatedSection className="mb-2">
            <KineticPageHeader
              name={data?.fullName || 'Meu Perfil'}
              subtitle={data?.email}
              badge={
                data?.createdAt
                  ? `Cliente desde ${new Date(data.createdAt).toLocaleDateString('pt-BR')}`
                  : null
              }
            />
          </AnimatedSection>

          {isLoading ? (
            <div className="flex justify-center py-32">
              <span className="h-10 w-10 border-2 border-primary dark:border-primary-400 border-t-transparent animate-spin" />
            </div>
          ) : (
            <>
              {/* ── STATS MARQUEE ── */}
              <AnimatedSection delay={0.1} className="mb-8">
                <StatsMarquee items={marqueeItems} speed={60} />
              </AnimatedSection>

              {/* ── STAT CARDS GRID ── */}
              <AnimatedSection delay={0.2} className="mb-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-kinetic-border dark:bg-kinetic-border-dark">
                  <KineticStatCard
                    value={data?.totalPurchases || '0'}
                    label="Compras"
                    icon={MdShoppingCart}
                  />
                  <KineticStatCard
                    value={data?.activeWarranties || '0'}
                    label="Garantias"
                    icon={MdVerifiedUser}
                  />
                  <KineticStatCard
                    value={data?.points || '0'}
                    label="Pontos"
                    bgNumber="★"
                  />
                  <KineticStatCard
                    value={
                      data?.createdAt
                        ? `${Math.floor((Date.now() - new Date(data.createdAt).getTime()) / (1000 * 60 * 60 * 24))}d`
                        : '—'
                    }
                    label="Tempo de conta"
                    icon={MdCalendarToday}
                  />
                </div>
              </AnimatedSection>

              {/* ── CARD DE INFORMAÇÕES DE PERFIL ── */}
              <AnimatedSection delay={0.3} className="mb-8">
                <KineticCard>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-6 border-b-2 border-kinetic-border dark:border-kinetic-border-dark">
                    <h2 className="font-kinetic text-2xl md:text-3xl font-bold uppercase tracking-tighter text-kinetic-fg dark:text-kinetic-fg-dark">
                      Dados Pessoais
                    </h2>
                    {!isEditing && (
                      <KineticButton variant="outline" size="sm" onClick={startEditing} className="mt-4 sm:mt-0">
                        Editar Perfil
                      </KineticButton>
                    )}
                  </div>

                  {isEditing ? (
                    <form onSubmit={handleProfileSubmit} className="space-y-6">
                      {profileError && (
                        <div className="p-4 border-l-4 border-error bg-error-50 dark:bg-error/10 text-error dark:text-error-100 font-kinetic text-sm font-medium">
                          {profileError}
                        </div>
                      )}
                      {profileSuccess && (
                        <div className="p-4 border-l-4 border-success bg-success-50 dark:bg-success/10 text-success dark:text-success-100 font-kinetic text-sm font-medium">
                          {profileSuccess}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <KineticInput
                          label="Nome Completo"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                        <KineticInput
                          label="Telefone"
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                        />
                        <div className="sm:col-span-2">
                          <KineticInput
                            label="Endereço"
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                          />
                        </div>
                        <KineticInput
                          label="Cidade"
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                        />
                        <div className="grid grid-cols-2 gap-6">
                          <KineticInput
                            label="Estado"
                            type="text"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                          />
                          <KineticInput
                            label="CEP"
                            type="text"
                            value={zipCode}
                            onChange={(e) => setZipCode(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 justify-end pt-6 border-t-2 border-kinetic-border dark:border-kinetic-border-dark">
                        <KineticButton
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => setIsEditing(false)}
                          disabled={updateProfileMutation.isLoading}
                        >
                          Cancelar
                        </KineticButton>
                        <KineticButton
                          type="submit"
                          size="sm"
                          disabled={updateProfileMutation.isLoading}
                        >
                          {updateProfileMutation.isLoading ? 'Salvando...' : 'Salvar Alterações'}
                        </KineticButton>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {fields.map((f) => (
                        <div key={f.label} className="group/field">
                          <p className="font-kinetic text-xs uppercase tracking-widest font-medium text-kinetic-fg-muted dark:text-kinetic-fg-muted-dark mb-1">
                            {f.label}
                          </p>
                          <p className="font-kinetic text-lg font-semibold text-kinetic-fg dark:text-kinetic-fg-dark group-hover/field:translate-x-2 transition-transform duration-300">
                            {f.value || '—'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </KineticCard>
              </AnimatedSection>

              {/* ── SEÇÃO ALTERAR SENHA ── */}
              <AnimatedSection delay={0.4}>
                <KineticCard>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b-2 border-kinetic-border dark:border-kinetic-border-dark mb-6">
                    <div className="flex items-center gap-3">
                      <MdLock className="text-2xl text-primary dark:text-primary-400" />
                      <div>
                        <h2 className="font-kinetic text-2xl md:text-3xl font-bold uppercase tracking-tighter text-kinetic-fg dark:text-kinetic-fg-dark">
                          Segurança
                        </h2>
                        <p className="font-kinetic text-sm text-kinetic-fg-muted dark:text-kinetic-fg-muted-dark">
                          Gerencie sua senha de acesso
                        </p>
                      </div>
                    </div>
                    {!isChangingPassword && (
                      <KineticButton variant="outline" size="sm" onClick={() => setIsChangingPassword(true)} className="mt-4 sm:mt-0">
                        Alterar Senha
                      </KineticButton>
                    )}
                  </div>

                  {isChangingPassword && (
                    <form onSubmit={handlePasswordSubmit} className="space-y-6">
                      {passwordError && (
                        <div className="p-4 border-l-4 border-error bg-error-50 dark:bg-error/10 text-error dark:text-error-100 font-kinetic text-sm font-medium">
                          {passwordError}
                        </div>
                      )}
                      {passwordSuccess && (
                        <div className="p-4 border-l-4 border-success bg-success-50 dark:bg-success/10 text-success dark:text-success-100 font-kinetic text-sm font-medium">
                          {passwordSuccess}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                        <KineticInput
                          label="Senha Atual"
                          type="password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          required
                        />
                        <KineticInput
                          label="Nova Senha"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                        <KineticInput
                          label="Confirmar Nova Senha"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>

                      <div className="flex gap-3 justify-end pt-6 border-t-2 border-kinetic-border dark:border-kinetic-border-dark">
                        <KineticButton
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => setIsChangingPassword(false)}
                          disabled={updatePasswordMutation.isLoading}
                        >
                          Cancelar
                        </KineticButton>
                        <KineticButton
                          type="submit"
                          size="sm"
                          disabled={updatePasswordMutation.isLoading}
                        >
                          {updatePasswordMutation.isLoading ? 'Salvando...' : 'Salvar Nova Senha'}
                        </KineticButton>
                      </div>
                    </form>
                  )}
                </KineticCard>
              </AnimatedSection>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
