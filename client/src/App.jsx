import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './layouts/AppLayout';

// Public pages
import LandingPage         from './pages/LandingPage';
import LoginPage           from './pages/auth/LoginPage';
import RegisterWorkerPage  from './pages/auth/RegisterWorkerPage';
import RegisterShopPage    from './pages/auth/RegisterShopPage';
import UnauthorizedPage    from './pages/UnauthorizedPage';
import NotFoundPage        from './pages/NotFoundPage';

// Worker pages
import WorkerDashboard from './pages/worker/WorkerDashboard';
import WorkerProfile   from './pages/worker/WorkerProfile';
import DiscoverJobs    from './pages/worker/DiscoverJobs';
import JobDetail       from './pages/worker/JobDetail';

// Shop pages
import ShopDashboard    from './pages/shop/ShopDashboard';
import ShopProfile      from './pages/shop/ShopProfile';
import ManageVacancies  from './pages/shop/ManageVacancies';
import CreateVacancy    from './pages/shop/CreateVacancy';
import EditVacancy      from './pages/shop/EditVacancy';
import FindWorkers      from './pages/shop/FindWorkers';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* ── Public ──────────────────────────────────────────────────────── */}
        <Route path="/"                    element={<LandingPage />} />
        <Route path="/login"               element={<LoginPage />} />
        <Route path="/register/worker"     element={<RegisterWorkerPage />} />
        <Route path="/register/shop"       element={<RegisterShopPage />} />
        <Route path="/unauthorized"        element={<UnauthorizedPage />} />

        {/* ── Worker area ─────────────────────────────────────────────────── */}
        <Route
          path="/worker"
          element={
            <ProtectedRoute roles={['worker']}>
              <AppLayout role="worker" />
            </ProtectedRoute>
          }
        >
          <Route index            element={<WorkerDashboard />} />
          <Route path="profile"   element={<WorkerProfile />} />
          <Route path="jobs"      element={<DiscoverJobs />} />
          <Route path="jobs/:id"  element={<JobDetail />} />
        </Route>

        {/* ── Shop area ───────────────────────────────────────────────────── */}
        <Route
          path="/shop"
          element={
            <ProtectedRoute roles={['shop']}>
              <AppLayout role="shop" />
            </ProtectedRoute>
          }
        >
          <Route index                        element={<ShopDashboard />} />
          <Route path="profile"               element={<ShopProfile />} />
          <Route path="vacancies"             element={<ManageVacancies />} />
          <Route path="vacancies/new"         element={<CreateVacancy />} />
          <Route path="vacancies/:id/edit"    element={<EditVacancy />} />
          <Route path="find-workers"          element={<FindWorkers />} />
        </Route>

        {/* ── Admin (placeholder) ─────────────────────────────────────────── */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <div className="page">
                <h1 style={{ color: 'var(--text)' }}>Admin Panel</h1>
                <p style={{ color: 'var(--text-muted)' }}>Coming soon.</p>
              </div>
            </ProtectedRoute>
          }
        />

        {/* ── 404 ─────────────────────────────────────────────────────────── */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}
