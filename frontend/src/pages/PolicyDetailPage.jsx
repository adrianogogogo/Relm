import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MdArrowBack,
  MdDescription,
  MdPerson,
  MdEmail,
  MdPhone,
  MdAttachMoney,
  MdEvent,
  MdBusiness,
  MdVerifiedUser,
  MdError,
  MdCancel,
  MdPrint,
} from 'react-icons/md';
import { insuranceAPI } from '../services/api';

const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-800',
  EXPIRED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

const STATUS_LABELS = {
  ACTIVE: 'Ativa',
  EXPIRED: 'Expirada',
  CANCELLED: 'Cancelada',
};

const formatMoney = (v) =>
  v != null
    ? `R$ ${parseFloat(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    : '—';

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('pt-BR') : '—');

const PolicyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCancelModal, setShowCancelModal] = useState(false);

  const { data: policy, isLoading } = useQuery({
    queryKey: ['insurance-policy', id],
    queryFn: () => insuranceAPI.getPolicyById(id),
  });

  const cancelMutation = useMutation({
    mutationFn: () => insuranceAPI.cancelPolicy(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['insurance-policy', id]);
      queryClient.invalidateQueries(['insurance-policies']);
      setShowCancelModal(false);
      alert('Apólice cancelada com sucesso!');
    },
  });

  if (isLoading) return <div className="p-6">Carregando...</div>;
  if (!policy) return <div className="p-6">Apólice não encontrada</div>;

  const isExpiring = () => {
    if (policy.status !== 'ACTIVE' || !policy.expiresAt) return false;
    const days = Math.ceil((new Date(policy.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
    return days <= 30 && days > 0;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto print:max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/insurances')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <MdArrowBack size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Apólice {policy.policyNumber}</h1>
            <p className="text-gray-600 text-sm">
              Emitida em {formatDate(policy.createdAt)}
            </p>
          </div>
        </div>
        <span
          className={`px-4 py-2 rounded-full text-sm font-semibold ${STATUS_COLORS[policy.status]}`}
        >
          {STATUS_LABELS[policy.status] || policy.status}
        </span>
      </div>

      {/* Alerta de Vencimento */}
      {isExpiring() && (
        <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg print:hidden">
          <div className="flex items-center gap-2">
            <MdError size={20} className="text-yellow-600" />
            <div>
              <p className="font-semibold text-yellow-800">Apólice próxima do vencimento</p>
              <p className="text-sm text-yellow-700">
                Vencimento em {formatDate(policy.expiresAt)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Ações */}
      {policy.status === 'ACTIVE' && (
        <div className="flex gap-3 mb-6 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <MdPrint size={18} />
            Imprimir
          </button>
          <button
            onClick={() => setShowCancelModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            <MdCancel size={18} />
            Cancelar
          </button>
        </div>
      )}

      {/* Segurado */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MdPerson size={20} className="text-blue-500" />
          Segurado
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Nome</label>
            <p className="font-medium">{policy.customer?.fullName}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600 flex items-center gap-1">
              <MdEmail size={14} />
              Email
            </label>
            <p className="font-medium">{policy.customer?.email}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600 flex items-center gap-1">
              <MdPhone size={14} />
              Telefone
            </label>
            <p className="font-medium">{policy.customer?.phone}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">CPF</label>
            <p className="font-medium">{policy.customer?.cpf || '—'}</p>
          </div>
        </div>
      </div>

      {/* Seguradora */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MdBusiness size={20} className="text-blue-500" />
          Seguradora
        </h2>
        <p className="font-medium text-lg">{policy.insurer}</p>
      </div>

      {/* Valores e Cobertura */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MdAttachMoney size={20} className="text-blue-500" />
          Prêmio e Cobertura
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-sm text-gray-600">Prêmio</label>
            <p className="font-bold text-2xl text-green-600">{formatMoney(policy.premium)}</p>
          </div>
          {policy.product && (
            <div>
              <label className="text-sm text-gray-600">Produto</label>
              <p className="font-medium text-lg">
                {policy.product.model || '—'}
                {policy.product.serialNumber ? ` — ${policy.product.serialNumber}` : ''}
              </p>
            </div>
          )}
        </div>
        {policy.coverage && (
          <div className="mt-4">
            <label className="text-sm text-gray-600 flex items-center gap-1">
              <MdVerifiedUser size={14} />
              Cobertura
            </label>
            <p className="text-gray-700 whitespace-pre-wrap">{policy.coverage}</p>
          </div>
        )}
      </div>

      {/* Vigência */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MdEvent size={20} className="text-blue-500" />
          Vigência
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Início</label>
            <p className="font-medium text-lg">{formatDate(policy.startsAt)}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Término</label>
            <p className="font-medium text-lg">{formatDate(policy.expiresAt)}</p>
          </div>
        </div>
      </div>

      {/* Cotação de origem */}
      {policy.quote && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MdDescription size={20} className="text-blue-500" />
            Cotação de origem
          </h2>
          <p className="font-mono font-medium">{policy.quote.protocolNumber}</p>
        </div>
      )}

      {/* Modal Cancelar */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-xl font-bold mb-4">Cancelar Apólice</h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja cancelar esta apólice? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 disabled:bg-gray-400"
              >
                {cancelMutation.isPending ? 'Cancelando...' : 'Confirmar'}
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-gray-300 py-2 rounded-lg hover:bg-gray-400"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PolicyDetailPage;
