import { Link } from 'react-router-dom';
import { Shield, Users, Store, Calendar, FileText, TrendingUp, ImageIcon } from 'lucide-react';

export default function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const stats = [
    { label: 'Garantias Ativas', value: '127', color: 'bg-blue-500', icon: Shield },
    { label: 'Clientes', value: '45', color: 'bg-green-500', icon: Users },
    { label: 'Lojas Parceiras', value: '12', color: 'bg-purple-500', icon: Store },
    { label: 'Eventos Ativos', value: '8', color: 'bg-orange-500', icon: Calendar },
  ];

  const quickActions = [
    { to: '/admin/warranties', label: 'Gerenciar Garantias', icon: Shield },
    { to: '/admin/customers', label: 'Gerenciar Clientes', icon: Users },
    { to: '/admin/stores', label: 'Gerenciar Lojas', icon: Store },
    { to: '/admin/banners', label: 'Gerenciar Banners', icon: ImageIcon },
    { to: '/admin/seguros', label: 'Gestão de Seguros', icon: FileText },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard Administrativo</h1>
        <p className="text-gray-600">
          Bem-vindo, <span className="font-semibold">{user?.name || 'Admin'}</span>!
        </p>
        <p className="text-sm text-gray-500">Perfil: {user?.role || 'ADMIN_RELM'}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`${stat.color} text-white rounded-lg shadow-lg p-6`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-4xl font-bold">{stat.value}</h3>
                <Icon size={32} className="opacity-80" />
              </div>
              <p className="text-sm opacity-90">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <TrendingUp className="mr-2" size={24} />
            Ações Rápidas
          </h2>
          <div className="space-y-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link
                  key={index}
                  to={action.to}
                  className="flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary-50 transition-all"
                >
                  <Icon size={20} className="text-primary" />
                  <span className="font-medium text-gray-700">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Atividades Recentes</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 pb-3 border-b">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-800">Nova garantia registrada</p>
                <p className="text-sm text-gray-500">Há 5 minutos</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 pb-3 border-b">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-800">Cliente aprovado</p>
                <p className="text-sm text-gray-500">Há 1 hora</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-800">Evento criado</p>
                <p className="text-sm text-gray-500">Há 2 horas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
