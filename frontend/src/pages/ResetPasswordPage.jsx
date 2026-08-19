import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import { KineticCard, KineticButton, KineticInput } from '../components/ui/kinetic';

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
    <div className="min-h-screen bg-[#e0e5ec] text-[#2d3436] flex items-center justify-center px-4 py-12 font-sans">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <img src="/logo-white.png" alt="Relm Care+" className="h-14 w-auto mx-auto filter invert brightness-0 mb-3" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d1d9e6] shadow-[inset_1px_1px_3px_#babecc,inset_-1px_-1px_3px_#ffffff] font-mono text-[10px] font-bold text-[#4a5568]">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
            <span>REDEFINIÇÃO DE SENHA</span>
          </div>
        </div>

        <KineticCard className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold uppercase tracking-tight text-[#2d3436] mb-1">
              Nova Senha
            </h1>
            <p className="font-mono text-xs text-[#4a5568] uppercase tracking-wider font-bold">
              Crie uma nova senha de acesso para sua conta
            </p>
          </div>

          {success ? (
            <div className="text-center space-y-4 font-mono">
              <div className="w-16 h-16 rounded-2xl bg-[#e0e5ec] shadow-[inset_3px_3px_6px_#babecc,inset_-3px_-3px_6px_#ffffff] flex items-center justify-center mx-auto text-[#22c55e] text-2xl font-bold">
                ✓
              </div>
              <h2 className="text-base font-bold uppercase tracking-wider text-[#2d3436]">Senha redefinida!</h2>
              <p className="text-[#4a5568] text-xs leading-relaxed font-medium">
                Sua senha foi alterada com sucesso. Você será redirecionado para o login em instantes...
              </p>
              <Link
                to="/login"
                className="inline-block mt-4 text-xs font-bold text-[#183757] hover:underline uppercase tracking-wider"
              >
                Ir para o login →
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-[#ff4757]/10 border-l-4 border-[#ff4757] p-4 mb-6 rounded-xl font-mono text-xs text-[#ff4757] font-bold shadow-[inset_2px_2px_4px_rgba(255,71,87,0.15)]">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <KineticInput
                  label="Nova Senha"
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />

                <KineticInput
                  label="Confirmar Nova Senha"
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />

                <KineticButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isLoading}
                  className="w-full mt-2"
                >
                  {isLoading ? 'SALVANDO...' : 'REDEFINIR SENHA'}
                </KineticButton>
              </form>

              <div className="mt-8 pt-6 border-t border-[#babecc]/40 text-center font-mono">
                <Link to="/login" className="text-xs text-[#4a5568] hover:text-[#2d3436] font-medium">
                  ← Voltar para o login
                </Link>
              </div>
            </>
          )}
        </KineticCard>
      </div>
    </div>
  );
}
