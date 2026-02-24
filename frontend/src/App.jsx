import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PublicLayout from './components/PublicLayout';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import WarrantyPage from './pages/WarrantyPage';
import BenefitsPage from './pages/BenefitsPage';
import EventsPage from './pages/EventsPage';
import InsurancePage from './pages/InsurancePage';
import NewsletterPage from './pages/NewsletterPage';
import AdminDashboard from './pages/AdminDashboard';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import CustomerFormPage from './pages/CustomerFormPage';
import StoresPage from './pages/StoresPage';
import StoreFormPage from './pages/StoreFormPage';
import WarrantiesPage from './pages/WarrantiesPage';
import ValidateWarrantyPage from './pages/ValidateWarrantyPage';
import StoreLoginPage from './pages/StoreLoginPage';
import StoreDashboard from './pages/StoreDashboard';
import BannersPage from './pages/BannersPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes with PublicLayout */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/garantia" element={<WarrantyPage />} />
            <Route path="/vantagens" element={<BenefitsPage />} />
            <Route path="/eventos" element={<EventsPage />} />
            <Route path="/seguro" element={<InsurancePage />} />
            <Route path="/newsletter" element={<NewsletterPage />} />
            <Route path="/validar-garantia/:token" element={<ValidateWarrantyPage />} />
            
            {/* Store Portal Routes */}
            <Route path="/loja/login" element={<StoreLoginPage />} />
            <Route path="/loja/dashboard" element={<StoreDashboard />} />
          </Route>

          {/* Admin Routes with AdminLayout */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'ADMIN_RELM',
                  'GERENTE_RELM',
                  'SUPORTE_RELM',
                  'LOJA',
                  'DISTRIBUIDOR',
                ]}
              >
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="warranties" element={<WarrantiesPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/:id" element={<CustomerDetailPage />} />
            <Route path="customers/new" element={<CustomerFormPage />} />
            <Route path="customers/:id/edit" element={<CustomerFormPage />} />
            <Route path="stores" element={<StoresPage />} />
            <Route path="stores/new" element={<StoreFormPage />} />
            <Route path="stores/:id/edit" element={<StoreFormPage />} />
            <Route path="banners" element={<BannersPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
