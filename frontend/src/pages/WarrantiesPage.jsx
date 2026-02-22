import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { warrantyAPI } from '../services/api';
import WarrantyReviewModal from '../components/WarrantyReviewModal';

export default function WarrantiesPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarranty, setSelectedWarranty] = useState(null);

  const { data: warranties, isLoading, refetch } = useQuery({
    queryKey: ['warranties', statusFilter, searchTerm],
    queryFn: () =>
      warrantyAPI.getAll({
        status: statusFilter || undefined,
        search: searchTerm || undefined,
      }),
  });

  const stats = warranties
    ? {
        total: warranties.length,
        pending: warranties.filter((w) => w.status === 'RECEBIDO' || w.status === 'EM_ANALISE').length,
        approved: warranties.filter((w) => w.status === 'APROVADO').length,
        rejected: warranties.filter((w) => w.status === 'REPROVADO').length,
      }
    : { total: 0, pending: 0, approved: 0, rejected: 0 };

  const getStatusBadge = (status) => {
    const badges = {
      RECEBIDO: 'bg-blue-100 text-blue-800',
      EM_ANALISE: 'bg-yellow-100 text-yellow-800',
      AGUARDANDO_CLIENTE: 'bg-orange-100 text-orange-800',
      APROVADO: 'bg-green-100 text-green-800',
      REPROVADO: 'bg-red-100 text-red-800',
      FINALIZADO: 'bg-gray-100 text-gray-800',
      CANCELADO: 'bg-gray-100 text-gray-800',
    };
    const labels = {
      RECEBIDO: 'Recebido',
      EM_ANALISE: 'Em Análise',
      AGUARDANDO_CLIENTE: 'Aguardando Cliente',
      APROVADO: 'Aprovado',
      REPROVADO: 'Reprovado',
      FINALIZADO: 'Finalizado',
      CANCELADO: 'Cancelado',
    };
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Garantias</h1>
              <p className="mt-2 text-gray-600">Gerencie as solicitações de garantia</p>
            </div>
            <Link to="/admin" className="text-blue-600 hover:text-blue-800">
              ← Voltar ao Dashboard
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-5">
                <dt className="text-sm font-medium text-gray-500">Total</dt>
                <dd className="text-2xl font-semibold text-gray-900">{stats.total}</dd>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5">
                <dt className="text-sm font-medium text-gray-500">Pendentes</dt>
                <dd className="text-2xl font-semibold text-gray-900">{stats.pending}</dd>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5">
                <dt className="text-sm font-medium text-gray-500">Aprovadas</dt>
                <dd className="text-2xl font-semibold text-gray-900">{stats.approved}</dd>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5">
                <dt className="text-sm font-medium text-gray-500">Reprovadas</dt>
                <dd className="text-2xl font-semibold text-gray-900">{stats.rejected}</dd>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Protocolo, cliente, produto..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos os status</option>
                <option value="RECEBIDO">Recebido</option>
                <option value="EM_ANALISE">Em Análise</option>
                <option value="AGUARDANDO_CLIENTE">Aguardando Cliente</option>
                <option value="APROVADO">Aprovado</option>
                <option value="REPROVADO">Reprovado</option>
                <option value="FINALIZADO">Finalizado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-500">Carregando garantias...</p>
            </div>
          ) : warranties && warranties.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Protocolo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {warranties.map((warranty) => (
                    <tr key={warranty.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{warranty.protocolNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{warranty.customer?.fullName || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{warranty.customer?.email || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{warranty.product?.model || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{warranty.product?.serialNumber || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(warranty.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(warranty.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedWarranty(warranty)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Revisar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma garantia encontrada</h3>
              <p className="mt-1 text-sm text-gray-500">Ajuste os filtros ou aguarde novas solicitações.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Revisão */}
      {selectedWarranty && (
        <WarrantyReviewModal
          warranty={selectedWarranty}
          onClose={() => setSelectedWarranty(null)}
          onSuccess={() => {
            setSelectedWarranty(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
