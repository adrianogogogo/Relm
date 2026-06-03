import { useState } from 'react';
import { Link } from 'react-router-dom';
import { customerAuthAPI } from '../services/api';

export default function CustomerForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await customerAuthAPI.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao processar solicitação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <span className="text-3xl">🔐</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Esqueci minha senha</h1>
            <p className="text-gray-500 text-sm">Área do Cliente</p>
          </div>

          {submitted ? (
            <div className="text-center space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                <p className="text-green-800 font-semibold mb-1">Solicitação enviada!</p>
                <p className="text-green-700 text-sm">
                  Se o e-mail estiver cadastrado, você receberá as instruções de redefinição em breve. Verifique sua caixa de entrada e spam.
                </p>
              </div>
              <Link to="/cliente/login" className="block text-sm text-primary font-semibold hover:underline mt-4">
                ← Voltar para o login
              </Link>
            </div>
          ) : (
            <>
              <p className="text-gray-600 text-sm mb-6">
                Informe o e-mail cadastrado e enviaremos um link para redefinir sua senha.
              </p>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-5 rounded">
                  <p className="text-red-700 text-sm">{error}</p>
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
                <button type="submit" disabled={loading} className="w-full btn btn-primary">
                  {loading ? 'Enviando...' : 'Enviar instruções'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link to="/cliente/login" className="text-sm text-gray-500 hover:text-gray-700">
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
