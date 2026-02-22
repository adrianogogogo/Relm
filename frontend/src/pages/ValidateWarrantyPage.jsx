import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { warrantyAPI } from '../services/api';

export default function ValidateWarrantyPage() {
  const { token } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ['validate-warranty', token],
    queryFn: () => warrantyAPI.validateToken(token),
    retry: false,
  });

  useEffect(() => {
    if (data?.valid) {
      // Pode adicionar analytics aqui
      console.log('Garantia validada:', data.warranty.protocolNumber);
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Validando garantia...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.valid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Token Inválido</h2>
            <p className="text-gray-600 mb-6">
              {error?.response?.data?.message || 'Não foi possível validar esta garantia. Verifique o link e tente novamente.'}
            </p>
            <Link to="/" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Voltar para a Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { warranty } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-8 py-6 text-center">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-white mb-4">
              <svg className="h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Garantia Validada!</h1>
            <p className="text-green-100">Sua garantia Relm Bikes está ativa e protegida</p>
          </div>

          {/* Warranty Details */}
          <div className="p-8 space-y-6">
            {/* Protocol */}
            <div className="text-center pb-6 border-b border-gray-200">
              <p className="text-sm text-gray-500 mb-1">Protocolo</p>
              <p className="text-3xl font-bold text-gray-900">{warranty.protocolNumber}</p>
            </div>

            {/* Customer Info */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Dados do Cliente
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Nome</p>
                  <p className="font-medium text-gray-900">{warranty.customer.fullName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{warranty.customer.email}</p>
                </div>
                <div>
                  <p className="text-gray-500">Telefone</p>
                  <p className="font-medium text-gray-900">{warranty.customer.phone || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
                Produto Coberto
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Modelo</p>
                  <p className="font-medium text-gray-900">{warranty.product.model}</p>
                </div>
                <div>
                  <p className="text-gray-500">Número de Série</p>
                  <p className="font-medium text-gray-900">{warranty.product.serialNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500">Marca</p>
                  <p className="font-medium text-gray-900">{warranty.product.brand}</p>
                </div>
              </div>
            </div>

            {/* Store Info */}
            {warranty.store && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  Loja de Compra
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Nome</p>
                    <p className="font-medium text-gray-900">{warranty.store.tradeName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Localização</p>
                    <p className="font-medium text-gray-900">
                      {warranty.store.city}, {warranty.store.state}
                    </p>
                  </div>
                  {warranty.store.phone && (
                    <div>
                      <p className="text-gray-500">Telefone</p>
                      <p className="font-medium text-gray-900">{warranty.store.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Informações de Validação
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-blue-700">Data de Aprovação</p>
                  <p className="font-medium text-blue-900">
                    {new Date(warranty.approvedAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-blue-700">Primeira Validação</p>
                  <p className="font-medium text-blue-900">
                    {new Date(warranty.validatedAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Important Info */}
            <div className="bg-green-50 border-l-4 border-green-600 p-6 rounded-r-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Garantia Ativa e Protegida</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>
                      Sua garantia Relm Bikes está ativa. Em caso de necessidade de assistência, apresente este
                      protocolo em qualquer loja autorizada.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={() => window.print()}
                className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                Imprimir Comprovante
              </button>
              <Link
                to="/"
                className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Voltar para a Home
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            Dúvidas? Entre em contato:{' '}
            <a href="mailto:garantias@relmbikes.com.br" className="text-blue-600 hover:text-blue-800">
              garantias@relmbikes.com.br
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
