import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      // Redireciona automaticamente baseado no tipo do usuário
      const dashboardPath = useAuthStore.getState().getDashboardPath();
      navigate(dashboardPath);
    }
  };

  const handleChange = (e) => {
    clearError();
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-auth-gradient flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-6">
          <img src="/logo-white.png" alt="Relm Care+" className="h-14 w-auto mx-auto" />
        </div>
        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 dark:border dark:border-slate-800">
          <div className="text-center mb-8">
            <h1 className="font-title text-3xl font-bold text-gray-800 mb-2">
              Bem-vindo
            </h1>
            <p className="text-gray-600">
              Faça login para acessar o sistema
            </p>
          </div>

          {error && (
            <div className="bg-error/10 border-l-4 border-error p-4 mb-6 rounded">
              <p className="text-error font-medium text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
                className="input"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Senha
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn btn-primary py-3 text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <Link to="/esqueci-senha" className="block text-sm text-primary hover:underline font-medium">
              Esqueci minha senha
            </Link>
            <p className="text-sm text-gray-600">
              Não tem conta?{' '}
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
