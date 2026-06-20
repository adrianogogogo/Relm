import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoreAuthStore } from '../store/storeAuthStore';

const StoreLoginPage = () => {
  const navigate = useNavigate();
  const login = useStoreAuthStore((state) => state.login);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData.email, formData.password);
    if (result.success) {
      // Redirect to store dashboard
      navigate('/loja/dashboard');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-auth-gradient flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md dark:border dark:border-slate-800">
        <div className="text-center mb-8">
          <img src="/logo-relm.png" alt="Relm Care+" className="h-12 w-auto mx-auto mb-6" />
          <h1 className="font-title text-3xl font-bold text-gray-800">RELM Care+</h1>
          <p className="text-gray-500 mt-2 text-sm">Portal da Loja</p>
        </div>

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
              required
              className="input"
              placeholder="seu@email.com"
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
              required
              className="input"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-error/10 border-l-4 border-error text-error px-4 py-3 rounded text-sm font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary py-3 text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <a href="/loja/esqueci-senha" className="block text-sm text-primary hover:text-primary-700 font-medium">
            Esqueci minha senha
          </a>
          <a href="/" className="block text-sm text-gray-500 hover:text-gray-700">
            ← Voltar para o site
          </a>
        </div>
      </div>
    </div>
  );
};

export default StoreLoginPage;
