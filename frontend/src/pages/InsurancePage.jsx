import React, { useState, useEffect } from 'react';
import { Shield, FileText, Clock, CheckCircle, XCircle, DollarSign, Calendar } from 'lucide-react';

const InsurancePage = () => {
  const [activeTab, setActiveTab] = useState('policies'); // 'policies' ou 'quotes'
  const [policies, setPolicies] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Dados mockados - substituir por API real
      const mockPolicies = [
        {
          id: '1',
          policyNumber: 'POL-2026-001',
          customerName: 'João Silva',
          customerEmail: 'joao@email.com',
          bikeModel: 'Trek Marlin 7',
          bikeValue: 5000,
          premium: 450,
          status: 'active',
          startDate: '2026-01-15',
          endDate: '2027-01-15',
          coverageType: 'complete',
        },
        {
          id: '2',
          policyNumber: 'POL-2026-002',
          customerName: 'Maria Santos',
          customerEmail: 'maria@email.com',
          bikeModel: 'Specialized Rockhopper',
          bikeValue: 4500,
          premium: 400,
          status: 'active',
          startDate: '2026-02-01',
          endDate: '2027-02-01',
          coverageType: 'basic',
        },
      ];

      const mockQuotes = [
        {
          id: '1',
          quoteNumber: 'QUO-2026-001',
          customerName: 'Pedro Oliveira',
          customerEmail: 'pedro@email.com',
          bikeModel: 'Cannondale Trail 8',
          bikeValue: 6000,
          premium: 540,
          status: 'pending',
          createdAt: '2026-02-23',
          validUntil: '2026-03-09',
        },
        {
          id: '2',
          quoteNumber: 'QUO-2026-002',
          customerName: 'Ana Costa',
          customerEmail: 'ana@email.com',
          bikeModel: 'Giant Talon 2',
          bikeValue: 3500,
          premium: 315,
          status: 'approved',
          createdAt: '2026-02-22',
          validUntil: '2026-03-08',
        },
      ];

      setPolicies(mockPolicies);
      setQuotes(mockQuotes);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: 'Ativa', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      expired: { label: 'Expirada', color: 'bg-gray-100 text-gray-800', icon: XCircle },
      cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800', icon: XCircle },
      pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { label: 'Aprovada', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { label: 'Rejeitada', color: 'bg-red-100 text-red-800', icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-xl text-gray-600">Carregando seguros...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Gerenciar Seguros</h1>
        <p className="text-gray-600 mt-2">Apólices ativas e cotações de seguro</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('policies')}
            className={`pb-4 px-1 border-b-2 font-semibold transition-colors ${
              activeTab === 'policies'
                ? 'border-[#00BCD4] text-[#00BCD4]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Apólices Ativas ({policies.length})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('quotes')}
            className={`pb-4 px-1 border-b-2 font-semibold transition-colors ${
              activeTab === 'quotes'
                ? 'border-[#00BCD4] text-[#00BCD4]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Cotações ({quotes.length})</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'policies' ? (
        // Apólices Ativas
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {policies.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Nenhuma apólice ativa
              </h3>
              <p className="text-gray-500">As apólices ativas aparecerão aqui</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Número da Apólice
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Cliente
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Bike
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Valor Segurado
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Prêmio
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Vigência
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {policies.map((policy) => (
                    <tr key={policy.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-800">{policy.policyNumber}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800">{policy.customerName}</div>
                        <div className="text-sm text-gray-500">{policy.customerEmail}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-800">{policy.bikeModel}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-gray-800">
                          <DollarSign className="w-4 h-4 mr-1 text-[#00BCD4]" />
                          {policy.bikeValue.toLocaleString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center font-semibold text-green-600">
                          <DollarSign className="w-4 h-4 mr-1" />
                          {policy.premium.toLocaleString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-700">
                          <Calendar className="w-4 h-4 mr-1 text-[#00BCD4]" />
                          {new Date(policy.startDate).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-xs text-gray-500">
                          até {new Date(policy.endDate).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">{getStatusBadge(policy.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        // Cotações
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {quotes.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Nenhuma cotação</h3>
              <p className="text-gray-500">As cotações aparecerão aqui</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Número da Cotação
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Cliente
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Bike
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Valor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Prêmio
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Válida até
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {quotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-800">{quote.quoteNumber}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800">{quote.customerName}</div>
                        <div className="text-sm text-gray-500">{quote.customerEmail}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-800">{quote.bikeModel}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-gray-800">
                          <DollarSign className="w-4 h-4 mr-1 text-[#00BCD4]" />
                          {quote.bikeValue.toLocaleString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center font-semibold text-green-600">
                          <DollarSign className="w-4 h-4 mr-1" />
                          {quote.premium.toLocaleString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">
                          {new Date(quote.validUntil).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">{getStatusBadge(quote.status)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          {quote.status === 'pending' && (
                            <>
                              <button
                                onClick={() => alert('Aprovar cotação ' + quote.quoteNumber)}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded transition-colors"
                              >
                                Aprovar
                              </button>
                              <button
                                onClick={() => alert('Rejeitar cotação ' + quote.quoteNumber)}
                                className="px-3 py-1 bg-[#FF4043] hover:bg-[#FF4043]/90 text-white text-xs font-semibold rounded transition-colors"
                              >
                                Rejeitar
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InsurancePage;
