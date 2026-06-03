import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { storeAuthAPI } from '../services/api';

export default function StoreResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) setError('Link inválido. Solicite uma nova redefinição.');
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }
    if (form.password !== form.confirm) { setError('As senhas não coincidem.'); return; }

    setLoading(true);
    try {
      await storeAuthAPI.resetPassword(token, form.password);
      setSuccess(true);
      setTimeout(() => navigate('/loja/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Token inválido ou expirado. Solicite uma nova redefinição.');
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
            <p className="text-gray-500 text-sm">Portal da Loja — Nova senha</p>
          </div>

          {success ? (
            <div className="text-center space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                <p className="text-green-800 font-semibold mb-1">Senha redefinida com sucesso!</p>
                <p className="text-green-700 text-sm">Redirecionando para o login...</p>
              </div>
              <Link to="/loja/login" className="block text-sm text-blue-600 font-semibold hover:underline">
                Ir para o login agora
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5 text-sm">
                  {error}
                  {!token && (
                    <Link to="/loja/esqueci-senha" className="block mt-2 font-semibold hover:underline">
                      Solicitar nova redefinição →
                    </Link>
                  )}
                </div>
              )}

              {token && (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Mín. 6 caracteres"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nova senha</label>
                    <input
                      type="password"
                      value={form.confirm}
                      onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Repita a senha"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Salvando...' : 'Definir nova senha'}
                  </button>
                </form>
              )}

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
