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
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">RELM Care+</h1>
            <p className="text-gray-500 text-sm">Portal da Loja — Redefinição de senha</p>
          </div>

          {submitted ? (
            <div className="text-center space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                <p className="text-green-800 font-semibold mb-1">Solicitação enviada!</p>
                <p className="text-green-700 text-sm">
                  Se o e-mail estiver cadastrado, você receberá as instruções em breve. Verifique sua caixa de entrada e spam.
                </p>
              </div>
              <Link to="/loja/login" className="block text-sm text-blue-600 font-semibold hover:underline mt-4">
                ← Voltar para o login
              </Link>
            </div>
          ) : (
            <>
              <p className="text-gray-600 text-sm mb-6">
                Informe o e-mail cadastrado da sua conta de loja e enviaremos um link para redefinir a senha.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
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
