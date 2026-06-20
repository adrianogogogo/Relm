import { useState } from 'react';
import { Link } from 'react-router-dom';
import { storeAuthAPI } from '../services/api';

export default function StoreForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await storeAuthAPI.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao processar solicitação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-auth-gradient flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 dark:border dark:border-slate-800">
          <div className="text-center mb-8">
            <h1 className="font-title text-2xl font-bold text-gray-800 mb-1">RELM Care+</h1>
            <p className="text-gray-500 text-sm">Portal da Loja — Redefinição de senha</p>
          </div>

          {submitted ? (
            <div className="text-center space-y-4">
              <div className="bg-success/10 border border-success/30 rounded-lg p-5">
                <p className="text-success-700 font-semibold mb-1">Solicitação enviada!</p>
                <p className="text-success-700 text-sm">
                  Se o e-mail estiver cadastrado, você receberá as instruções em breve. Verifique sua caixa de entrada e spam.
                </p>
              </div>
              <Link to="/loja/login" className="block text-sm text-primary font-semibold hover:underline mt-4">
                ← Voltar para o login
              </Link>
            </div>
          ) : (
            <>
              <p className="text-gray-600 text-sm mb-6">
                Informe o e-mail cadastrado da sua conta de loja e enviaremos um link para redefinir a senha.
              </p>

              {error && (
                <div className="bg-error/10 border-l-4 border-error text-error px-4 py-3 rounded mb-5 text-sm font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="label">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn btn-primary py-3 text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Enviando...' : 'Enviar instruções'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link to="/loja/login" className="text-sm text-gray-500 hover:text-gray-700">
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
