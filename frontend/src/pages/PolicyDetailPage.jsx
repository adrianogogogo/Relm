import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  FileText, 
  User, 
  Mail, 
  Phone, 
  DollarSign, 
  Calendar,
  Building,
  Shield,
  AlertCircle,
  RefreshCcw,
  XCircle,
  Printer
} from 'lucide-react';
import { insuranceAPI } from '../services/api';

const PolicyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);

  // Buscar detalhes da apólice
  const { data: policy, isLoading } = useQuery({
    queryKey: ['insurance-policy', id],
    queryFn: () => insuranceAPI.getPolicyById(id)
  });

  // Mutation para cancelar
  const cancelMutation = useMutation({
    mutationFn: () => insuranceAPI.cancelPolicy(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['insurance-policy', id]);
      queryClient.invalidateQueries(['insurance-policies']);
      setShowCancelModal(false);
      alert('Apólice cancelada com sucesso!');
    }
  });

  // Mutation para renovar
  const renewMutation = useMutation({
    mutationFn: () => insuranceAPI.renewPolicy(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['insurance-policy', id]);
      queryClient.invalidateQueries(['insurance-policies']);
      setShowRenewModal(false);
      alert('Apólice renovada com sucesso!');
    }
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCancel = () => {
    if (confirm('Tem certeza que deseja cancelar esta apólice?')) {
      cancelMutation.mutate();
    }
  };

  const handleRenew = () => {
    if (confirm('Deseja renovar esta apólice por mais 12 meses?')) {
      renewMutation.mutate();
    }
  };

  if (isLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  if (!policy) {
    return <div className="p-6">Apólice não encontrada</div>;
  }

  const statusColors = {
    ACTIVE: 'bg-green-100 text-green-800',
    EXPIRED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800'
  };

  const statusLabels = {
    ACTIVE: 'Ativa',
    EXPIRED: 'Expirada',
    CANCELLED: 'Cancelada'
  };

  const isExpiring = () => {
    const endDate = new Date(policy.end_date);
    const today = new Date();
    const daysUntilExpire = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpire <= 30 && daysUntilExpire > 0;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto print:max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/seguros')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Apólice {policy.policy_number}</h1>
            <p className="text-gray-600 text-sm">
              Emitida em {new Date(policy.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusColors[policy.status]}`}>
            {statusLabels[policy.status]}
          </span>
        </div>
      </div>

      {/* Alerta de Vencimento */}
      {isExpiring() && policy.status === 'ACTIVE' && (
        <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg print:hidden">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} className="text-yellow-600" />
            <div>
              <p className="font-semibold text-yellow-800">Apólice próxima do vencimento</p>
              <p className="text-sm text-yellow-700">
                Vencimento em {new Date(policy.end_date).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Ações */}
      {policy.status === 'ACTIVE' && (
        <div className="flex gap-3 mb-6 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Printer size={18} />
            Imprimir
          </button>
          <button
            onClick={() => setShowRenewModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            <RefreshCcw size={18} />
            Renovar
          </button>
          <button
            onClick={() => setShowCancelModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            <XCircle size={18} />
            Cancelar
          </button>
        </div>
      )}

      {/* Informações do Cliente */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <User size={20} className="text-blue-500" />
          Segurado
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Nome</label>
            <p className="font-medium">{policy.customer?.fullName}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600 flex items-center gap-1">
              <Mail size={14} />
              Email
            </label>
            <p className="font-medium">{policy.customer?.email}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600 flex items-center gap-1">
              <Phone size={14} />
              Telefone
            </label>
            <p className="font-medium">{policy.customer?.phone}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">CPF</label>
            <p className="font-medium">{policy.customer?.cpf}</p>
          </div>
        </div>
      </div>

      {/* Informações da Seguradora */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Building size={20} className="text-blue-500" />
          Seguradora
        </h2>
        <p className="font-medium text-lg">{policy.insurance_company}</p>
      </div>

      {/* Valores */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <DollarSign size={20} className="text-blue-500" />
          Valores
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-sm text-gray-600">Valor da Bike</label>
            <p className="font-medium text-xl">
              R$ {parseFloat(policy.bike_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Cobertura</label>
            <p className="font-medium text-xl">
              R$ {parseFloat(policy.coverage_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Prêmio Mensal</label>
            <p className="font-bold text-2xl text-green-600">
              R$ {parseFloat(policy.monthly_premium).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Prêmio Anual</label>
            <p className="font-medium text-xl">
              R$ {parseFloat(policy.annual_premium).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          {policy.deductible && (
            <div>
              <label className="text-sm text-gray-600">Franquia</label>
              <p className="font-medium text-lg">
                R$ {parseFloat(policy.deductible).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cobertura */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield size={20} className="text-blue-500" />
          Cobertura
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Tipo</label>
            <p className="font-medium">{policy.coverage_type || 'Cobertura Padrão'}</p>
          </div>
        </div>
      </div>

      {/* Vigência */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar size={20} className="text-blue-500" />
          Vigência
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Início</label>
            <p className="font-medium text-lg">
              {new Date(policy.start_date).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Término</label>
            <p className="font-medium text-lg">
              {new Date(policy.end_date).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </div>

      {/* Observações */}
      {policy.notes && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText size={20} className="text-blue-500" />
            Observações
          </h2>
          <p className="text-gray-700 whitespace-pre-wrap">{policy.notes}</p>
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
                onClick={handleCancel}
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

      {/* Modal Renovar */}
      {showRenewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-xl font-bold mb-4">Renovar Apólice</h3>
            <p className="text-gray-600 mb-6">
              Deseja renovar esta apólice por mais 12 meses com os mesmos valores?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleRenew}
                disabled={renewMutation.isPending}
                className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:bg-gray-400"
              >
                {renewMutation.isPending ? 'Renovando...' : 'Confirmar'}
              </button>
              <button
                onClick={() => setShowRenewModal(false)}
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

export default PolicyDetailPage;
