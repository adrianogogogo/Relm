import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setError('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (!token) {
      setError('Token de redefinição não encontrado. Solicite um novo link.');
      return;
    }

    setIsLoading(true);

    try {
      await authAPI.resetPassword(token, formData.password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Token inválido ou expirado. Solicite um novo link.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-auth-gradient flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-6">
          <img src="/logo-white.png" alt="Relm Care+" className="h-14 w-auto mx-auto" />
        </div>
        <div className="bg-white rounded-3xl shadow-2xl p-8 dark:border dark:border-slate-800">
          <div className="text-center mb-8">
            <h1 className="font-title text-3xl font-bold text-gray-800 mb-2">
              Redefinir senha
            </h1>
            <p className="text-gray-600 text-sm">
              Crie uma nova senha para sua conta.
            </p>
          </div>

          {success ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Senha redefinida!</h2>
              <p className="text-gray-600 text-sm">
                Sua senha foi alterada com sucesso. Você será redirecionado para o login...
              </p>
              <Link
                to="/login"
                className="inline-block mt-4 text-sm text-primary font-semibold hover:underline"
              >
                Ir para o login →
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-error/10 border-l-4 border-error p-4 mb-6 rounded">
                  <p className="text-error font-medium text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="password" className="label">
                    Nova senha
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
                    minLength={6}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="label">
                    Confirmar nova senha
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn btn-primary py-3 text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Redefinindo...' : 'Redefinir senha'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link to="/login" className="block text-sm text-gray-400 hover:text-gray-600">
                  ← Voltar para o login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
