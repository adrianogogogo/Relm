import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { X, Check, User, Package, Store, Calendar, CheckCircle, Printer, Home } from 'lucide-react';
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
      <div className="min-h-screen bg-app dark:bg-app-dark flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600">Validando garantia...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.valid) {
    return (
      <div className="min-h-screen bg-app dark:bg-app-dark flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="card p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-error/15 mb-4">
              <X className="h-8 w-8 text-error" />
            </div>
            <h2 className="font-title text-2xl font-bold text-gray-900 mb-2">Token Inválido</h2>
            <p className="text-gray-600 mb-6">
              {error?.response?.data?.message || 'Não foi possível validar esta garantia. Verifique o link e tente novamente.'}
            </p>
            <Link to="/" className="btn btn-primary inline-flex">
              Voltar para a Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { warranty } = data;

  return (
    <div className="min-h-screen bg-app dark:bg-app-dark py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="card p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-success-600 to-success-700 px-8 py-6 text-center">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-white mb-4">
              <Check className="h-12 w-12 text-success-600" />
            </div>
            <h1 className="font-title text-3xl font-bold text-white mb-2">Garantia Validada!</h1>
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
            <div className="bg-gray-50 dark:bg-slate-900/40 rounded-lg p-6">
              <h3 className="font-title text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-primary" />
                Dados do Cliente
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Nome</p>
                  <p className="font-medium text-gray-900">{warranty.customer.firstName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{warranty.customer.email || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="bg-gray-50 dark:bg-slate-900/40 rounded-lg p-6">
              <h3 className="font-title text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2 text-primary" />
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
              <div className="bg-gray-50 dark:bg-slate-900/40 rounded-lg p-6">
                <h3 className="font-title text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Store className="h-5 w-5 mr-2 text-primary" />
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
            <div className="bg-info/10 border border-info/30 rounded-lg p-6">
              <h3 className="font-title text-lg font-semibold text-info-700 dark:text-info-100 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-info" />
                Informações de Validação
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-info-700 dark:text-info-100">Data de Aprovação</p>
                  <p className="font-medium text-info-700 dark:text-info-100">
                    {new Date(warranty.approvedAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-info-700 dark:text-info-100">Primeira Validação</p>
                  <p className="font-medium text-info-700 dark:text-info-100">
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
            <div className="bg-success/10 border-l-4 border-success p-6 rounded-r-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-semibold text-success-700 dark:text-success-100">Garantia Ativa e Protegida</h3>
                  <div className="mt-2 text-sm text-success-700 dark:text-success-100">
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
                className="btn btn-outline flex-1"
              >
                <Printer className="h-5 w-5 mr-2" />
                Imprimir Comprovante
              </button>
              <Link
                to="/"
                className="btn btn-primary flex-1"
              >
                <Home className="h-5 w-5 mr-2" />
                Voltar para a Home
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            Dúvidas? Entre em contato:{' '}
            <a href="mailto:garantias@relmbikes.com.br" className="text-primary hover:text-primary-700">
              garantias@relmbikes.com.br
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
