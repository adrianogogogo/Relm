import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { warrantyAPI } from '../services/api';

export default function WarrantyReviewModal({ warranty, onClose, onSuccess }) {
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const approveMutation = useMutation({
    mutationFn: () => warrantyAPI.approve(warranty.id, { adminNotes }),
    onSuccess: () => {
      alert('✅ Garantia aprovada! Email enviado ao cliente.');
      onSuccess();
    },
    onError: (error) => {
      alert(`❌ Erro ao aprovar: ${error.response?.data?.message || error.message}`);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => warrantyAPI.reject(warranty.id, { rejectionReason, adminNotes }),
    onSuccess: () => {
      alert('✅ Garantia rejeitada. Email enviado ao cliente.');
      onSuccess();
    },
    onError: (error) => {
      alert(`❌ Erro ao rejeitar: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleApprove = () => {
    if (
      !window.confirm(
        `Confirma a APROVAÇÃO da garantia ${warranty.protocolNumber}?\n\nUm email será enviado ao cliente com o token de validação.`,
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
        `Confirma a REJEIÇÃO da garantia ${warranty.protocolNumber}?\n\nMotivo: ${rejectionReason}\n\nUm email será enviado ao cliente.`,
      )
    ) {
      return;
    }
    rejectMutation.mutate();
  };

  const canApprove = warranty.status === 'RECEBIDO' || warranty.status === 'EM_ANALISE';
  const canReject = warranty.status === 'RECEBIDO' || warranty.status === 'EM_ANALISE';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Revisão de Garantia</h2>
            <p className="text-blue-100 text-sm">Protocolo: {warranty.protocolNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 p-2"
            disabled={approveMutation.isPending || rejectMutation.isPending}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Cliente */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">👤 Dados do Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Nome:</span>
                <p className="font-medium text-gray-900">{warranty.customer?.fullName || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>
                <p className="font-medium text-gray-900">{warranty.customer?.email || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">Telefone:</span>
                <p className="font-medium text-gray-900">{warranty.customer?.phone || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">CPF:</span>
                <p className="font-medium text-gray-900">{warranty.customer?.cpf || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Produto */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">🚴 Dados do Produto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Modelo:</span>
                <p className="font-medium text-gray-900">{warranty.product?.model || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">Número de Série:</span>
                <p className="font-medium text-gray-900">{warranty.product?.serialNumber || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">Marca:</span>
                <p className="font-medium text-gray-900">{warranty.product?.brand || 'Relm Bikes'}</p>
              </div>
              <div>
                <span className="text-gray-500">Tipo:</span>
                <p className="font-medium text-gray-900">{warranty.product?.productType || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Loja de Compra */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">🏪 Loja de Compra</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Nome:</span>
                <p className="font-medium text-gray-900">{warranty.purchaseStoreName || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">Localização:</span>
                <p className="font-medium text-gray-900">
                  {warranty.purchaseStoreCity && warranty.purchaseStoreState
                    ? `${warranty.purchaseStoreCity}, ${warranty.purchaseStoreState}`
                    : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Nota Fiscal:</span>
                <p className="font-medium text-gray-900">{warranty.invoiceNumber || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">Data da Compra:</span>
                <p className="font-medium text-gray-900">
                  {warranty.product?.purchaseDate
                    ? new Date(warranty.product.purchaseDate).toLocaleDateString('pt-BR')
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Status Atual */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">📊 Status e Observações</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-blue-700">Status:</span>
                <p className="font-medium text-blue-900">{warranty.status}</p>
              </div>
              {warranty.customerNotes && (
                <div>
                  <span className="text-blue-700">Observações do Cliente:</span>
                  <p className="font-medium text-blue-900 whitespace-pre-wrap">{warranty.customerNotes}</p>
                </div>
              )}
              {warranty.adminNotes && (
                <div>
                  <span className="text-blue-700">Notas Internas:</span>
                  <p className="font-medium text-blue-900 whitespace-pre-wrap">{warranty.adminNotes}</p>
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
              <h3 className="text-lg font-semibold text-red-900">❌ Rejeitar Garantia</h3>
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
            disabled={approveMutation.isPending || rejectMutation.isPending}
          >
            Fechar
          </button>

          <div className="flex space-x-3">
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
                ✓ Aprovar Garantia
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
