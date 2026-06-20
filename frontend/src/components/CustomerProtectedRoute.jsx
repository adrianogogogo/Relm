import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function CustomerProtectedRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || user?.userType !== 'CUSTOMER') {
    return <Navigate to="/login" replace />;
  }

  return children;
}
