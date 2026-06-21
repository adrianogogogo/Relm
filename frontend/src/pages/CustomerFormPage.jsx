import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MdArrowBack } from 'react-icons/md';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Card } from '../components/ui';

export default function CustomerFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN_RELM';

  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState([]);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    fullName: '',
    cpf: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    storeId: '',
    notes: '',
    active: true,
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
      const data = response.data;
      setFormData({
        fullName: data.fullName || '',
        cpf: data.cpf || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zipCode: data.zipCode || '',
        storeId: data.storeId ?? 'direct',
        notes: data.notes || '',
        active: data.active ?? true,
      });
    } catch (error) {
      console.error('Erro ao carregar cliente:', error);
      alert('Erro ao carregar dados do cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Nome é obrigatório';
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

      const payload = {
        ...formData,
        storeId: formData.storeId && formData.storeId !== 'direct' ? formData.storeId : null,
      };
      if (!isEditMode) delete payload.active;

      if (isEditMode) {
        await api.patch(`/customers/${id}`, payload);
        alert('Cliente atualizado com sucesso!');
      } else {
        await api.post('/customers', payload);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-600 dark:text-slate-400 mt-4">Carregando dados do cliente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/admin/customers"
            className="text-primary dark:text-primary-400 hover:underline mb-4 inline-flex items-center gap-1 text-sm font-semibold"
          >
            <MdArrowBack size={16} /> Voltar para clientes
          </Link>
          <h1 className="font-title text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">
            {isEditMode ? 'Editar Cliente' : 'Novo Cliente'}
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
            {isEditMode
              ? 'Atualize os dados do cliente'
              : 'Preencha os dados para cadastrar um novo cliente'}
          </p>
        </div>

        {/* Form */}
        <Card as="form" onSubmit={handleSubmit} className="space-y-6">
            {/* Dados Pessoais */}
            <div>
              <h2 className="font-title text-xl font-bold mb-4 text-gray-900 dark:text-slate-100">Dados Pessoais</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="label">
                    Nome Completo <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`input ${errors.fullName ? 'border-error focus:ring-error' : ''}`}
                    placeholder="João da Silva"
                  />
                  {errors.fullName && <p className="text-error text-sm mt-1">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="label">
                    CPF <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleCPFChange}
                    maxLength={14}
                    className={`input ${errors.cpf ? 'border-error focus:ring-error' : ''}`}
                    placeholder="000.000.000-00"
                  />
                  {errors.cpf && <p className="text-error text-sm mt-1">{errors.cpf}</p>}
                </div>

                <div>
                  <label className="label">
                    WhatsApp/Telefone <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    maxLength={15}
                    className={`input ${errors.phone ? 'border-error focus:ring-error' : ''}`}
                    placeholder="(11) 99999-9999"
                  />
                  {errors.phone && <p className="text-error text-sm mt-1">{errors.phone}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="label">
                    Email <span className="text-error">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`input ${errors.email ? 'border-error focus:ring-error' : ''}`}
                    placeholder="joao@email.com"
                  />
                  {errors.email && <p className="text-error text-sm mt-1">{errors.email}</p>}
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div>
              <h2 className="font-title text-xl font-bold mb-4 text-gray-900 dark:text-slate-100">Endereço</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">CEP</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleZipCodeChange}
                    maxLength={9}
                    className="input"
                    placeholder="00000-000"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="label">
                    Endereço Completo
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="input"
                    placeholder="Rua, número, complemento"
                  />
                </div>

                <div>
                  <label className="label">Cidade</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="input"
                    placeholder="São Paulo"
                  />
                </div>

                <div>
                  <label className="label">Estado</label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="input"
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
              <h2 className="font-title text-xl font-bold mb-4 text-gray-900 dark:text-slate-100">Informações de Compra</h2>
              <div>
                <label className="label">
                  Loja de Compra
                </label>
                <select
                  name="storeId"
                  value={formData.storeId}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Selecione a loja</option>
                  <option value="direct">Compra Direta Relm</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.tradeName} — {store.city}/{store.state}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                  Onde o cliente adquiriu a bicicleta Relm
                </p>
              </div>
            </div>

            {/* Observações */}
            <div>
              <h2 className="font-title text-xl font-bold mb-4 text-gray-900 dark:text-slate-100">Observações</h2>
              <div>
                <label className="label">
                  Notas Internas
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="input"
                  placeholder="Informações adicionais sobre o cliente..."
                />
              </div>
            </div>

            {/* Status — apenas ADMIN em modo edição */}
            {isEditMode && isAdmin && (
              <div>
                <h2 className="font-title text-xl font-bold mb-4 text-gray-900 dark:text-slate-100">Status da Conta</h2>
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
                    {formData.active ? 'Cliente ativo' : 'Cliente inativo'}
                  </span>
                </label>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 ml-14">
                  Clientes inativos não conseguem fazer login no portal.
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-slate-800">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary flex-1"
              >
                {loading ? 'Salvando...' : isEditMode ? 'Salvar Alterações' : 'Cadastrar Cliente'}
              </button>
              <Link
                to="/admin/customers"
                className="btn btn-outline"
              >
                Cancelar
              </Link>
            </div>
        </Card>
      </div>
    </div>
  );
}
