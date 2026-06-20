import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function StoreProtectedRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || user?.userType !== 'STORE') {
    return <Navigate to="/login" replace />;
  }

  return children;
}
