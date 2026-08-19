import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { instructorsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Card, PageHeader, Button } from '../components/ui';
import {
  MdLogout,
  MdSearch,
  MdVerified,
  MdWarningAmber,
  MdPersonOutline,
  MdGroups,
  MdKey,
  MdClose,
} from 'react-icons/md';

const STATUS_META = {
  PLUS_ATIVO: {
    label: 'Plus ativo',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
  PLUS_VENCIDO: {
    label: 'Plus vencido',
    className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  },
  CARE: {
    label: 'Care',
    className: 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300',
  },
};

const TERMO = [
  'Os clientes Relm chegam a você por conta própria: a Relm apresenta o seu trabalho e não intermedia a contratação, o pagamento ou a execução do serviço.',
  'Não há repasse nem comissão em nenhuma direção.',
  'Você se compromete a honrar o desconto anunciado no seu cadastro para quem apresentar uma credencial válida.',
  'Os dados dos clientes exibidos aqui são confidenciais e chegam parcialmente mascarados. Não use esta lista para prospecção ativa nem a compartilhe.',
];

function CredentialStatusChip({ status }) {
  const meta = STATUS_META[status] ?? STATUS_META.CARE;
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.className}`}>
      {meta.label}
    </span>
  );
}

function ChangePasswordModal({ onClose }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const mutation = useMutation({
    mutationFn: instructorsAPI.changePassword,
    onSuccess: (res) => {
      setSuccess(res?.message || 'Senha alterada com sucesso!');
      setError('');
      setTimeout(() => {
        onClose();
      }, 1500);
    },
    onError: (err) => {
      setError(err?.response?.data?.message || 'Erro ao alterar senha.');
      setSuccess('');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Preencha todos os campos.');
      return;
    }
    if (newPassword.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('A confirmação da senha não coincide.');
      return;
    }
    mutation.mutate({ currentPassword, newPassword });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-slate-800 space-y-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Fechar"
        >
          <MdClose size={20} />
        </button>

        <h3 className="font-title font-bold text-base text-gray-900 dark:text-slate-100 flex items-center gap-2">
          <MdKey className="text-primary" size={20} /> Alterar Minha Senha
        </h3>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs font-semibold text-red-700 dark:text-red-300">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            ✓ {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-left">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Senha Atual
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Digite sua senha atual"
              className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Nova Senha
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Confirmar Nova Senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-500"
            >
              Cancelar
            </button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : 'Salvar Nova Senha'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TermsGate({ onAccept, pending }) {
  return (
    <div className="py-10 px-6">
      <div className="max-w-2xl mx-auto">
        <PageHeader
          title="Termo de participação"
          subtitle="Leia e aceite para acessar o painel de credenciais"
        />
        <Card className="space-y-3">
          <ul className="space-y-2 text-sm text-gray-700 dark:text-slate-300 list-disc pl-5">
            {TERMO.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="pt-3 border-t border-gray-100 dark:border-slate-800">
            <Button onClick={onAccept} disabled={pending} className="w-full">
              {pending ? 'Registrando...' : 'Li e aceito'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function InstructorPanelPage() {
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();
  const [code, setCode] = useState('');
  const [lookup, setLookup] = useState(null);
  const [lookupError, setLookupError] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);

  const { data: me, isLoading: loadingMe } = useQuery({
    queryKey: ['instructor-me'],
    queryFn: instructorsAPI.me,
  });

  const acceptMutation = useMutation({
    mutationFn: instructorsAPI.acceptTerms,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['instructor-me'] }),
  });

  const accepted = !!me?.termsAcceptedAt;

  const { data, isLoading } = useQuery({
    queryKey: ['instructor-credentials'],
    queryFn: instructorsAPI.getCredentials,
    // Sem termo aceito o backend responde 403 — não vale chamar.
    enabled: accepted,
  });

  const lookupMutation = useMutation({
    mutationFn: (value) => instructorsAPI.checkCredential(value.trim().toUpperCase()),
    onSuccess: (result) => {
      setLookup(result);
      setLookupError('');
    },
    onError: (err) => {
      setLookup(null);
      setLookupError(
        err?.response?.status === 403
          ? 'Esta credencial não é sua.'
          : 'Credencial não encontrada.',
      );
    },
  });

  if (loadingMe) {
    return (
      <div className="flex justify-center py-20">
        <span className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!accepted) {
    return <TermsGate onAccept={acceptMutation.mutate} pending={acceptMutation.isPending} />;
  }

  const credentials = data?.credentials ?? [];

  return (
    <div className="py-8 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between gap-3">
          <PageHeader
            title={data?.instructorName || me?.name || 'Painel do instrutor'}
            subtitle="Confira o status de quem apresentar uma credencial Relm"
          />
          <div className="mt-1 flex items-center gap-3">
            <button
              onClick={() => setShowChangePassword(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:text-primary transition-colors"
            >
              <MdKey size={16} /> Alterar Senha
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-gray-700"
            >
              <MdLogout size={15} /> Sair
            </button>
          </div>
        </div>

        {showChangePassword && (
          <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
        )}

        {/* Consulta pontual — o caso de uso real: cliente na frente, código na mão. */}
        <Card className="mb-6">
          <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
            Conferir uma credencial
          </label>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (code.trim()) lookupMutation.mutate(code);
            }}
            className="mt-2 flex flex-wrap gap-2"
          >
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="INS-XXXXX"
              className="flex-1 min-w-[160px] rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono uppercase tracking-wider"
            />
            <Button type="submit" disabled={lookupMutation.isPending}>
              <span className="inline-flex items-center gap-1">
                <MdSearch size={16} />
                {lookupMutation.isPending ? 'Conferindo...' : 'Conferir'}
              </span>
            </Button>
          </form>

          {lookupError && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <MdWarningAmber size={16} /> {lookupError}
            </p>
          )}

          {lookup && (
            <div className="mt-3 rounded-lg border border-gray-200 dark:border-slate-800 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-sm text-gray-900 dark:text-slate-100 flex items-center gap-1.5">
                  <MdVerified size={16} className="text-emerald-600" />
                  {lookup.customerName}
                </p>
                <CredentialStatusChip status={lookup.status} />
              </div>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">
                CPF {lookup.customerCpf ?? '—'} · tel. {lookup.customerPhone ?? '—'}
                {lookup.subscriptionExpiresAt && (
                  <>
                    {' · assinatura até '}
                    {new Date(lookup.subscriptionExpiresAt).toLocaleDateString('pt-BR')}
                  </>
                )}
              </p>
            </div>
          )}
        </Card>

        <div className="flex items-center gap-2 mb-3">
          <MdGroups size={18} className="text-gray-400" />
          <h3 className="font-title font-bold text-sm text-gray-900 dark:text-slate-100">
            Clientes Relm vinculados
          </h3>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0A1929]/10 text-[#0A1929] dark:bg-[#2196F3]/20 dark:text-[#2196F3]">
            {data?.total ?? 0}
          </span>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : credentials.length === 0 ? (
          <Card className="p-10 text-center">
            <MdPersonOutline size={32} className="mx-auto text-gray-300 dark:text-slate-700" />
            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
              Nenhum cliente vinculado ainda. Eles aparecem aqui quando geram a
              credencial do seu perfil no app da Relm.
            </p>
          </Card>
        ) : (
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-900/60 text-left text-xs text-gray-500 dark:text-slate-400">
                <tr>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Código</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Vinculado em</th>
                </tr>
              </thead>
              <tbody>
                {credentials.map((c) => (
                  <tr key={c.code} className="border-t border-gray-100 dark:border-slate-800">
                    <td className="p-3">
                      <p className="font-semibold text-gray-900 dark:text-slate-100">
                        {c.customerName}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400">
                        CPF {c.customerCpf ?? '—'} · tel. {c.customerPhone ?? '—'}
                      </p>
                    </td>
                    <td className="p-3 font-mono text-xs">{c.code}</td>
                    <td className="p-3">
                      <CredentialStatusChip status={c.status} />
                    </td>
                    <td className="p-3 text-xs text-gray-500 dark:text-slate-400">
                      {new Date(c.linkedAt).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        <p className="mt-4 text-[11px] text-gray-400 dark:text-slate-500">
          O status é calculado no momento da consulta. Se um cliente cancelar a
          assinatura, ele aparece aqui como Plus vencido.
        </p>
      </div>
    </div>
  );
}
