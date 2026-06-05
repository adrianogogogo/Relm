import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bike } from 'lucide-react';
import { useCustomerAuthStore } from '../store/customerAuthStore';

export default function CustomerRegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useCustomerAuthStore();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    invoiceNumber: '',
  });
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    clearError();
    setLocalError('');
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setLocalError('As senhas não coincidem.');
      return;
    }

    if (form.password.length < 6) {
      setLocalError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    const result = await register({
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      password: form.password,
      invoiceNumber: form.invoiceNumber,
    });

    if (result.success) navigate('/cliente/dashboard');
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Bike className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">Criar Conta</h1>
            <p className="text-gray-500 text-sm">
              Você precisará do número da sua nota fiscal de compra
            </p>
          </div>

          {displayError && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
              <p className="text-red-700 text-sm">{displayError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nome completo</label>
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                className="input"
                placeholder="João Silva"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">E-mail</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="input"
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <div>
                <label className="label">Telefone</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="input"
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">
                Número da Nota Fiscal{' '}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="invoiceNumber"
                value={form.invoiceNumber}
                onChange={handleChange}
                className="input"
                placeholder="NF-12345"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Obrigatório — informe o número da NF da sua compra Relm Bikes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Senha</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="input"
                  placeholder="Mín. 6 caracteres"
                  required
                />
              </div>
              <div>
                <label className="label">Confirmar senha</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="input"
                  placeholder="Repita a senha"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn btn-primary mt-2"
            >
              {isLoading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600">
              Já tem conta?{' '}
              <Link to="/cliente/login" className="text-primary font-semibold hover:underline">
                Fazer login
              </Link>
            </p>
            <Link to="/" className="block text-sm text-gray-400 hover:text-gray-600">
              ← Voltar para o início
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
