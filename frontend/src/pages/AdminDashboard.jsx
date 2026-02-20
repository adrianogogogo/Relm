import { useAuthStore } from '../store/authStore';

export default function AdminDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h1 className="text-4xl font-bold mb-2">Dashboard Administrativo</h1>
            <p className="text-gray-600">
              Bem-vindo, <span className="font-semibold">{user?.name}</span>!
            </p>
            <p className="text-sm text-gray-500">Perfil: {user?.role}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card bg-primary text-white">
              <h3 className="text-3xl font-bold mb-2">127</h3>
              <p className="opacity-90">Garantias Ativas</p>
            </div>
            <div className="card bg-secondary text-white">
              <h3 className="text-3xl font-bold mb-2">45</h3>
              <p className="opacity-90">Clientes</p>
            </div>
            <div className="card bg-purple-500 text-white">
              <h3 className="text-3xl font-bold mb-2">12</h3>
              <p className="opacity-90">Lojas Parceiras</p>
            </div>
            <div className="card bg-orange-500 text-white">
              <h3 className="text-3xl font-bold mb-2">8</h3>
              <p className="opacity-90">Eventos Ativos</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="text-2xl font-bold mb-4">Ações Rápidas</h2>
              <div className="space-y-3">
                <button className="btn btn-outline w-full text-left">
                  📋 Ver Garantias Pendentes
                </button>
                <button className="btn btn-outline w-full text-left">
                  👥 Gerenciar Clientes
                </button>
                <button className="btn btn-outline w-full text-left">
                  🏪 Gerenciar Lojas
                </button>
                <button className="btn btn-outline w-full text-left">
                  📊 Relatórios
                </button>
              </div>
            </div>

            <div className="card">
              <h2 className="text-2xl font-bold mb-4">Atividades Recentes</h2>
              <div className="space-y-3 text-sm">
                <div className="border-l-4 border-primary pl-3 py-2">
                  <p className="font-semibold">Nova garantia registrada</p>
                  <p className="text-gray-500">Há 5 minutos</p>
                </div>
                <div className="border-l-4 border-secondary pl-3 py-2">
                  <p className="font-semibold">Cliente aprovado</p>
                  <p className="text-gray-500">Há 1 hora</p>
                </div>
                <div className="border-l-4 border-orange-500 pl-3 py-2">
                  <p className="font-semibold">Evento criado</p>
                  <p className="text-gray-500">Há 2 horas</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-6 rounded">
            <h3 className="font-semibold text-blue-900 mb-2">
              🚧 Dashboard em Desenvolvimento
            </h3>
            <p className="text-blue-700 text-sm">
              Esta é uma versão inicial do dashboard. Em breve teremos gráficos,
              estatísticas detalhadas e muito mais!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
