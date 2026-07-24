import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { KineticCard, KineticButton, KineticInput } from '../components/ui/kinetic';

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
    <div className="min-h-screen bg-[#e0e5ec] text-[#2d3436] flex items-center justify-center px-4 py-12 font-sans">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <img src="/logo-white.png" alt="Relm Care+" className="h-14 w-auto mx-auto filter invert brightness-0 mb-3" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d1d9e6] shadow-[inset_1px_1px_3px_#babecc,inset_-1px_-1px_3px_#ffffff] font-mono text-[10px] font-bold text-[#4a5568]">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
            <span>RECUPERAÇÃO DE CREDENCIAIS</span>
          </div>
        </div>

        <KineticCard className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold uppercase tracking-tight text-[#2d3436] mb-1">
              Esqueci minha senha
            </h1>
            <p className="font-mono text-xs text-[#4a5568] uppercase tracking-wider font-bold">
              Informe seu e-mail técnico para redefinição
            </p>
          </div>

          {success ? (
            <div className="text-center space-y-4 font-mono">
              <div className="w-16 h-16 rounded-2xl bg-[#e0e5ec] shadow-[inset_3px_3px_6px_#babecc,inset_-3px_-3px_6px_#ffffff] flex items-center justify-center mx-auto text-[#22c55e] text-2xl font-bold">
                ✓
              </div>
              <h2 className="text-base font-bold uppercase tracking-wider text-[#2d3436]">E-mail enviado!</h2>
              <p className="text-[#4a5568] text-xs leading-relaxed font-medium">
                Se o e-mail estiver cadastrado no sistema, você receberá as instruções em breve. Verifique também a pasta de spam.
              </p>
              <Link
                to="/login"
                className="inline-block mt-4 text-xs font-bold text-[#183757] hover:underline uppercase tracking-wider"
              >
                ← Voltar para o login
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-[#ff4757]/10 border-l-4 border-[#ff4757] p-4 mb-6 rounded-xl font-mono text-xs text-[#ff4757] font-bold shadow-[inset_2px_2px_4px_rgba(255,71,87,0.15)]">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <KineticInput
                  label="E-mail Cadastrado"
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => { setError(''); setEmail(e.target.value); }}
                  placeholder="seu@email.com"
                  required
                />

                <KineticButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'ENVIANDO...' : 'ENVIAR INSTRUÇÕES'}
                </KineticButton>
              </form>

              <div className="mt-6 text-center pt-4 border-t border-[#babecc]/40 font-mono">
                <Link to="/login" className="text-xs text-[#183757] font-bold hover:underline uppercase tracking-wider">
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
