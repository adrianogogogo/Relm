import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MdPedalBike, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { useAuthStore } from '../store/authStore';
import { customerAuthAPI } from '../services/api';

export default function CustomerRegisterPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
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
    setError('');
    setLocalError('');
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (form.password !== form.confirmPassword) {
      setLocalError('As senhas não coincidem.');
      setIsLoading(false);
      return;
    }

    if (form.password.length < 6) {
      setLocalError('A senha deve ter no mínimo 6 caracteres.');
      setIsLoading(false);
      return;
    }

    try {
      await customerAuthAPI.register({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        invoiceNumber: form.invoiceNumber,
      });

      // Login automático após registro
      const result = await login(form.email, form.password);
      if (result.success) {
        navigate('/cliente/dashboard');
      } else {
        setError(result.error || 'Conta criada com sucesso, mas erro ao fazer login automático. Acesse a página de login.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao registrar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-auth-gradient flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 dark:border dark:border-slate-800">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <MdPedalBike className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-title text-3xl font-bold text-gray-800 mb-1">Criar Conta</h1>
            <p className="text-gray-500 text-sm">
              Você precisará do número da sua nota fiscal de compra
            </p>
          </div>

          {displayError && (
            <div className="bg-error/10 border-l-4 border-error p-4 mb-6 rounded">
              <p className="text-error text-sm font-medium">{displayError}</p>
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
                <span className="text-error">*</span>
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
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="input pr-10"
                    placeholder="Mín. 6 caracteres"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Confirmar senha</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className="input pr-10"
                    placeholder="Repita a senha"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    title={showConfirmPassword ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {showConfirmPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn btn-primary mt-2 py-3 text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600">
              Já tem conta?{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">
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
