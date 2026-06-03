import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { ArrowLeft, Gift, Plus, Pencil, Trash2, X } from 'lucide-react';

const EMPTY_FORM = {
  title: '',
  description: '',
  terms: '',
  validFrom: '',
  validUntil: '',
  targetRoles: [],
};

function BenefitModal({ benefit, onClose }) {
  const queryClient = useQueryClient();
  const isEdit = !!benefit?.id;
  const [form, setForm] = useState(
    isEdit
      ? {
          title: benefit.title,
          description: benefit.description,
          terms: benefit.terms || '',
          validFrom: benefit.validFrom?.slice(0, 10) || '',
          validUntil: benefit.validUntil?.slice(0, 10) || '',
          targetRoles: benefit.targetRoles || [],
        }
      : { ...EMPTY_FORM }
  );
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit
        ? api.patch(`/benefits/${benefit.id}`, data)
        : api.post('/benefits', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-benefits']);
      onClose();
    },
    onError: (err) => setError(err.response?.data?.message || 'Erro ao salvar benefício.'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.title || !form.description || !form.validFrom || !form.validUntil) {
      setError('Preencha os campos obrigatórios.');
      return;
    }
    mutation.mutate(form);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">{isEdit ? 'Editar Benefício' : 'Novo Benefício'}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Termos e Condições</label>
            <textarea
              value={form.terms}
              onChange={(e) => setForm({ ...form, terms: e.target.value })}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Válido de *</label>
              <input
                type="date"
                value={form.validFrom}
                onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Válido até *</label>
              <input
                type="date"
                value={form.validUntil}
                onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Público-alvo</label>
            <div className="flex flex-wrap gap-4 mt-2">
              {[
                { id: 'CLIENTE', label: 'Clientes' },
                { id: 'LOJA', label: 'Lojas' },
                { id: 'DISTRIBUIDOR', label: 'Distribuidores' }
              ].map((role) => (
                <label key={role.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.targetRoles.includes(role.id)}
                    onChange={(e) => {
                      const newRoles = e.target.checked
                        ? [...form.targetRoles, role.id]
                        : form.targetRoles.filter((r) => r !== role.id);
                      setForm({ ...form, targetRoles: newRoles });
                    }}
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                  />
                  {role.label}
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">Se nenhum público for selecionado, o benefício ficará disponível para todos.</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-outline flex-1">Cancelar</button>
            <button type="submit" disabled={mutation.isPending} className="btn btn-primary flex-1">
              {mutation.isPending ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminBenefitsPage() {
  const queryClient = useQueryClient();
  const [modalBenefit, setModalBenefit] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const { data: benefits, isLoading } = useQuery({
    queryKey: ['admin-benefits'],
    queryFn: () => api.get('/benefits').then((res) => res.data),
  });

  const removeMutation = useMutation({
    mutationFn: (id) => api.delete(`/benefits/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['admin-benefits']),
  });

  const handleNew = () => { setModalBenefit(null); setShowModal(true); };
  const handleEdit = (b) => { setModalBenefit(b); setShowModal(true); };
  const handleClose = () => setShowModal(false);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Benefícios</h1>
              <p className="text-gray-600 mt-1">Gerencie o clube de vantagens Relm</p>
            </div>
          </div>
          <button onClick={handleNew} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Novo Benefício
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Carregando benefícios...</div>
        ) : benefits?.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nenhum benefício cadastrado.</p>
            <button onClick={handleNew} className="btn btn-primary mt-4">
              Criar primeiro benefício
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((b) => (
              <div key={b.id} className={`bg-white rounded-lg shadow-sm p-6 border-l-4 ${b.active ? 'border-green-500' : 'border-gray-300 opacity-60'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg">{b.title}</h3>
                    {b.targetRoles && b.targetRoles.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {b.targetRoles.map((role) => (
                          <span key={role} className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full inline-block">
                            {role}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full mt-1 inline-block">
                        Todos
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <button onClick={() => handleEdit(b)} className="p-1.5 text-gray-400 hover:text-primary rounded">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { if (confirm('Desativar este benefício?')) removeMutation.mutate(b.id); }}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{b.description}</p>
                <div className="text-xs text-gray-400">
                  Vigência: {new Date(b.validFrom).toLocaleDateString('pt-BR')} — {new Date(b.validUntil).toLocaleDateString('pt-BR')}
                </div>
                {!b.active && <span className="text-xs text-gray-400 mt-1 block">Inativo</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && <BenefitModal benefit={modalBenefit} onClose={handleClose} />}
    </div>
  );
}
