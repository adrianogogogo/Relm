import { Navigate } from 'react-router-dom';
import { useCustomerAuthStore } from '../store/customerAuthStore';

export default function CustomerProtectedRoute({ children }) {
  const { isAuthenticated } = useCustomerAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/cliente/login" replace />;
  }

  return children;
}
