import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { instructorsAPI } from '../services/api';
import { Card, PageHeader, Button } from '../components/ui';
import {
  MdAdd,
  MdEdit,
  MdClose,
  MdPublic,
  MdLocationOn,
  MdCategory,
  MdVisibilityOff,
} from 'react-icons/md';

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

const EMPTY = {
  name: '',
  phone: '',
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

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEdit ? instructorsAPI.update(instructor.id, payload) : instructorsAPI.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-instructors'] });
      onClose();
    },
    onError: (err) => setError(err?.response?.data?.message || 'Não foi possível salvar.'),
  });

  const field = (label, key, opts = {}) => (
    <label className="block">
      <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">
        {label}
        {opts.required && <span className="text-red-500"> *</span>}
      </span>
      <input
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        placeholder={opts.placeholder}
        className="mt-1 w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
      />
      {opts.hint && (
        <span className="text-[10px] text-gray-400 dark:text-slate-500">{opts.hint}</span>
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
          {isEdit ? 'Editar instrutor' : 'Novo instrutor'}
        </h3>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError('');
            if (!form.name.trim() || !form.phone.trim() || !form.benefit.trim()) {
              setError('Nome, telefone e desconto para todos são obrigatórios.');
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
            });
          }}
          className="mt-4 space-y-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {field('Nome do instrutor / assessoria', 'name', { required: true })}
            {field('Telefone / WhatsApp', 'phone', {
              required: true,
              hint: 'Só aparece ao cliente depois que ele gera a credencial.',
            })}
          </div>

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

  const { data: instructors = [], isLoading } = useQuery({
    queryKey: ['admin-instructors'],
    queryFn: instructorsAPI.getAll,
  });

  const { data: specialties = [] } = useQuery({
    queryKey: ['admin-instructor-specialties'],
    queryFn: instructorsAPI.getSpecialties,
  });

  const removeMutation = useMutation({
    mutationFn: (id) => instructorsAPI.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-instructors'] }),
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
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {instructors.map((i) => (
                  <tr
                    key={i.id}
                    className={`border-t border-gray-100 dark:border-slate-800 ${
                      i.active ? '' : 'opacity-50'
                    }`}
                  >
                    <td className="p-4">
                      <p className="font-semibold text-gray-900 dark:text-slate-100">{i.name}</p>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400">{i.phone}</p>
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
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditing(i);
                            setShowForm(true);
                          }}
                          className="text-gray-400 hover:text-[#0A1929] dark:hover:text-[#2196F3]"
                          title="Editar"
                        >
                          <MdEdit size={18} />
                        </button>
                        {i.active && (
                          <button
                            onClick={() => removeMutation.mutate(i.id)}
                            className="text-gray-400 hover:text-red-600"
                            title="Inativar"
                          >
                            <MdVisibilityOff size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

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
