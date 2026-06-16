import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, User, Bike, Store, FileText, XCircle, Check, Play } from 'lucide-react';
import { warrantyAPI } from '../services/api';

export default function WarrantyReviewModal({ warranty, onClose, onSuccess }) {
  const [currentWarranty, setCurrentWarranty] = useState(warranty);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const startAnalysisMutation = useMutation({
    mutationFn: () => warrantyAPI.updateStatus(currentWarranty.id, { to_status: 'EM_ANALISE' }),
    onSuccess: (data) => {
      alert('✅ Análise iniciada com sucesso!');
      setCurrentWarranty(data);
      onSuccess();
    },
    onError: (error) => {
      alert(`❌ Erro ao iniciar análise: ${error.response?.data?.message || error.message}`);
    },
  });

  const approveMutation = useMutation({
    mutationFn: () => warrantyAPI.approve(currentWarranty.id, { adminNotes }),
    onSuccess: () => {
      alert('✅ Garantia aprovada! Email enviado ao cliente.');
      onSuccess();
      onClose();
    },
    onError: (error) => {
      alert(`❌ Erro ao aprovar: ${error.response?.data?.message || error.message}`);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => warrantyAPI.reject(currentWarranty.id, { rejectionReason, adminNotes }),
    onSuccess: () => {
      alert('✅ Garantia rejeitada. Email enviado ao cliente.');
      onSuccess();
      onClose();
    },
    onError: (error) => {
      alert(`❌ Erro ao rejeitar: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleStartAnalysis = () => {
    if (
      !window.confirm(
        `Deseja iniciar a análise da garantia ${currentWarranty.protocolNumber}?`
      )
    ) {
      return;
    }
    startAnalysisMutation.mutate();
  };

  const handleApprove = () => {
    if (
      !window.confirm(
        `Confirma a APROVAÇÃO da garantia ${currentWarranty.protocolNumber}?\n\nUm email será enviado ao cliente com o token de validação.`,
      )
    ) {
      return;
    }
    approveMutation.mutate();
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert('Por favor, informe o motivo da rejeição.');
      return;
    }
    if (
      !window.confirm(
        `Confirma a REJEIÇÃO da garantia ${currentWarranty.protocolNumber}?\n\nMotivo: ${rejectionReason}\n\nUm email será enviado ao cliente.`,
      )
    ) {
      return;
    }
    rejectMutation.mutate();
  };

  const canApprove = currentWarranty.status === 'EM_ANALISE';
  const canReject = currentWarranty.status === 'EM_ANALISE';
  const canStartAnalysis = currentWarranty.status === 'RECEBIDO';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Revisão de Garantia</h2>
            <p className="text-blue-100 text-sm">Protocolo: {currentWarranty.protocolNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 p-2"
            disabled={approveMutation.isPending || rejectMutation.isPending || startAnalysisMutation.isPending}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Cliente */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <User size={18} className="text-gray-500" /> Dados do Cliente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Nome:</span>
                <p className="font-medium text-gray-900">{currentWarranty.customer?.fullName || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>
                <p className="font-medium text-gray-900">{currentWarranty.customer?.email || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">Telefone:</span>
                <p className="font-medium text-gray-900">{currentWarranty.customer?.phone || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">CPF:</span>
                <p className="font-medium text-gray-900">{currentWarranty.customer?.cpf || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Produto */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Bike size={18} className="text-gray-500" /> Dados do Produto
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Modelo:</span>
                <p className="font-medium text-gray-900">{currentWarranty.product?.model || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">Número de Série:</span>
                <p className="font-medium text-gray-900">{currentWarranty.product?.serialNumber || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">Marca:</span>
                <p className="font-medium text-gray-900">{currentWarranty.product?.brand || 'Relm Bikes'}</p>
              </div>
              <div>
                <span className="text-gray-500">Tipo:</span>
                <p className="font-medium text-gray-900">{currentWarranty.product?.productType || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Loja de Compra */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Store size={18} className="text-gray-500" /> Loja de Compra
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Nome:</span>
                <p className="font-medium text-gray-900">{currentWarranty.purchaseStoreName || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">Localização:</span>
                <p className="font-medium text-gray-900">
                  {currentWarranty.purchaseStoreCity && currentWarranty.purchaseStoreState
                    ? `${currentWarranty.purchaseStoreCity}, ${currentWarranty.purchaseStoreState}`
                    : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Nota Fiscal:</span>
                <p className="font-medium text-gray-900">{currentWarranty.invoiceNumber || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">Data da Compra:</span>
                <p className="font-medium text-gray-900">
                  {currentWarranty.product?.purchaseDate
                    ? new Date(currentWarranty.product.purchaseDate).toLocaleDateString('pt-BR')
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Status Atual */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <FileText size={18} className="text-blue-500" /> Status e Observações
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-blue-700">Status:</span>
                <span className={`inline-block ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  currentWarranty.status === 'RECEBIDO' ? 'bg-blue-100 text-blue-800' :
                  currentWarranty.status === 'EM_ANALISE' ? 'bg-yellow-100 text-yellow-800' :
                  currentWarranty.status === 'AGUARDANDO_CLIENTE' ? 'bg-orange-100 text-orange-800' :
                  currentWarranty.status === 'APROVADO' ? 'bg-green-100 text-green-800' :
                  currentWarranty.status === 'REPROVADO' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {currentWarranty.status}
                </span>
              </div>
              {currentWarranty.customerNotes && (
                <div>
                  <span className="text-blue-700">Observações do Cliente:</span>
                  <p className="font-medium text-blue-900 whitespace-pre-wrap">{currentWarranty.customerNotes}</p>
                </div>
              )}
              {currentWarranty.adminNotes && (
                <div>
                  <span className="text-blue-700">Notas Internas:</span>
                  <p className="font-medium text-blue-900 whitespace-pre-wrap">{currentWarranty.adminNotes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Notas Admin */}
          {canApprove && !showRejectForm && (
            <div>
              <label htmlFor="adminNotes" className="block text-sm font-medium text-gray-700 mb-2">
                Notas Internas (opcional)
              </label>
              <textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Adicione observações internas sobre esta garantia..."
              />
            </div>
          )}

          {/* Formulário de Rejeição */}
          {showRejectForm && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold text-red-900 flex items-center gap-2">
                <XCircle size={18} className="text-red-500" /> Rejeitar Garantia
              </h3>
              <div>
                <label htmlFor="rejectionReason" className="block text-sm font-medium text-red-700 mb-2">
                  Motivo da Rejeição *
                </label>
                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-red-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Explique ao cliente o motivo da rejeição..."
                  required
                />
              </div>
              <div>
                <label htmlFor="adminNotesReject" className="block text-sm font-medium text-red-700 mb-2">
                  Notas Internas (opcional)
                </label>
                <textarea
                  id="adminNotesReject"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-red-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Observações internas..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            disabled={approveMutation.isPending || rejectMutation.isPending || startAnalysisMutation.isPending}
          >
            Fechar
          </button>

          <div className="flex space-x-3">
            {canStartAnalysis && (
              <button
                onClick={handleStartAnalysis}
                disabled={startAnalysisMutation.isPending}
                className="px-6 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {startAnalysisMutation.isPending && (
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                <Play size={16} /> Iniciar Análise
              </button>
            )}

            {canReject && !showRejectForm && (
              <button
                onClick={() => setShowRejectForm(true)}
                className="px-6 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50 disabled:opacity-50"
                disabled={approveMutation.isPending || rejectMutation.isPending}
              >
                Rejeitar
              </button>
            )}

            {showRejectForm && (
              <>
                <button
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectionReason('');
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                  disabled={rejectMutation.isPending}
                >
                  Cancelar Rejeição
                </button>
                <button
                  onClick={handleReject}
                  disabled={rejectMutation.isPending || !rejectionReason.trim()}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {rejectMutation.isPending && (
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  Confirmar Rejeição
                </button>
              </>
            )}

            {canApprove && !showRejectForm && (
              <button
                onClick={handleApprove}
                disabled={approveMutation.isPending}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {approveMutation.isPending && (
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                <span className="flex items-center gap-1"><Check size={16} /> Aprovar Garantia</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
