import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bike } from 'lucide-react';
import { useCustomerAuthStore } from '../store/customerAuthStore';

export default function CustomerLoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useCustomerAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    clearError();
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(form.email, form.password);
    if (result.success) navigate('/cliente/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Bike className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">Área do Cliente</h1>
            <p className="text-gray-500 text-sm">Acesse suas garantias, eventos e vantagens</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
              <label className="label">Senha</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="input"
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" disabled={isLoading} className="w-full btn btn-primary">
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <Link to="/cliente/esqueci-senha" className="block text-sm text-primary hover:underline font-medium">
              Esqueci minha senha
            </Link>
            <p className="text-sm text-gray-600">
              Ainda não tem conta?{' '}
              <Link to="/cliente/cadastro" className="text-primary font-semibold hover:underline">
                Cadastre-se
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
