import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from './components/Header';
import Footer from './components/Footer';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import WarrantyPage from './pages/WarrantyPage';
import BenefitsPage from './pages/BenefitsPage';
import PublicEventsPage from './pages/PublicEventsPage';
import InsurancePage from './pages/InsurancePage';
import NewsletterPage from './pages/NewsletterPage';
import ValidateWarrantyPage from './pages/ValidateWarrantyPage';
import AdminDashboardNew from './pages/AdminDashboardNew';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import CustomerFormPage from './pages/CustomerFormPage';
import StoresPage from './pages/StoresPage';
import StoreFormPage from './pages/StoreFormPage';
import WarrantiesPage from './pages/WarrantiesPage';
import EventsPage from './pages/EventsPage';
import EventFormPage from './pages/EventFormPage';
import EventDetailPage from './pages/EventDetailPage';
import MembershipsPage from './pages/MembershipsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

// Wrapper para páginas públicas com Header/Footer
function PublicLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}

// Wrapper para páginas admin com sidebar
function AdminRouteWrapper({ children, allowedRoles }) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
          <Route path="/login" element={<PublicLayout><LoginPage /></PublicLayout>} />
          <Route path="/garantia" element={<PublicLayout><WarrantyPage /></PublicLayout>} />
          <Route path="/vantagens" element={<PublicLayout><BenefitsPage /></PublicLayout>} />
          <Route path="/eventos" element={<PublicLayout><PublicEventsPage /></PublicLayout>} />
          <Route path="/seguro" element={<PublicLayout><InsurancePage /></PublicLayout>} />
          <Route path="/newsletter" element={<PublicLayout><NewsletterPage /></PublicLayout>} />
          <Route path="/validar-garantia/:token" element={<PublicLayout><ValidateWarrantyPage /></PublicLayout>} />

          {/* ADMIN ROUTES - COM SIDEBAR */}
          <Route
            path="/admin"
            element={
              <AdminRouteWrapper>
                <AdminDashboardNew />
              </AdminRouteWrapper>
            }
          />

          {/* WARRANTIES */}
          <Route
            path="/admin/warranties"
            element={
              <AdminRouteWrapper>
                <WarrantiesPage />
              </AdminRouteWrapper>
            }
          />

          {/* CUSTOMERS */}
          <Route
            path="/admin/customers"
            element={
              <AdminRouteWrapper>
                <CustomersPage />
              </AdminRouteWrapper>
            }
          />
          <Route
            path="/admin/customers/:id"
            element={
              <AdminRouteWrapper>
                <CustomerDetailPage />
              </AdminRouteWrapper>
            }
          />
          <Route
            path="/admin/customers/new"
            element={
              <AdminRouteWrapper>
                <CustomerFormPage />
              </AdminRouteWrapper>
            }
          />
          <Route
            path="/admin/customers/:id/edit"
            element={
              <AdminRouteWrapper>
                <CustomerFormPage />
              </AdminRouteWrapper>
            }
          />

          {/* STORES */}
          <Route
            path="/admin/stores"
            element={
              <AdminRouteWrapper allowedRoles={['ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM', 'DISTRIBUIDOR']}>
                <StoresPage />
              </AdminRouteWrapper>
            }
          />
          <Route
            path="/admin/stores/new"
            element={
              <AdminRouteWrapper allowedRoles={['ADMIN_RELM', 'GERENTE_RELM']}>
                <StoreFormPage />
              </AdminRouteWrapper>
            }
          />
          <Route
            path="/admin/stores/:id/edit"
            element={
              <AdminRouteWrapper allowedRoles={['ADMIN_RELM', 'GERENTE_RELM']}>
                <StoreFormPage />
              </AdminRouteWrapper>
            }
          />

          {/* EVENTS */}
          <Route
            path="/admin/events"
            element={
              <AdminRouteWrapper allowedRoles={['ADMIN_RELM', 'GERENTE_RELM', 'LOJA']}>
                <EventsPage />
              </AdminRouteWrapper>
            }
          />
          <Route
            path="/admin/events/new"
            element={
              <AdminRouteWrapper allowedRoles={['ADMIN_RELM', 'GERENTE_RELM', 'LOJA']}>
                <EventFormPage />
              </AdminRouteWrapper>
            }
          />
          <Route
            path="/admin/events/:id"
            element={
              <AdminRouteWrapper allowedRoles={['ADMIN_RELM', 'GERENTE_RELM', 'LOJA']}>
                <EventDetailPage />
              </AdminRouteWrapper>
            }
          />
          <Route
            path="/admin/events/:id/edit"
            element={
              <AdminRouteWrapper allowedRoles={['ADMIN_RELM', 'GERENTE_RELM', 'LOJA']}>
                <EventFormPage />
              </AdminRouteWrapper>
            }
          />

          {/* MEMBERSHIPS */}
          <Route
            path="/admin/memberships"
            element={
              <AdminRouteWrapper allowedRoles={['ADMIN_RELM', 'GERENTE_RELM']}>
                <MembershipsPage />
              </AdminRouteWrapper>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
