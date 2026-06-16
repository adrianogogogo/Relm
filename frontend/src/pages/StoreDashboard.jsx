import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { customersAPI, warrantyAPI, insuranceAPI } from '../services/api';
import { Store, Users, Shield, FileText, LogOut, ShoppingBag } from 'lucide-react';
import { useStoreAuthStore } from '../store/storeAuthStore';

const StoreDashboard = () => {
  const navigate = useNavigate();
  const user = useStoreAuthStore((state) => state.user);
  const logout = useStoreAuthStore((state) => state.logout);
  const storeId = user?.storeId;

  // Fetch store-specific data
  const { data: customersResponse, isLoading: loadingCustomers } = useQuery({
    queryKey: ['store-customers', storeId],
    queryFn: () => customersAPI.getAll({ storeId }),
    enabled: !!storeId,
  });

  // O endpoint agora retorna { data, total, page, pageSize } (paginado).
  const customers = Array.isArray(customersResponse)
    ? customersResponse
    : customersResponse?.data ?? [];
  const customersTotal = Array.isArray(customersResponse)
    ? customersResponse.length
    : customersResponse?.total ?? 0;

  const { data: warranties, isLoading: loadingWarranties } = useQuery({
    queryKey: ['store-warranties', storeId],
    queryFn: () => warrantyAPI.getAll({ storeId }),
    enabled: !!storeId,
  });

  const { data: insurances } = useQuery({
    queryKey: ['store-insurances', storeId],
    queryFn: () => insuranceAPI.getAll({ storeId }),
    enabled: !!storeId,
  });

  const handleLogout = () => {
    logout();
    navigate('/loja/login');
  };

  if (!user) {
    return null;
  }

  const stats = [
    {
      label: 'Clientes',
      value: customersTotal,
      icon: Users,
      color: 'bg-blue-500',
      link: '/loja/clientes',
    },
    {
      label: 'Garantias',
      value: warranties?.length || 0,
      icon: Shield,
      color: 'bg-green-500',
      link: '/loja/garantias',
    },
    {
      label: 'Seguros',
      value: insurances?.length || 0,
      icon: FileText,
      color: 'bg-purple-500',
      link: '/loja/seguros',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Store className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Portal da Loja</h1>
                <p className="text-sm text-gray-600">{user.store?.tradeName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-600">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Link
              key={index}
              to={stat.link}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {loadingCustomers || loadingWarranties ? '...' : stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/loja/clientes/novo"
              className="flex items-center space-x-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Users className="w-5 h-5" />
              <span className="font-medium">Novo Cliente</span>
            </Link>
            <Link
              to="/loja/garantias"
              className="flex items-center space-x-3 px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Shield className="w-5 h-5" />
              <span className="font-medium">Ver Garantias</span>
            </Link>
            <Link
              to="/loja/seguros"
              className="flex items-center space-x-3 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <FileText className="w-5 h-5" />
              <span className="font-medium">Ver Seguros</span>
            </Link>
            <Link
              to="/loja/produtos"
              className="flex items-center space-x-3 px-4 py-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="font-medium">Produtos</span>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h2>
          {loadingWarranties ? (
            <p className="text-gray-600">Carregando...</p>
          ) : warranties && warranties.length > 0 ? (
            <div className="space-y-3">
              {warranties.slice(0, 5).map((warranty) => (
                <div key={warranty.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">Garantia #{warranty.protocolNumber}</p>
                    <p className="text-sm text-gray-600">
                      Status: <span className="font-medium">{warranty.status}</span>
                    </p>
                  </div>
                  <Link
                    to={`/loja/garantias/${warranty.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Ver detalhes →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">Nenhuma atividade recente</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default StoreDashboard;
