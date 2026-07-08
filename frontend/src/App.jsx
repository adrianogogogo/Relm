import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from './components/Header';
import Footer from './components/Footer';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import CustomerLayout from './components/CustomerLayout';
import CustomerProtectedRoute from './components/CustomerProtectedRoute';
import StoreProtectedRoute from './components/StoreProtectedRoute';
import StoreLayout from './components/StoreLayout';
import { useThemeStore } from './store/themeStore';

// Public pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import WarrantyPage from './pages/WarrantyPage';
import BenefitsPage from './pages/BenefitsPage';
import EventsPage from './pages/EventsPage';
import InsurancePage from './pages/InsurancePage';
import NewsletterPage from './pages/NewsletterPage';
import ValidateWarrantyPage from './pages/ValidateWarrantyPage';

// Customer portal pages
import CustomerRegisterPage from './pages/CustomerRegisterPage';
import CustomerDashboard from './pages/CustomerDashboard';
import CustomerWarrantiesPage from './pages/CustomerWarrantiesPage';
import CustomerEventsPage from './pages/CustomerEventsPage';
import CustomerBenefitsPage from './pages/CustomerBenefitsPage';
import CustomerInsurancePage from './pages/CustomerInsurancePage';
import CustomerProfilePage from './pages/CustomerProfilePage';
import CustomerWorkshopPage from './pages/CustomerWorkshopPage';
import CustomerCatalogPage from './pages/CustomerCatalogPage';
import CustomerSubscriptionPage from './pages/CustomerSubscriptionPage';

// Store portal pages
import StoreDashboard from './pages/StoreDashboard';
import StoreCustomersPage from './pages/StoreCustomersPage';
import StoreWarrantiesPage from './pages/StoreWarrantiesPage';
import StoreInsurancesPage from './pages/StoreInsurancesPage';
import StoreProductsPage from './pages/StoreProductsPage';
import StoreProfilePage from './pages/StoreProfilePage';
import StoreEventsPage from './pages/StoreEventsPage';
import StoreBenefitsPage from './pages/StoreBenefitsPage';
import StoreWorkshopPage from './pages/StoreWorkshopPage';
import StorePaymentsPage from './pages/StorePaymentsPage';

// Admin pages
import AdminHome from './pages/AdminHome';
import WarrantiesPage from './pages/WarrantiesPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import CustomerFormPage from './pages/CustomerFormPage';
import StoresPage from './pages/StoresPage';
import StoreDetailPage from './pages/StoreDetailPage';
import StoreFormPage from './pages/StoreFormPage';
import BannersPage from './pages/BannersPage';
import AdminEventsPage from './pages/AdminEventsPage';
import AdminBenefitsPage from './pages/AdminBenefitsPage';
import AdminInsurancesPage from './pages/AdminInsurancesPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminProductsPage from './pages/AdminProductsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import AdminProfilePage from './pages/AdminProfilePage';
import AdminCatalogPage from './pages/AdminCatalogPage';
import AdminVouchersPage from './pages/AdminVouchersPage';
import DistribuidorEventosPage from './pages/DistribuidorEventosPage';
import DistribuidorBeneficiosPage from './pages/DistribuidorBeneficiosPage';
import AdminPaymentsPage from './pages/AdminPaymentsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  const initTheme = useThemeStore((state) => state.initTheme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* ── Public routes (with Header + Footer) ─────────────────────── */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
            <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
            <Route path="/garantia" element={<WarrantyPage />} />
            <Route path="/vantagens" element={<BenefitsPage />} />
            <Route path="/eventos" element={<EventsPage />} />
            <Route path="/seguro" element={<InsurancePage />} />
            <Route path="/newsletter" element={<NewsletterPage />} />
            <Route path="/validar-garantia/:token" element={<ValidateWarrantyPage />} />
          </Route>

          {/* ── Customer portal ──────────────────────────────────────────── */}
          <Route path="/cliente/cadastro" element={<CustomerRegisterPage />} />
          <Route
            path="/cliente"
            element={
              <CustomerProtectedRoute>
                <CustomerLayout />
              </CustomerProtectedRoute>
            }
          >
            <Route path="dashboard" element={<CustomerDashboard />} />
            <Route path="assinatura" element={<CustomerSubscriptionPage />} />
            <Route path="garantias" element={<CustomerWarrantiesPage />} />
            <Route path="eventos" element={<CustomerEventsPage />} />
            <Route path="vantagens" element={<CustomerBenefitsPage />} />
            <Route path="seguros" element={<CustomerInsurancePage />} />
            <Route path="perfil" element={<CustomerProfilePage />} />
            <Route path="oficina" element={<CustomerWorkshopPage />} />
            <Route path="resgate" element={<CustomerCatalogPage />} />
          </Route>

          {/* ── Store portal (StoreLayout sidebar, no Header/Footer) ──────── */}
          <Route
            path="/loja"
            element={
              <StoreProtectedRoute>
                <StoreLayout />
              </StoreProtectedRoute>
            }
          >
            <Route path="dashboard" element={<StoreDashboard />} />
            <Route path="clientes" element={<StoreCustomersPage />} />
            <Route path="pagamentos" element={<StorePaymentsPage />} />
            <Route path="garantias" element={<StoreWarrantiesPage />} />
            <Route path="seguros" element={<StoreInsurancesPage />} />
            <Route path="produtos" element={<StoreProductsPage />} />
            <Route path="eventos" element={<StoreEventsPage />} />
            <Route path="beneficios" element={<StoreBenefitsPage />} />
            <Route path="perfil" element={<StoreProfilePage />} />
            <Route path="oficina" element={<StoreWorkshopPage />} />
          </Route>

          {/* ── Admin routes (AdminLayout sidebar, no Header/Footer) ──────── */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute
                allowedRoles={['ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA', 'DISTRIBUIDOR']}
              >
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            {/* Acessível por todos os roles do admin */}
            <Route index element={<AdminHome />} />
            <Route path="perfil" element={<AdminProfilePage />} />
            <Route path="catalogo" element={
              <ProtectedRoute allowedRoles={['ADMIN_RELM', 'GERENTE_RELM']}>
                <AdminCatalogPage />
              </ProtectedRoute>
            } />
            <Route path="vouchers" element={
              <ProtectedRoute allowedRoles={['ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM']}>
                <AdminVouchersPage />
              </ProtectedRoute>
            } />
            <Route path="customers" element={
              <ProtectedRoute allowedRoles={['ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA']}>
                <CustomersPage />
              </ProtectedRoute>
            } />
            <Route path="customers/:id" element={
              <ProtectedRoute allowedRoles={['ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA']}>
                <CustomerDetailPage />
              </ProtectedRoute>
            } />
            <Route path="stores" element={
              <ProtectedRoute allowedRoles={['ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'DISTRIBUIDOR']}>
                <StoresPage />
              </ProtectedRoute>
            } />
            <Route path="produtos" element={
              <ProtectedRoute allowedRoles={['ADMIN_RELM', 'GERENTE_RELM']}>
                <AdminProductsPage />
              </ProtectedRoute>
            } />

            {/* Apenas Relm (não Distribuidor) */}
            <Route path="warranties" element={
              <ProtectedRoute allowedRoles={['ADMIN_RELM', 'GERENTE_RELM']}>
                <WarrantiesPage />
              </ProtectedRoute>
            } />
            <Route path="customers/new" element={
              <ProtectedRoute allowedRoles={['ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM']}>
                <CustomerFormPage />
              </ProtectedRoute>
            } />
            <Route path="customers/:id/edit" element={
              <ProtectedRoute allowedRoles={['ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM']}>
                <CustomerFormPage />
              </ProtectedRoute>
            } />
            <Route path="stores/:id" element={<StoreDetailPage />} />
            <Route path="stores/new" element={
              <ProtectedRoute allowedRoles={['ADMIN_RELM', 'GERENTE_RELM', 'DISTRIBUIDOR']}>
                <StoreFormPage />
              </ProtectedRoute>
            } />
            <Route path="stores/:id/edit" element={
              <ProtectedRoute allowedRoles={['ADMIN_RELM', 'GERENTE_RELM', 'DISTRIBUIDOR']}>
                <StoreFormPage />
              </ProtectedRoute>
            } />
            <Route path="banners" element={
              <ProtectedRoute allowedRoles={['ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM']}>
                <BannersPage />
              </ProtectedRoute>
            } />
            <Route path="events" element={
              <ProtectedRoute allowedRoles={['ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM']}>
                <AdminEventsPage />
              </ProtectedRoute>
            } />
            <Route path="benefits" element={
              <ProtectedRoute allowedRoles={['ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM']}>
                <AdminBenefitsPage />
              </ProtectedRoute>
            } />
            <Route path="insurances" element={
              <ProtectedRoute allowedRoles={['ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'LOJA']}>
                <AdminInsurancesPage />
              </ProtectedRoute>
            } />
            <Route path="pagamentos" element={
              <ProtectedRoute allowedRoles={['ADMIN_RELM', 'GERENTE_RELM']}>
                <AdminPaymentsPage />
              </ProtectedRoute>
            } />
            {/* Feed view-only do Distribuidor (não acessa a gestão de eventos/benefícios) */}
            <Route path="meus-eventos" element={
              <ProtectedRoute allowedRoles={['DISTRIBUIDOR', 'ADMIN_RELM']}>
                <DistribuidorEventosPage />
              </ProtectedRoute>
            } />
            <Route path="meus-beneficios" element={
              <ProtectedRoute allowedRoles={['DISTRIBUIDOR', 'ADMIN_RELM']}>
                <DistribuidorBeneficiosPage />
              </ProtectedRoute>
            } />
            <Route path="users" element={
              <ProtectedRoute allowedRoles={['ADMIN_RELM']}>
                <AdminUsersPage />
              </ProtectedRoute>
            } />
            <Route path="audit-logs" element={
              <ProtectedRoute allowedRoles={['ADMIN_RELM']}>
                <AuditLogsPage />
              </ProtectedRoute>
            } />
            {/* Catch-all do admin: rotas /admin/... desconhecidas (ex.: links
                antigos de notificações) redirecionam para /admin em vez de tela branca. */}
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>

          {/* ── Catch-all global: qualquer outra URL desconhecida volta para a home ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
