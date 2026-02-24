import { useState, useEffect } from 'react';
import { insurancePoliciesAPI, insuranceQuotesAPI } from '../services/insurancePoliciesAPI';
import { Shield, Plus, Edit2, Trash2, X, AlertCircle, TrendingUp, FileText } from 'lucide-react';

export default function InsurancePoliciesPage() {
  const [activeTab, setActiveTab] = useState('policies'); // 'policies' or 'quotes'
  const [policies, setPolicies] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);

  // Form fields
  const [policyNumber, setPolicyNumber] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [insuranceCompany, setInsuranceCompany] = useState('');
  const [policyValue, setPolicyValue] = useState('');
  const [coverageAmount, setCoverageAmount] = useState('');
  const [deductible, setDeductible] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [paymentDay, setPaymentDay] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'policies') {
        const [policiesRes, statsRes] = await Promise.all([
          insurancePoliciesAPI.getAll(),
          insurancePoliciesAPI.getStatistics(),
        ]);
        setPolicies(policiesRes.data);
        setStatistics(statsRes.data);
      } else {
        const quotesRes = await insuranceQuotesAPI.getAll();
        setQuotes(quotesRes.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const policyData = {
      policyNumber,
      customerId,
      insuranceCompany,
      policyValue: parseFloat(policyValue),
      coverageAmount: parseFloat(coverageAmount),
      deductible: deductible ? parseFloat(deductible) : undefined,
      startDate,
      endDate,
      status,
      monthlyPayment: monthlyPayment ? parseFloat(monthlyPayment) : undefined,
      paymentDay: paymentDay ? parseInt(paymentDay) : undefined,
      notes,
    };

    try {
      if (editingPolicy) {
        await insurancePoliciesAPI.update(editingPolicy.id, policyData);
        alert('Apólice atualizada com sucesso!');
      } else {
        await insurancePoliciesAPI.create(policyData);
        alert('Apólice criada com sucesso!');
      }

      resetForm();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar apólice:', error);
      alert('Erro ao salvar apólice: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (policy) => {
    setEditingPolicy(policy);
    setPolicyNumber(policy.policyNumber);
    setCustomerId(policy.customerId);
    setInsuranceCompany(policy.insuranceCompany);
    setPolicyValue(policy.policyValue);
    setCoverageAmount(policy.coverageAmount);
    setDeductible(policy.deductible || '');
    setStartDate(policy.startDate.split('T')[0]);
    setEndDate(policy.endDate.split('T')[0]);
    setStatus(policy.status);
    setMonthlyPayment(policy.monthlyPayment || '');
    setPaymentDay(policy.paymentDay || '');
    setNotes(policy.notes || '');
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta apólice?')) return;

    try {
      await insurancePoliciesAPI.delete(id);
      alert('Apólice excluída com sucesso!');
      loadData();
    } catch (error) {
      console.error('Erro ao excluir apólice:', error);
      alert('Erro ao excluir apólice');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await insurancePoliciesAPI.updateStatus(id, newStatus);
      alert('Status atualizado com sucesso!');
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status');
    }
  };

  const resetForm = () => {
    setEditingPolicy(null);
    setPolicyNumber('');
    setCustomerId('');
    setInsuranceCompany('');
    setPolicyValue('');
    setCoverageAmount('');
    setDeductible('');
    setStartDate('');
    setEndDate('');
    setStatus('ACTIVE');
    setMonthlyPayment('');
    setPaymentDay('');
    setNotes('');
    setShowForm(false);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status) => {
    const colors = {
      ACTIVE: 'bg-[#00FF8E] text-gray-900',
      SUSPENDED: 'bg-yellow-100 text-yellow-800',
      CANCELLED: 'bg-[#FF4043] text-white',
      EXPIRED: 'bg-gray-200 text-gray-600',
    };
    return colors[status] || 'bg-gray-200 text-gray-600';
  };

  const getStatusLabel = (status) => {
    const labels = {
      ACTIVE: 'Ativa',
      SUSPENDED: 'Suspensa',
      CANCELLED: 'Cancelada',
      EXPIRED: 'Expirada',
      PENDING: 'Pendente',
      APPROVED: 'Aprovada',
      CONVERTED: 'Convertida',
      REJECTED: 'Rejeitada',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00BCD4]"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Seguros</h1>
            <p className="text-gray-600 mt-1">Gerencie apólices e cotações de seguro</p>
          </div>
          {activeTab === 'policies' && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-[#00BCD4] text-white px-4 py-2 rounded-lg hover:bg-[#2FC0D3] transition-colors"
            >
              {showForm ? <X size={20} /> : <Plus size={20} />}
              {showForm ? 'Cancelar' : 'Nova Apólice'}
            </button>
          )}
        </div>

        {/* Statistics */}
        {activeTab === 'policies' && statistics && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600 mb-1">Total</div>
              <div className="text-2xl font-bold text-gray-900">{statistics.total}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600 mb-1">Ativas</div>
              <div className="text-2xl font-bold text-[#00FF8E]">{statistics.active}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600 mb-1">Suspensas</div>
              <div className="text-2xl font-bold text-yellow-600">{statistics.suspended}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600 mb-1">Canceladas</div>
              <div className="text-2xl font-bold text-[#FF4043]">{statistics.cancelled}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600 mb-1">Expiradas</div>
              <div className="text-2xl font-bold text-gray-500">{statistics.expired}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600 mb-1">Vencendo</div>
              <div className="text-2xl font-bold text-orange-600">{statistics.expiringSoon}</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('policies')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'policies'
                ? 'bg-[#00BCD4] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <Shield size={20} />
              Apólices Ativas
            </div>
          </button>
          <button
            onClick={() => setActiveTab('quotes')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'quotes'
                ? 'bg-[#00BCD4] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText size={20} />
              Cotações
            </div>
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && activeTab === 'policies' && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            {editingPolicy ? 'Editar Apólice' : 'Nova Apólice'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número da Apólice *
                </label>
                <input
                  type="text"
                  value={policyNumber}
                  onChange={(e) => setPolicyNumber(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID do Cliente *
                </label>
                <input
                  type="text"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  required
                  placeholder="UUID do cliente"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seguradora *
                </label>
                <input
                  type="text"
                  value={insuranceCompany}
                  onChange={(e) => setInsuranceCompany(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] text-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor da Apólice *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={policyValue}
                  onChange={(e) => setPolicyValue(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor de Cobertura *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={coverageAmount}
                  onChange={(e) => setCoverageAmount(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Franquia
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={deductible}
                  onChange={(e) => setDeductible(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] text-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Início *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Fim *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] text-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] text-black"
                >
                  <option value="ACTIVE">Ativa</option>
                  <option value="SUSPENDED">Suspensa</option>
                  <option value="CANCELLED">Cancelada</option>
                  <option value="EXPIRED">Expirada</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pagamento Mensal
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={monthlyPayment}
                  onChange={(e) => setMonthlyPayment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dia de Pagamento
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={paymentDay}
                  onChange={(e) => setPaymentDay(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] text-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] text-black"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-[#00BCD4] text-white px-6 py-2 rounded-lg hover:bg-[#2FC0D3] transition-colors"
              >
                {editingPolicy ? 'Atualizar' : 'Criar'} Apólice
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Policies List */}
      {activeTab === 'policies' && (
        <div className="space-y-4">
          {policies.map((policy) => (
            <div key={policy.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Apólice #{policy.policyNumber}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(policy.status)}`}>
                      {getStatusLabel(policy.status)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p><strong>Seguradora:</strong> {policy.insuranceCompany}</p>
                    <p><strong>Cliente:</strong> {policy.customer?.fullName || policy.customerId}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(policy)}
                    className="p-2 text-[#00BCD4] hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button
                    onClick={() => handleDelete(policy.id)}
                    className="p-2 text-[#FF4043] hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Valor da Apólice</div>
                  <div className="text-sm font-medium text-gray-900">{formatCurrency(policy.policyValue)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Cobertura</div>
                  <div className="text-sm font-medium text-gray-900">{formatCurrency(policy.coverageAmount)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Vigência</div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatDate(policy.startDate)} - {formatDate(policy.endDate)}
                  </div>
                </div>
                {policy.monthlyPayment && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Pagamento Mensal</div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(policy.monthlyPayment)} - Dia {policy.paymentDay}
                    </div>
                  </div>
                )}
              </div>

              {policy.notes && (
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  <strong>Observações:</strong> {policy.notes}
                </div>
              )}
            </div>
          ))}
          {policies.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg">
              <Shield size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Nenhuma apólice cadastrada</p>
            </div>
          )}
        </div>
      )}

      {/* Quotes List */}
      {activeTab === 'quotes' && (
        <div className="space-y-4">
          {quotes.map((quote) => (
            <div key={quote.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Cotação #{quote.protocolNumber}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(quote.status)}`}>
                      {getStatusLabel(quote.status)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p><strong>Cliente:</strong> {quote.customer?.fullName || quote.customerId}</p>
                    {quote.insuranceCompany && (
                      <p><strong>Seguradora:</strong> {quote.insuranceCompany}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quote.bikeValue && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Valor da Bike</div>
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(quote.bikeValue)}</div>
                  </div>
                )}
                {quote.quoteValue && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Valor da Cotação</div>
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(quote.quoteValue)}</div>
                  </div>
                )}
                {quote.city && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Local</div>
                    <div className="text-sm font-medium text-gray-900">
                      {quote.city}, {quote.state}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-gray-500 mb-1">Data</div>
                  <div className="text-sm font-medium text-gray-900">{formatDate(quote.createdAt)}</div>
                </div>
              </div>
            </div>
          ))}
          {quotes.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Nenhuma cotação cadastrada</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
