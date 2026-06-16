import { Navigate } from 'react-router-dom';
import { useStoreAuthStore } from '../store/storeAuthStore';

export default function StoreProtectedRoute({ children }) {
  const { isAuthenticated } = useStoreAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/loja/login" replace />;
  }

  return children;
}
