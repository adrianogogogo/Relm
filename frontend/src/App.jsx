import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from './components/Header';
import Footer from './components/Footer';
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
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">
            <Routes>
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
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/warranties"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM']}>
                    <WarrantiesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/customers"
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
                    <CustomersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/customers/:id"
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
                    <CustomerDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/customers/new"
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
                    <CustomerFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/customers/:id/edit"
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
                    <CustomerFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/stores"
                element={
                  <ProtectedRoute
                    allowedRoles={['ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'DISTRIBUIDOR']}
                  >
                    <StoresPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/stores/new"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN_RELM', 'GERENTE_RELM']}>
                    <StoreFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/stores/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN_RELM', 'GERENTE_RELM']}>
                    <StoreFormPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
