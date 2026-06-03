import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Truck, ArrowLeft } from 'lucide-react';

export default function DistribuidorLoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, logout } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [roleError, setRoleError] = useState('');

  const handleChange = (e) => {
    setRoleError('');
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRoleError('');

    const result = await login(form.email, form.password);

    if (result.success) {
      // Verifica se o usuário logado é realmente um distribuidor
      const { user } = useAuthStore.getState();
      if (user?.role !== 'DISTRIBUIDOR') {
        // Faz logout imediato se não for distribuidor
        logout();
        setRoleError('Esta área é exclusiva para distribuidores autorizados. Utilize o acesso correto.');
        return;
      }
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary/10 rounded-2xl mb-4">
              <Truck className="w-8 h-8 text-secondary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Portal Distribuidores</h1>
            <p className="text-gray-500 text-sm">Acesso exclusivo para distribuidores autorizados Relm Bikes</p>
          </div>

          {/* Erros */}
          {(error || roleError) && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
              <p className="text-red-700 text-sm">{roleError || error}</p>
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
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors"
              style={{ backgroundColor: 'var(--color-secondary, #6366f1)' }}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <Link
              to="/portais"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para portais
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
