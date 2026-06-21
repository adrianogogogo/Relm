import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await authAPI.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao processar solicitação. Tente novamente.');
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
              Esqueci minha senha
            </h1>
            <p className="text-gray-600 text-sm">
              Informe seu e-mail e enviaremos as instruções para redefinir sua senha.
            </p>
          </div>

          {success ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <span className="text-3xl">✉️</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-800">E-mail enviado!</h2>
              <p className="text-gray-600 text-sm">
                Se o e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha em breve. Verifique também a pasta de spam.
              </p>
              <Link
                to="/login"
                className="inline-block mt-4 text-sm text-primary font-semibold hover:underline"
              >
                ← Voltar para o login
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
                  <label htmlFor="email" className="label">
                    E-mail
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => { setError(''); setEmail(e.target.value); }}
                    className="input"
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn btn-primary py-3 text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Enviando...' : 'Enviar instruções'}
                </button>
              </form>

              <div className="mt-6 text-center space-y-2">
                <Link to="/login" className="block text-sm text-primary hover:underline font-medium">
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
