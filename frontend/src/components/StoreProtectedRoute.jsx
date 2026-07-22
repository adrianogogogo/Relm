import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function StoreProtectedRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();

  const isAllowed =
    user?.userType === 'STORE' ||
    user?.role === 'LOJA' ||
    ['ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM'].includes(user?.role);

  if (!isAuthenticated || !isAllowed) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
