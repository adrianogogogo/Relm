import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function CustomerFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState([]);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    storeId: '',
    notes: '',
  });

  useEffect(() => {
    fetchStores();
    if (isEditMode) {
      fetchCustomer();
    }
  }, [id]);

  const fetchStores = async () => {
    try {
      const response = await api.get('/stores');
      setStores(response.data);
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
    }
  };

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/customers/${id}`);
      setFormData(response.data);
    } catch (error) {
      console.error('Erro ao carregar cliente:', error);
      alert('Erro ao carregar dados do cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Limpar erro do campo quando usuário digitar
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'WhatsApp/Telefone é obrigatório';
    }

    if (!formData.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatCPF = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatPhone = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const formatZipCode = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1');
  };

  const handleCPFChange = (e) => {
    const formatted = formatCPF(e.target.value);
    setFormData((prev) => ({ ...prev, cpf: formatted }));
    if (errors.cpf) {
      setErrors((prev) => ({ ...prev, cpf: '' }));
    }
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value);
    setFormData((prev) => ({ ...prev, phone: formatted }));
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: '' }));
    }
  };

  const handleZipCodeChange = (e) => {
    const formatted = formatZipCode(e.target.value);
    setFormData((prev) => ({ ...prev, zipCode: formatted }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      if (isEditMode) {
        await api.patch(`/customers/${id}`, formData);
        alert('Cliente atualizado com sucesso!');
      } else {
        await api.post('/customers', formData);
        alert('Cliente cadastrado com sucesso!');
      }

      navigate('/admin/customers');
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      alert(error.response?.data?.message || 'Erro ao salvar cliente');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-600 mt-4">Carregando dados do cliente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              to="/admin/customers"
              className="text-primary hover:underline mb-4 inline-block"
            >
              ← Voltar para clientes
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditMode ? 'Editar Cliente' : 'Novo Cliente'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEditMode
                ? 'Atualize os dados do cliente'
                : 'Preencha os dados para cadastrar um novo cliente'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
            {/* Dados Pessoais */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Dados Pessoais</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="João da Silva"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CPF <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleCPFChange}
                    maxLength={14}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.cpf ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="000.000.000-00"
                  />
                  {errors.cpf && <p className="text-red-500 text-sm mt-1">{errors.cpf}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp/Telefone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    maxLength={15}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="(11) 99999-9999"
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="joao@email.com"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Endereço</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleZipCodeChange}
                    maxLength={9}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="00000-000"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Endereço Completo
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Rua, número, complemento"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="São Paulo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Selecione</option>
                    <option value="AC">Acre</option>
                    <option value="AL">Alagoas</option>
                    <option value="AP">Amapá</option>
                    <option value="AM">Amazonas</option>
                    <option value="BA">Bahia</option>
                    <option value="CE">Ceará</option>
                    <option value="DF">Distrito Federal</option>
                    <option value="ES">Espírito Santo</option>
                    <option value="GO">Goiás</option>
                    <option value="MA">Maranhão</option>
                    <option value="MT">Mato Grosso</option>
                    <option value="MS">Mato Grosso do Sul</option>
                    <option value="MG">Minas Gerais</option>
                    <option value="PA">Pará</option>
                    <option value="PB">Paraíba</option>
                    <option value="PR">Paraná</option>
                    <option value="PE">Pernambuco</option>
                    <option value="PI">Piauí</option>
                    <option value="RJ">Rio de Janeiro</option>
                    <option value="RN">Rio Grande do Norte</option>
                    <option value="RS">Rio Grande do Sul</option>
                    <option value="RO">Rondônia</option>
                    <option value="RR">Roraima</option>
                    <option value="SC">Santa Catarina</option>
                    <option value="SP">São Paulo</option>
                    <option value="SE">Sergipe</option>
                    <option value="TO">Tocantins</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Loja de Compra */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Informações de Compra</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loja de Compra
                </label>
                <select
                  name="storeId"
                  value={formData.storeId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Selecione a loja</option>
                  <option value="direct">Compra Direta Relm</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name} - {store.city}/{store.state}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Onde o cliente adquiriu a bicicleta Relm
                </p>
              </div>
            </div>

            {/* Observações */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Observações</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas Internas
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Informações adicionais sobre o cliente..."
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Salvando...' : isEditMode ? 'Salvar Alterações' : 'Cadastrar Cliente'}
              </button>
              <Link
                to="/admin/customers"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-semibold text-center"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
