import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { storesAPI } from '../services/api';

export default function StoreFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    tradeName: '',
    legalName: '',
    cnpj: '',
    aliases: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    latitude: '',
    longitude: '',
    active: true,
  });

  const [errors, setErrors] = useState({});

  // Carregar dados da loja para edição
  const { data: store, isLoading: isLoadingStore } = useQuery({
    queryKey: ['store', id],
    queryFn: () => storesAPI.getById(id),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (store) {
      setFormData({
        tradeName: store.tradeName || '',
        legalName: store.legalName || '',
        cnpj: store.cnpj || '',
        aliases: store.aliases?.join(', ') || '',
        email: store.email || '',
        phone: store.phone || '',
        address: store.address || '',
        city: store.city || '',
        state: store.state || '',
        zipCode: store.zipCode || '',
        latitude: store.latitude || '',
        longitude: store.longitude || '',
        active: store.active !== false,
      });
    }
  }, [store]);

  const createMutation = useMutation({
    mutationFn: storesAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      alert('Loja cadastrada com sucesso!');
      navigate('/admin/stores');
    },
    onError: (error) => {
      alert(`Erro ao cadastrar loja: ${error.response?.data?.message || error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => storesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      queryClient.invalidateQueries({ queryKey: ['store', id] });
      alert('Loja atualizada com sucesso!');
      navigate('/admin/stores');
    },
    onError: (error) => {
      alert(`Erro ao atualizar loja: ${error.response?.data?.message || error.message}`);
    },
  });

  const validate = () => {
    const newErrors = {};

    if (!formData.tradeName.trim()) {
      newErrors.tradeName = 'Nome fantasia é obrigatório';
    }

    if (!formData.legalName.trim()) {
      newErrors.legalName = 'Razão social é obrigatória';
    }

    if (formData.cnpj && !/^\d{14}$/.test(formData.cnpj.replace(/\D/g, ''))) {
      newErrors.cnpj = 'CNPJ inválido (deve ter 14 dígitos)';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'Cidade é obrigatória';
    }

    if (!formData.state) {
      newErrors.state = 'Estado é obrigatório';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const payload = {
      ...formData,
      aliases: formData.aliases
        ? formData.aliases.split(',').map((alias) => alias.trim()).filter(Boolean)
        : [],
    };

    if (isEditMode) {
      updateMutation.mutate({ id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Limpar erro do campo ao digitar
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Máscaras
  const handleCNPJChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 14) {
      value = value.replace(/^(\d{2})(\d)/, '$1.$2');
      value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
      value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
      value = value.replace(/(\d{4})(\d)/, '$1-$2');
      setFormData((prev) => ({ ...prev, cnpj: value }));
    }
    if (errors.cnpj) {
      setErrors((prev) => ({ ...prev, cnpj: '' }));
    }
  };

  const handleCEPChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 8) {
      value = value.replace(/^(\d{5})(\d)/, '$1-$2');
      setFormData((prev) => ({ ...prev, zipCode: value }));
    }
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
      value = value.replace(/(\d)(\d{4})$/, '$1-$2');
      setFormData((prev) => ({ ...prev, phone: value }));
    }
  };

  const states = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
  ];

  if (isEditMode && isLoadingStore) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">Carregando dados da loja...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/admin/stores" className="text-blue-600 hover:text-blue-800 flex items-center mb-4">
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar para Lojas
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? 'Editar Loja' : 'Nova Loja Parceira'}
          </h1>
          <p className="mt-2 text-gray-600">
            {isEditMode
              ? 'Atualize as informações da loja parceira'
              : 'Cadastre uma nova loja autorizada Relm'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Informações Básicas */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações Básicas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="tradeName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Fantasia *
                </label>
                <input
                  type="text"
                  id="tradeName"
                  name="tradeName"
                  value={formData.tradeName}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.tradeName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Bike Shop Center"
                />
                {errors.tradeName && <p className="mt-1 text-sm text-red-500">{errors.tradeName}</p>}
              </div>

              <div>
                <label htmlFor="legalName" className="block text-sm font-medium text-gray-700 mb-2">
                  Razão Social *
                </label>
                <input
                  type="text"
                  id="legalName"
                  name="legalName"
                  value={formData.legalName}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.legalName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Bike Shop Center LTDA"
                />
                {errors.legalName && <p className="mt-1 text-sm text-red-500">{errors.legalName}</p>}
              </div>

              <div>
                <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700 mb-2">
                  CNPJ
                </label>
                <input
                  type="text"
                  id="cnpj"
                  name="cnpj"
                  value={formData.cnpj}
                  onChange={handleCNPJChange}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.cnpj ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="00.000.000/0000-00"
                />
                {errors.cnpj && <p className="mt-1 text-sm text-red-500">{errors.cnpj}</p>}
              </div>

              <div>
                <label htmlFor="aliases" className="block text-sm font-medium text-gray-700 mb-2">
                  Nomes Alternativos
                </label>
                <input
                  type="text"
                  id="aliases"
                  name="aliases"
                  value={formData.aliases}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Bike Shop, Loja Center (separar por vírgula)"
                />
                <p className="mt-1 text-xs text-gray-500">Variações do nome da loja (separadas por vírgula)</p>
              </div>
            </div>
          </div>

          {/* Contato */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contato</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="contato@bikeshop.com.br"
                />
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Localização</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-2">
                  CEP
                </label>
                <input
                  type="text"
                  id="zipCode"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleCEPChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="00000-000"
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço Completo
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Rua, número, complemento"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="São Paulo"
                  />
                  {errors.city && <p className="mt-1 text-sm text-red-500">{errors.city}</p>}
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                    Estado *
                  </label>
                  <select
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.state ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecione...</option>
                    {states.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  {errors.state && <p className="mt-1 text-sm text-red-500">{errors.state}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude
                  </label>
                  <input
                    type="text"
                    id="latitude"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="-23.550520"
                  />
                  <p className="mt-1 text-xs text-gray-500">Para exibir no mapa (opcional)</p>
                </div>

                <div>
                  <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude
                  </label>
                  <input
                    type="text"
                    id="longitude"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="-46.633308"
                  />
                  <p className="mt-1 text-xs text-gray-500">Para exibir no mapa (opcional)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          {isEditMode && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  name="active"
                  checked={formData.active}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                  Loja ativa (visível para clientes)
                </label>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <Link
              to="/admin/stores"
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {isEditMode ? 'Salvar Alterações' : 'Cadastrar Loja'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
