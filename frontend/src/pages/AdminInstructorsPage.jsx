import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { instructorsAPI } from '../services/api';
import { Card, PageHeader, Button } from '../components/ui';
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdClose,
  MdPublic,
  MdLocationOn,
  MdCategory,
  MdVisibility,
  MdVisibilityOff,
  MdWarningAmber,
} from 'react-icons/md';

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

const EMPTY = {
  name: '',
  phone: '',
  email: '',
  initialPassword: 'Relm@2026',
  benefit: '',
  benefitPlus: '',
  description: '',
  link: '',
  logoUrl: '',
  city: '',
  state: '',
  remote: false,
  active: true,
  specialtyIds: [],
};

function InstructorForm({ instructor, specialties, onClose }) {
  const queryClient = useQueryClient();
  const isEdit = !!instructor;
  const linkedUser = instructor?.users?.[0];
  const [form, setForm] = useState(
    isEdit
      ? {
          ...EMPTY,
          ...instructor,
          benefitPlus: instructor.benefitPlus ?? '',
          description: instructor.description ?? '',
          link: instructor.link ?? '',
          logoUrl: instructor.logoUrl ?? '',
          city: instructor.city ?? '',
          state: instructor.state ?? '',
          specialtyIds: (instructor.specialties ?? []).map((s) => s.id),
        }
      : EMPTY,
  );
  const [error, setError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState('Relm@2026');

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEdit ? instructorsAPI.update(instructor.id, payload) : instructorsAPI.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-instructors'] });
      onClose();
    },
    onError: (err) => setError(err?.response?.data?.message || 'Não foi possível salvar.'),
  });

  const resetMutation = useMutation({
    mutationFn: (password) =>
      instructorsAPI.resetPassword(instructor.id, { newPassword: password }),
    onSuccess: (res) => {
      setResetSuccess(res?.message || 'Senha redefinida com sucesso!');
      setShowResetModal(false);
    },
    onError: (err) => setError(err?.response?.data?.message || 'Erro ao redefinir senha.'),
  });

  const field = (label, key, opts = {}) => (
    <label className="block">
      <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">
        {label}
        {opts.required && <span className="text-red-500"> *</span>}
      </span>
      <input
        type={opts.type || 'text'}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        placeholder={opts.placeholder}
        className="mt-1 w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
      />
      {opts.hint && (
        <span className="text-[10px] text-gray-400 dark:text-slate-500 block mt-0.5">{opts.hint}</span>
      )}
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4">
      <Card className="w-full max-w-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          aria-label="Fechar"
        >
          <MdClose size={22} />
        </button>

        <h3 className="font-title font-bold text-lg text-gray-900 dark:text-slate-100 pr-6">
          {isEdit ? 'Editar instrutor' : 'Novo instrutor & Acesso'}
        </h3>

        {resetSuccess && (
          <div className="mt-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            ✓ {resetSuccess}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError('');
            if (!form.name.trim() || !form.phone.trim() || !form.benefit.trim()) {
              setError('Nome, telefone e desconto para todos são obrigatórios.');
              return;
            }
            if (!isEdit && !form.email.trim()) {
              setError('E-mail de acesso é obrigatório para criar a conta do instrutor.');
              return;
            }
            mutation.mutate({
              name: form.name.trim(),
              phone: form.phone.trim(),
              benefit: form.benefit.trim(),
              benefitPlus: form.benefitPlus.trim() || undefined,
              description: form.description.trim() || undefined,
              link: form.link.trim() || undefined,
              logoUrl: form.logoUrl.trim() || undefined,
              city: form.city.trim() || undefined,
              state: form.state || undefined,
              remote: form.remote,
              active: form.active,
              specialtyIds: form.specialtyIds,
              email: !isEdit ? form.email.trim().toLowerCase() : undefined,
              initialPassword: !isEdit ? form.initialPassword.trim() : undefined,
            });
          }}
          className="mt-4 space-y-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {field('Nome do instrutor / assessoria', 'name', { required: true })}
            {field('Telefone / WhatsApp', 'phone', {
              required: true,
              hint: 'Aparece ao cliente após gerar a credencial.',
            })}
          </div>

          {!isEdit ? (
            <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-slate-800/70 border border-blue-100 dark:border-slate-700 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0A1929] dark:text-[#2196F3]">
                  🔐 Conta de Acesso ao Sistema (Login)
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {field('E-mail de Acesso (Login)', 'email', {
                  required: true,
                  type: 'email',
                  placeholder: 'contato@assessoria.com.br',
                  hint: 'Login único para entrar em /login.',
                })}
                {field('Senha Inicial Padrão', 'initialPassword', {
                  required: true,
                  placeholder: 'Relm@2026',
                  hint: 'O instrutor poderá alterá-la no painel.',
                })}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 block">
                  Conta de Login Vinculada:
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-slate-100">
                  {linkedUser?.email || 'Nenhum usuário vinculado'}
                </span>
              </div>
              {linkedUser && (
                <button
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors inline-flex items-center gap-1.5 self-start sm:self-center"
                >
                  🔑 Redefinir Senha
                </button>
              )}
            </div>
          )}

          {/* Sem campo de preço por decisão de produto: o desconto é texto. */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {field('Desconto para todos os membros', 'benefit', {
              required: true,
              placeholder: 'Ex.: 5% na mensalidade',
            })}
            {field('Desconto para assinantes Plus', 'benefitPlus', {
              placeholder: 'Ex.: 15% na mensalidade',
              hint: 'O cliente Care também vê este texto — é o argumento de venda.',
            })}
          </div>

          <label className="block">
            <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">
              Descrição
            </span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {field('Cidade', 'city')}
            <label className="block">
              <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">UF</span>
              <select
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {UFS.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </label>
            {field('Site / Instagram', 'link')}
          </div>

          {field('URL da logo', 'logoUrl')}

          <div>
            <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">
              Especialidades
            </span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {specialties.length === 0 && (
                <p className="text-xs text-gray-400">
                  Nenhuma cadastrada — use "Gerenciar especialidades".
                </p>
              )}
              {specialties.map((s) => {
                const checked = form.specialtyIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        specialtyIds: checked
                          ? form.specialtyIds.filter((id) => id !== s.id)
                          : [...form.specialtyIds, s.id],
                      })
                    }
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      checked
                        ? 'bg-[#0A1929] dark:bg-[#2196F3] text-white border-[#0A1929]'
                        : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700'
                    }`}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={form.remote}
                onChange={(e) => setForm({ ...form, remote: e.target.checked })}
              />
              Atende online
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Ativo
            </label>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-slate-400"
            >
              Cancelar
            </button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>

        {showResetModal && (
          <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-slate-800 space-y-4">
              <h4 className="font-bold text-sm text-gray-900 dark:text-slate-100">
                Redefinir Senha do Instrutor
              </h4>
              <p className="text-xs text-gray-600 dark:text-slate-400">
                Defina uma nova senha temporária para <b>{linkedUser?.email}</b>:
              </p>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-500"
                >
                  Cancelar
                </button>
                <Button
                  onClick={() => resetMutation.mutate(newPassword)}
                  disabled={resetMutation.isPending || newPassword.length < 6}
                >
                  {resetMutation.isPending ? 'Redefinindo...' : 'Confirmar'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function SpecialtiesModal({ specialties, onClose }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-instructor-specialties'] });
    queryClient.invalidateQueries({ queryKey: ['admin-instructors'] });
  };

  const createMutation = useMutation({
    mutationFn: () => instructorsAPI.createSpecialty(name.trim()),
    onSuccess: () => {
      setName('');
      setError('');
      invalidate();
    },
    onError: (err) => setError(err?.response?.data?.message || 'Não foi possível cadastrar.'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }) => instructorsAPI.updateSpecialty(id, { active }),
    onSuccess: invalidate,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          aria-label="Fechar"
        >
          <MdClose size={22} />
        </button>

        <h3 className="font-title font-bold text-lg text-gray-900 dark:text-slate-100 pr-6">
          Especialidades
        </h3>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
          Cadastre novas sem depender de deploy. O nome é único.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) createMutation.mutate();
          }}
          className="mt-3 flex gap-2"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Triatlo"
            className="flex-1 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
          />
          <Button type="submit" disabled={createMutation.isPending}>
            <MdAdd size={16} />
          </Button>
        </form>

        {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

        <ul className="mt-4 space-y-1 max-h-64 overflow-y-auto">
          {specialties.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 dark:border-slate-800 px-3 py-2"
            >
              <span
                className={`text-sm ${
                  s.active ? 'text-gray-900 dark:text-slate-100' : 'text-gray-400 line-through'
                }`}
              >
                {s.name}
              </span>
              <button
                onClick={() => toggleMutation.mutate({ id: s.id, active: !s.active })}
                className="text-xs font-semibold text-gray-500 dark:text-slate-400 hover:underline"
              >
                {s.active ? 'Desativar' : 'Reativar'}
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

export default function AdminInstructorsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showSpecialties, setShowSpecialties] = useState(false);
  const [instructorToDelete, setInstructorToDelete] = useState(null);

  const { data: instructors = [], isLoading } = useQuery({
    queryKey: ['admin-instructors'],
    queryFn: instructorsAPI.getAll,
  });

  const { data: specialties = [] } = useQuery({
    queryKey: ['admin-instructor-specialties'],
    queryFn: instructorsAPI.getSpecialties,
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id) => instructorsAPI.toggleActive(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-instructors'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => instructorsAPI.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-instructors'] });
      setInstructorToDelete(null);
    },
  });

  return (
    <div className="py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <PageHeader
            title="Instrutores & Assessorias"
            subtitle="Só a Relm cadastra e edita. O instrutor loga apenas para conferir credenciais."
          />
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => setShowSpecialties(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-slate-200"
            >
              <MdCategory size={16} /> Gerenciar especialidades
            </button>
            <Button
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
            >
              <span className="inline-flex items-center gap-1">
                <MdAdd size={16} /> Novo instrutor
              </span>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <span className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : instructors.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500 dark:text-slate-400">Nenhum instrutor cadastrado.</p>
          </Card>
        ) : (
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-900/60 text-left text-xs text-gray-500 dark:text-slate-400">
                <tr>
                  <th className="p-4">Instrutor</th>
                  <th className="p-4">Onde atende</th>
                  <th className="p-4">Descontos</th>
                  <th className="p-4">Especialidades</th>
                  <th className="p-4">Termo</th>
                  <th className="p-4 text-right pr-6">Ações</th>
                </tr>
              </thead>
              <tbody>
                {instructors.map((i) => (
                  <tr
                    key={i.id}
                    className={`border-t border-gray-100 dark:border-slate-800 ${
                      i.active ? '' : 'opacity-60 bg-gray-50/50 dark:bg-slate-900/20'
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 dark:text-slate-100">{i.name}</p>
                        {!i.active && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Inativo
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400">{i.phone}</p>
                      {i.users?.[0]?.email && (
                        <p className="text-[10px] font-mono text-blue-600 dark:text-blue-400 mt-0.5">
                          ✉ {i.users[0].email}
                        </p>
                      )}
                    </td>
                    <td className="p-4 text-xs text-gray-600 dark:text-slate-400">
                      {i.remote ? (
                        <span className="inline-flex items-center gap-1">
                          <MdPublic size={13} /> Online
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <MdLocationOn size={13} />
                          {[i.city, i.state].filter(Boolean).join('/') || '—'}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-xs">
                      <p className="text-gray-700 dark:text-slate-300">
                        <b>Todos:</b> {i.benefit}
                      </p>
                      <p className="text-amber-700 dark:text-amber-400">
                        <b>Plus:</b> {i.benefitPlus || '—'}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {(i.specialties ?? []).map((s) => (
                          <span
                            key={s.id}
                            className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-xs text-gray-500 dark:text-slate-400">
                      {i.termsAcceptedAt
                        ? new Date(i.termsAcceptedAt).toLocaleDateString('pt-BR')
                        : 'pendente'}
                    </td>
                    <td className="p-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditing(i);
                            setShowForm(true);
                          }}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-[#0A1929] dark:hover:text-[#2196F3] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                          title="Editar cadastro e senha"
                        >
                          <MdEdit size={18} />
                        </button>
                        <button
                          onClick={() => toggleActiveMutation.mutate(i.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            i.active
                              ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                              : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                          }`}
                          title={i.active ? 'Inativar instrutor' : 'Reativar instrutor'}
                        >
                          {i.active ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                        </button>
                        <button
                          onClick={() => setInstructorToDelete(i)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          title="Apagar cadastro do instrutor"
                        >
                          <MdDelete size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      {instructorToDelete && (
        <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <MdWarningAmber size={28} />
              <h4 className="font-bold text-base text-gray-900 dark:text-slate-100">
                Apagar cadastro do instrutor?
              </h4>
            </div>
            <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
              Tem certeza que deseja apagar o cadastro de <b>{instructorToDelete.name}</b>?
              Esta ação removerá o perfil do instrutor, o vínculo de credenciais e a sua conta de login (<b>{instructorToDelete.users?.[0]?.email || 'sem usuário vinculado'}</b>).
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setInstructorToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(instructorToDelete.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Apagando...' : 'Sim, Apagar Cadastro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <InstructorForm
          instructor={editing}
          specialties={specialties.filter((s) => s.active)}
          onClose={() => setShowForm(false)}
        />
      )}
      {showSpecialties && (
        <SpecialtiesModal
          specialties={specialties}
          onClose={() => setShowSpecialties(false)}
        />
      )}
    </div>
  );
}
