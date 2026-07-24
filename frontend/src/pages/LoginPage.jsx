import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { KineticCard, KineticButton, KineticInput } from '../components/ui/kinetic';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      const dashboardPath = useAuthStore.getState().getDashboardPath();
      navigate(dashboardPath);
    }
  };

  const handleChange = (e) => {
    clearError();
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-[#e0e5ec] text-[#2d3436] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo + LED Status */}
        <div className="text-center mb-8">
          <img src="/logo-white.png" alt="Relm Care+" className="h-14 w-auto mx-auto filter invert brightness-0 mb-3" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d1d9e6] shadow-[inset_1px_1px_3px_#babecc,inset_-1px_-1px_3px_#ffffff] font-mono text-[10px] font-bold text-[#4a5568]">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
            <span>SISTEMA DE AUTENTICAÇÃO ONLINE</span>
          </div>
        </div>

        {/* Login Card */}
        <KineticCard className="p-8">
          <div className="text-center mb-8 font-sans">
            <h1 className="text-3xl font-extrabold uppercase tracking-tight text-[#2d3436] mb-1">
              Painel de Acesso
            </h1>
            <p className="font-mono text-xs text-[#4a5568] uppercase tracking-wider font-bold">
              Insira suas credenciais técnicas
            </p>
          </div>

          {error && (
            <div className="bg-[#ff4757]/10 border-l-4 border-[#ff4757] p-4 mb-6 rounded-xl font-mono text-xs text-[#ff4757] font-bold shadow-[inset_2px_2px_4px_rgba(255,71,87,0.15)]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <KineticInput
              label="E-mail de Acesso"
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="seu@email.com"
              required
            />

            <KineticInput
              label="Senha de Acesso"
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />

            <KineticButton
              type="submit"
              variant="primary"
              size="lg"
              disabled={isLoading}
              className="w-full mt-2"
            >
              {isLoading ? 'AUTENTICANDO...' : 'ENTRAR NO SISTEMA'}
            </KineticButton>
          </form>

          <div className="mt-8 pt-6 border-t border-[#babecc]/40 text-center font-mono space-y-3">
            <Link to="/esqueci-senha" className="block text-xs font-bold text-[#183757] hover:underline uppercase tracking-wider">
              /// Esqueci minha senha
            </Link>
            <p className="text-xs text-[#4a5568]">
              Não possui conta?{' '}
              <Link to="/cliente/cadastro" className="text-[#183757] font-bold hover:underline uppercase tracking-wider">
                Cadastre-se
              </Link>
            </p>
            <Link to="/" className="block text-xs text-[#4a5568] hover:text-[#2d3436]">
              ← Voltar para a Início
            </Link>
          </div>
        </KineticCard>
      </div>
    </div>
  );
}
