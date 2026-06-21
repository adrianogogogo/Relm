import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdArrowBack, MdSave, MdError } from 'react-icons/md';
import { insuranceAPI, customerAPI } from '../services/api';

const PolicyFormPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const quoteId = searchParams.get('quoteId');

  const [formData, setFormData] = useState({
    customerId: '',
    insuranceCompany: '',
    bikeValue: '',
    coverageValue: '',
    monthlyPremium: '',
    annualPremium: '',
    startDate: '',
    endDate: '',
    coverageType: 'Cobertura Completa',
    deductible: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  // Buscar cotação (se fornecido quoteId)
  const { data: quote } = useQuery({
    queryKey: ['insurance-quote', quoteId],
    queryFn: () => insuranceAPI.getQuoteById(quoteId),
    enabled: !!quoteId
  });

  // Buscar clientes
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: customerAPI.getAll
  });

  // Pré-preencher formulário com dados da cotação
  useEffect(() => {
    if (quote) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);

      setFormData({
        customerId: quote.customer_id || '',
        insuranceCompany: quote.insurance_company || '',
        bikeValue: quote.bike_value || '',
        coverageValue: quote.bike_value || '',
        monthlyPremium: quote.quote_value || '',
        annualPremium: quote.quote_value ? (parseFloat(quote.quote_value) * 12).toFixed(2) : '',
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        coverageType: 'Cobertura Completa',
        deductible: '',
        notes: `Apólice criada a partir da cotação ${quote.protocol_number}`
      });
    }
  }, [quote]);

  // Auto-calcular prêmio anual
  useEffect(() => {
    if (formData.monthlyPremium && !isNaN(formData.monthlyPremium)) {
      const annual = (parseFloat(formData.monthlyPremium) * 12).toFixed(2);
      setFormData(prev => ({ ...prev, annualPremium: annual }));
    }
  }, [formData.monthlyPremium]);

  // Mutation para criar apólice
  const createMutation = useMutation({
    mutationFn: (data) => insuranceAPI.createPolicy(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['insurance-policies']);
      alert(`Apólice ${data.policy_number} criada com sucesso!`);
      navigate('/admin/seguros');
    },
    onError: (error) => {
      alert('Erro ao criar apólice: ' + error.message);
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpar erro do campo ao editar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.customerId) newErrors.customerId = 'Selecione um cliente';
    if (!formData.insuranceCompany) newErrors.insuranceCompany = 'Informe a seguradora';
    if (!formData.bikeValue || parseFloat(formData.bikeValue) <= 0) {
      newErrors.bikeValue = 'Valor da bike inválido';
    }
    if (!formData.coverageValue || parseFloat(formData.coverageValue) <= 0) {
      newErrors.coverageValue = 'Valor da cobertura inválido';
    }
    if (!formData.monthlyPremium || parseFloat(formData.monthlyPremium) <= 0) {
      newErrors.monthlyPremium = 'Prêmio mensal inválido';
    }
    if (!formData.startDate) newErrors.startDate = 'Informe a data de início';
    if (!formData.endDate) newErrors.endDate = 'Informe a data de término';
    
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end <= start) {
        newErrors.endDate = 'Data de término deve ser após a data de início';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) {
      alert('Por favor, corrija os erros no formulário');
      return;
    }

    const payload = {
      ...(quoteId && { quoteId }),
      customerId: formData.customerId,
      insuranceCompany: formData.insuranceCompany,
      bikeValue: parseFloat(formData.bikeValue),
      coverageValue: parseFloat(formData.coverageValue),
      monthlyPremium: parseFloat(formData.monthlyPremium),
      annualPremium: parseFloat(formData.annualPremium),
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      coverageType: formData.coverageType,
      ...(formData.deductible && { deductible: parseFloat(formData.deductible) }),
      ...(formData.notes && { notes: formData.notes })
    };

    createMutation.mutate(payload);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/seguros')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <MdArrowBack size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">
            {quoteId ? 'Criar Apólice da Cotação' : 'Nova Apólice'}
          </h1>
          <p className="text-gray-600 text-sm">
            Preencha os dados para emitir uma nova apólice
          </p>
        </div>
      </div>

      {/* Alerta de conversão */}
      {quoteId && quote && (
        <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
          <div className="flex items-center gap-2">
            <MdError size={20} className="text-blue-600" />
            <div>
              <p className="font-semibold text-blue-800">
                Convertendo cotação {quote.protocol_number}
              </p>
              <p className="text-sm text-blue-700">
                Os dados da cotação foram pré-preenchidos. Revise antes de emitir.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cliente */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Cliente</h2>
          <div>
            <label className="block text-sm font-medium mb-1">
              Cliente *
            </label>
            <select
              name="customerId"
              value={formData.customerId}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg ${errors.customerId ? 'border-red-500' : ''}`}
              required
            >
              <option value="">Selecione um cliente</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.fullName} - {customer.email}
                </option>
              ))}
            </select>
            {errors.customerId && (
              <p className="text-red-500 text-sm mt-1">{errors.customerId}</p>
            )}
          </div>
        </div>

        {/* Seguradora */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Seguradora</h2>
          <div>
            <label className="block text-sm font-medium mb-1">
              Nome da Seguradora *
            </label>
            <input
              type="text"
              name="insuranceCompany"
              value={formData.insuranceCompany}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg ${errors.insuranceCompany ? 'border-red-500' : ''}`}
              placeholder="Ex: Porto Seguro"
              required
            />
            {errors.insuranceCompany && (
              <p className="text-red-500 text-sm mt-1">{errors.insuranceCompany}</p>
            )}
          </div>
        </div>

        {/* Valores */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Valores</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Valor da Bike (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                name="bikeValue"
                value={formData.bikeValue}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg ${errors.bikeValue ? 'border-red-500' : ''}`}
                placeholder="8000.00"
                required
              />
              {errors.bikeValue && (
                <p className="text-red-500 text-sm mt-1">{errors.bikeValue}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Valor da Cobertura (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                name="coverageValue"
                value={formData.coverageValue}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg ${errors.coverageValue ? 'border-red-500' : ''}`}
                placeholder="8000.00"
                required
              />
              {errors.coverageValue && (
                <p className="text-red-500 text-sm mt-1">{errors.coverageValue}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Prêmio Mensal (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                name="monthlyPremium"
                value={formData.monthlyPremium}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg ${errors.monthlyPremium ? 'border-red-500' : ''}`}
                placeholder="89.90"
                required
              />
              {errors.monthlyPremium && (
                <p className="text-red-500 text-sm mt-1">{errors.monthlyPremium}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Prêmio Anual (R$)
              </label>
              <input
                type="number"
                step="0.01"
                name="annualPremium"
                value={formData.annualPremium}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                placeholder="Calculado automaticamente"
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">
                Calculado automaticamente (12x o valor mensal)
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Franquia (R$)
              </label>
              <input
                type="number"
                step="0.01"
                name="deductible"
                value={formData.deductible}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="500.00"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Tipo de Cobertura
              </label>
              <select
                name="coverageType"
                value={formData.coverageType}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option>Cobertura Completa</option>
                <option>Cobertura Básica</option>
                <option>Cobertura Premium</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vigência */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Vigência</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Data de Início *
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg ${errors.startDate ? 'border-red-500' : ''}`}
                required
              />
              {errors.startDate && (
                <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Data de Término *
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg ${errors.endDate ? 'border-red-500' : ''}`}
                required
              />
              {errors.endDate && (
                <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>
              )}
            </div>
          </div>
        </div>

        {/* Observações */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Observações</h2>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Informações adicionais sobre a apólice..."
          />
        </div>

        {/* Ações */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
          >
            <MdSave size={18} />
            {createMutation.isPending ? 'Criando...' : 'Criar Apólice'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/seguros')}
            className="px-6 py-3 bg-gray-300 rounded-lg hover:bg-gray-400"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default PolicyFormPage;
