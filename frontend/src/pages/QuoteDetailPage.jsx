import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MdArrowBack,
  MdCheckCircle,
  MdCancel,
  MdDescription,
  MdPerson,
  MdEmail,
  MdPhone,
  MdAttachMoney,
  MdBusiness,
  MdLocationOn,
  MdPedalBike
} from 'react-icons/md';
import { insuranceAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

// Perfis que podem AGIR sobre a cotação (aprovar/rejeitar/converter).
// SUPORTE_RELM entra em modo leitura — vê o processo e status, sem alterar.
const CAN_ACT = ['ADMIN_RELM', 'GERENTE_RELM'];

const QuoteDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const canAct = CAN_ACT.includes(user?.role);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approveData, setApproveData] = useState({
    quoteValue: '',
    insuranceCompany: ''
  });

  // Buscar detalhes da cotação
  const { data: quote, isLoading } = useQuery({
    queryKey: ['insurance-quote', id],
    queryFn: () => insuranceAPI.getQuoteById(id)
  });

  // Mutation para aprovar
  const approveMutation = useMutation({
    mutationFn: (data) => insuranceAPI.approveQuote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['insurance-quote', id]);
      queryClient.invalidateQueries(['insurance-quotes']);
      setShowApproveModal(false);
      alert('Cotação aprovada com sucesso!');
    }
  });

  // Mutation para rejeitar
  const rejectMutation = useMutation({
    mutationFn: () => insuranceAPI.rejectQuote(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['insurance-quote', id]);
      queryClient.invalidateQueries(['insurance-quotes']);
      setShowRejectModal(false);
      alert('Cotação rejeitada.');
    }
  });

  // Mutation para converter em apólice
  const convertMutation = useMutation({
    mutationFn: () => insuranceAPI.convertToPolicy(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['insurance-quote', id]);
      queryClient.invalidateQueries(['insurance-quotes']);
      queryClient.invalidateQueries(['insurance-policies']);
      alert(`Apólice ${data.policy?.policyNumber || ''} criada com sucesso!`);
      navigate('/admin/insurances');
    }
  });

  const handleApprove = () => {
    if (!approveData.quoteValue || !approveData.insuranceCompany) {
      alert('Preencha o valor e a seguradora');
      return;
    }
    approveMutation.mutate(approveData);
  };

  const handleReject = () => {
    if (confirm('Tem certeza que deseja rejeitar esta cotação?')) {
      rejectMutation.mutate();
    }
  };

  const handleConvert = () => {
    if (confirm('Deseja converter esta cotação em apólice?')) {
      convertMutation.mutate();
    }
  };

  if (isLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  if (!quote) {
    return <div className="p-6">Cotação não encontrada</div>;
  }

  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    COTADA: 'bg-blue-100 text-blue-800',
    ACEITA: 'bg-indigo-100 text-indigo-800',
    DECLINADA: 'bg-gray-100 text-gray-800',
    EXPIRADA: 'bg-gray-100 text-gray-800',
    RECUSADA: 'bg-red-100 text-red-800',
    CONVERTED: 'bg-green-100 text-green-800',
  };

  const statusLabels = {
    PENDING: 'Aguardando cotação',
    COTADA: 'Cotação enviada',
    ACEITA: 'Aceita pelo cliente',
    DECLINADA: 'Recusada pelo cliente',
    EXPIRADA: 'Expirada',
    RECUSADA: 'Não aprovada',
    CONVERTED: 'Apólice emitida',
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/insurances')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <MdArrowBack size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Cotação {quote.protocolNumber}</h1>
            <p className="text-gray-600 text-sm">
              Criada em {new Date(quote.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusColors[quote.status]}`}>
          {statusLabels[quote.status]}
        </span>
      </div>

      {/* Ações — apenas ADMIN/GERENTE. SUPORTE vê em modo leitura. */}
      {canAct && quote.status === 'PENDING' && (
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setShowApproveModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            <MdCheckCircle size={18} />
            Aprovar / Enviar cotação
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            <MdCancel size={18} />
            Rejeitar
          </button>
        </div>
      )}

      {canAct && quote.status === 'ACEITA' && (
        <button
          onClick={handleConvert}
          disabled={convertMutation.isPending}
          className="mb-6 flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
        >
          <MdDescription size={18} />
          {convertMutation.isPending ? 'Convertendo...' : 'Converter em Apólice'}
        </button>
      )}

      {!canAct && (
        <p className="mb-6 text-sm text-gray-500 italic">
          Você está no modo de consulta — acompanhe o processo e o status desta cotação.
        </p>
      )}

      {/* Informações do Cliente */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MdPerson size={20} className="text-blue-500" />
          Dados do Cliente
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Nome</label>
            <p className="font-medium">{quote.customer?.fullName}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600 flex items-center gap-1">
              <MdEmail size={14} />
              Email
            </label>
            <p className="font-medium">{quote.customer?.email}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600 flex items-center gap-1">
              <MdPhone size={14} />
              Telefone
            </label>
            <p className="font-medium">{quote.customer?.phone}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">CPF</label>
            <p className="font-medium">{quote.customer?.cpf}</p>
          </div>
        </div>
      </div>

      {/* Informações da Bike */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MdPedalBike size={20} className="text-blue-500" />
          Dados da Bike
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600 flex items-center gap-1">
              <MdAttachMoney size={14} />
              Valor da Bike
            </label>
            <p className="font-medium text-xl">
              {quote.bikeValue
                ? `R$ ${parseFloat(quote.bikeValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                : '—'}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-600 flex items-center gap-1">
              <MdLocationOn size={14} />
              Localização
            </label>
            <p className="font-medium">{quote.city} - {quote.state}</p>
          </div>
        </div>
      </div>

      {/* Informações da Cotação */}
      {(quote.quoteValue || quote.insuranceCompany) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MdBusiness size={20} className="text-blue-500" />
            Detalhes da Cotação
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {quote.insuranceCompany && (
              <div>
                <label className="text-sm text-gray-600">Seguradora</label>
                <p className="font-medium">{quote.insuranceCompany}</p>
              </div>
            )}
            {quote.quoteValue && (
              <div>
                <label className="text-sm text-gray-600">Valor do seguro</label>
                <p className="font-medium text-xl text-green-600">
                  R$ {parseFloat(quote.quoteValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Aprovar */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-xl font-bold mb-4">Aprovar Cotação</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Valor Mensal (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={approveData.quoteValue}
                  onChange={(e) => setApproveData({...approveData, quoteValue: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="89.90"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Seguradora</label>
                <input
                  type="text"
                  value={approveData.insuranceCompany}
                  onChange={(e) => setApproveData({...approveData, insuranceCompany: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Porto Seguro"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleApprove}
                disabled={approveMutation.isPending}
                className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:bg-gray-400"
              >
                {approveMutation.isPending ? 'Aprovando...' : 'Confirmar'}
              </button>
              <button
                onClick={() => setShowApproveModal(false)}
                className="flex-1 bg-gray-300 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rejeitar */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-xl font-bold mb-4">Rejeitar Cotação</h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja rejeitar esta cotação? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={rejectMutation.isPending}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 disabled:bg-gray-400"
              >
                {rejectMutation.isPending ? 'Rejeitando...' : 'Confirmar'}
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 bg-gray-300 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteDetailPage;
