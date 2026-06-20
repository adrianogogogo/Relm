import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { storesAPI } from '../services/api';
import { Card } from '../components/ui';

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
      <div className="min-h-screen py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-500 dark:text-slate-400">Carregando dados da loja...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/admin/stores" className="text-primary dark:text-primary-400 hover:underline flex items-center mb-4 text-sm font-semibold w-fit">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Lojas
          </Link>
          <h1 className="font-title text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">
            {isEditMode ? 'Editar Loja' : 'Nova Loja Parceira'}
          </h1>
          <p className="mt-1 text-gray-500 dark:text-slate-400 text-sm">
            {isEditMode
              ? 'Atualize as informações da loja parceira'
              : 'Cadastre uma nova loja autorizada Relm'}
          </p>
        </div>

        {/* Form */}
        <Card as="form" onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div>
            <h2 className="font-title text-lg font-bold text-gray-900 dark:text-slate-100 mb-4">Informações Básicas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="tradeName" className="label">
                  Nome Fantasia *
                </label>
                <input
                  type="text"
                  id="tradeName"
                  name="tradeName"
                  value={formData.tradeName}
                  onChange={handleChange}
                  className={`input ${errors.tradeName ? 'border-error focus:ring-error' : ''}`}
                  placeholder="Ex: Bike Shop Center"
                />
                {errors.tradeName && <p className="mt-1 text-sm text-error">{errors.tradeName}</p>}
              </div>

              <div>
                <label htmlFor="legalName" className="label">
                  Razão Social *
                </label>
                <input
                  type="text"
                  id="legalName"
                  name="legalName"
                  value={formData.legalName}
                  onChange={handleChange}
                  className={`input ${errors.legalName ? 'border-error focus:ring-error' : ''}`}
                  placeholder="Ex: Bike Shop Center LTDA"
                />
                {errors.legalName && <p className="mt-1 text-sm text-error">{errors.legalName}</p>}
              </div>

              <div>
                <label htmlFor="cnpj" className="label">
                  CNPJ
                </label>
                <input
                  type="text"
                  id="cnpj"
                  name="cnpj"
                  value={formData.cnpj}
                  onChange={handleCNPJChange}
                  className={`input ${errors.cnpj ? 'border-error focus:ring-error' : ''}`}
                  placeholder="00.000.000/0000-00"
                />
                {errors.cnpj && <p className="mt-1 text-sm text-error">{errors.cnpj}</p>}
              </div>

              <div>
                <label htmlFor="aliases" className="label">
                  Nomes Alternativos
                </label>
                <input
                  type="text"
                  id="aliases"
                  name="aliases"
                  value={formData.aliases}
                  onChange={handleChange}
                  className="input"
                  placeholder="Ex: Bike Shop, Loja Center (separar por vírgula)"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">Variações do nome da loja (separadas por vírgula)</p>
              </div>
            </div>
          </div>

          {/* Contato */}
          <div>
            <h2 className="font-title text-lg font-bold text-gray-900 dark:text-slate-100 mb-4">Contato</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="email" className="label">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`input ${errors.email ? 'border-error focus:ring-error' : ''}`}
                  placeholder="contato@bikeshop.com.br"
                />
                {errors.email && <p className="mt-1 text-sm text-error">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="label">
                  Telefone
                </label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  className="input"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div>
            <h2 className="font-title text-lg font-bold text-gray-900 dark:text-slate-100 mb-4">Localização</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="zipCode" className="label">
                  CEP
                </label>
                <input
                  type="text"
                  id="zipCode"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleCEPChange}
                  className="input"
                  placeholder="00000-000"
                />
              </div>

              <div>
                <label htmlFor="address" className="label">
                  Endereço Completo
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="input"
                  placeholder="Rua, número, complemento"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="city" className="label">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={`input ${errors.city ? 'border-error focus:ring-error' : ''}`}
                    placeholder="São Paulo"
                  />
                  {errors.city && <p className="mt-1 text-sm text-error">{errors.city}</p>}
                </div>

                <div>
                  <label htmlFor="state" className="label">
                    Estado *
                  </label>
                  <select
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className={`input ${errors.state ? 'border-error focus:ring-error' : ''}`}
                  >
                    <option value="">Selecione...</option>
                    {states.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  {errors.state && <p className="mt-1 text-sm text-error">{errors.state}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="latitude" className="label">
                    Latitude
                  </label>
                  <input
                    type="text"
                    id="latitude"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    className="input"
                    placeholder="-23.550520"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">Para exibir no mapa (opcional)</p>
                </div>

                <div>
                  <label htmlFor="longitude" className="label">
                    Longitude
                  </label>
                  <input
                    type="text"
                    id="longitude"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    className="input"
                    placeholder="-46.633308"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">Para exibir no mapa (opcional)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          {isEditMode && (
            <div>
              <h2 className="font-title text-lg font-bold text-gray-900 dark:text-slate-100 mb-4">Status da Loja</h2>
              <label className="flex items-center gap-3 cursor-pointer w-fit">
                <div className="relative">
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${formData.active ? 'bg-success' : 'bg-gray-300 dark:bg-slate-600'}`} />
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.active ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  {formData.active ? 'Loja ativa' : 'Loja inativa'}
                </span>
              </label>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 ml-14">
                Lojas inativas ficam ocultas no localizador e bloqueiam o acesso dos logistas.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-100 dark:border-slate-800">
            <Link
              to="/admin/stores"
              className="btn btn-outline"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="btn btn-primary"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {isEditMode ? 'Salvar Alterações' : 'Cadastrar Loja'}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
