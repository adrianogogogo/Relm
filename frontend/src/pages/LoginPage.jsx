import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      navigate('/admin');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Credenciais de exemplo
  const exampleCredentials = [
    { email: 'admin@relmbikes.com.br', password: 'Admin@2024', role: 'ADMIN_RELM' },
    { email: 'gerente@relmbikes.com.br', password: 'Gerente@2024', role: 'GERENTE_RELM' },
    { email: 'suporte@relmbikes.com.br', password: 'Suporte@2024', role: 'SUPORTE_RELM' },
    { email: 'loja@bikeshopsp.com.br', password: 'Loja@2024', role: 'LOJA' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Bem-vindo de volta
            </h1>
            <p className="text-gray-600">
              Faça login para acessar o sistema
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-700">{error}</p>
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
              className="w-full btn btn-primary"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <a href="/" className="block text-sm text-primary hover:text-primary-700">
              ← Voltar para o início
            </a>
          </div>
        </div>

        {/* Example Credentials */}
        <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
          <h3 className="font-semibold mb-3">🔑 Credenciais de Teste:</h3>
          <div className="space-y-2 text-sm">
            {exampleCredentials.map((cred, index) => (
              <div key={index} className="bg-white/10 rounded p-2">
                <p className="font-semibold">{cred.role}</p>
                <p className="text-xs opacity-90">{cred.email} / {cred.password}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
