import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { customerAuthAPI } from '../services/api';

export default function CustomerResetPasswordPage() {
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
      await customerAuthAPI.resetPassword(token, form.password);
      setSuccess(true);
      setTimeout(() => navigate('/cliente/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Token inválido ou expirado. Solicite uma nova redefinição.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-auth-gradient flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 dark:border dark:border-slate-800">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <span className="text-3xl">🔑</span>
            </div>
            <h1 className="font-title text-2xl font-bold text-gray-800 mb-1">Nova senha</h1>
            <p className="text-gray-500 text-sm">Área do Cliente</p>
          </div>

          {success ? (
            <div className="text-center space-y-4">
              <div className="bg-success/10 border border-success/30 rounded-lg p-5">
                <p className="text-success-700 font-semibold mb-1">Senha redefinida com sucesso!</p>
                <p className="text-success-700 text-sm">Redirecionando para o login...</p>
              </div>
              <Link to="/cliente/login" className="block text-sm text-primary font-semibold hover:underline">
                Ir para o login agora
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-error/10 border-l-4 border-error p-4 mb-5 rounded">
                  <p className="text-error text-sm font-medium">{error}</p>
                  {!token && (
                    <Link to="/cliente/esqueci-senha" className="block mt-2 text-error font-semibold text-sm hover:underline">
                      Solicitar nova redefinição →
                    </Link>
                  )}
                </div>
              )}

              {token && (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="label">Nova senha</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="input"
                      placeholder="Mín. 6 caracteres"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Confirmar nova senha</label>
                    <input
                      type="password"
                      value={form.confirm}
                      onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                      className="input"
                      placeholder="Repita a senha"
                      required
                    />
                  </div>
                  <button type="submit" disabled={loading} className="w-full btn btn-primary py-3 text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? 'Salvando...' : 'Definir nova senha'}
                  </button>
                </form>
              )}

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
