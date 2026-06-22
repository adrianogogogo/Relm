import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import AdminDashboard from './AdminDashboard';

/**
 * Página inicial do /admin.
 * O perfil DISTRIBUIDOR só gerencia Lojas, então é redirecionado para /admin/stores
 * (não enxerga o Dashboard). Os demais perfis veem o AdminDashboard normalmente.
 */
export default function AdminHome() {
  const user = useAuthStore((state) => state.user);

  if (user?.role === 'DISTRIBUIDOR') {
    return <Navigate to="/admin/stores" replace />;
  }

  return <AdminDashboard />;
}
