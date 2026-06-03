import { Link } from 'react-router-dom';
import { Store, Truck, ArrowLeft } from 'lucide-react';

export default function PortaisPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo / header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-5 shadow-xl">
          <span className="text-4xl font-black text-primary leading-none">R</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">Portal de Parceiros</h1>
        <p className="text-gray-400 text-lg">Selecione seu tipo de acesso para continuar</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        {/* Logistas */}
        <Link
          to="/loja/login"
          className="group bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center text-center hover:bg-primary hover:scale-105 transition-all duration-200 cursor-pointer"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 group-hover:bg-white/20 flex items-center justify-center mb-5 transition-colors">
            <Store className="w-8 h-8 text-primary group-hover:text-white transition-colors" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 group-hover:text-white mb-2 transition-colors">
            Portal Logistas
          </h2>
          <p className="text-gray-500 group-hover:text-white/80 text-sm leading-relaxed transition-colors">
            Acesso para funcionários e operadores de lojas parceiras. Consulte clientes, garantias e produtos da sua loja.
          </p>
          <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary group-hover:text-white transition-colors">
            Acessar →
          </span>
        </Link>

        {/* Distribuidores */}
        <Link
          to="/distribuidor/login"
          className="group bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center text-center hover:bg-secondary hover:scale-105 transition-all duration-200 cursor-pointer"
        >
          <div className="w-16 h-16 rounded-2xl bg-secondary/10 group-hover:bg-white/20 flex items-center justify-center mb-5 transition-colors">
            <Truck className="w-8 h-8 text-secondary group-hover:text-white transition-colors" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 group-hover:text-white mb-2 transition-colors">
            Portal Distribuidores
          </h2>
          <p className="text-gray-500 group-hover:text-white/80 text-sm leading-relaxed transition-colors">
            Acesso exclusivo para distribuidores autorizados Relm Bikes. Visualize clientes e lojas da sua rede.
          </p>
          <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-secondary group-hover:text-white transition-colors">
            Acessar →
          </span>
        </Link>
      </div>

      {/* Rodapé */}
      <div className="mt-12 text-center space-y-3">
        <Link
          to="/cliente/login"
          className="block text-gray-400 hover:text-white text-sm transition-colors"
        >
          Sou cliente → Acessar minha conta
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para o início
        </Link>
      </div>
    </div>
  );
}
