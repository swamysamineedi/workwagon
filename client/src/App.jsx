import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
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
import AdminLoginPage      from './pages/auth/AdminLoginPage';

// Worker pages
import WorkerDashboard from './pages/worker/WorkerDashboard';
import WorkerProfile   from './pages/worker/WorkerProfile';
import DiscoverJobs    from './pages/worker/DiscoverJobs';
import JobDetail       from './pages/worker/JobDetail';
import WorkerConnections from './pages/worker/WorkerConnections';

// Shop pages
import ShopDashboard    from './pages/shop/ShopDashboard';
import ShopProfile      from './pages/shop/ShopProfile';
import ManageVacancies  from './pages/shop/ManageVacancies';
import CreateVacancy    from './pages/shop/CreateVacancy';
import EditVacancy      from './pages/shop/EditVacancy';
import FindWorkers      from './pages/shop/FindWorkers';
import ShopConnections  from './pages/shop/ShopConnections';

// Chat pages (Phase 7)
import MessagesPage from './pages/chat/MessagesPage';
import ChatPage     from './pages/chat/ChatPage';

// Admin pages
import AdminDashboard     from './pages/admin/AdminDashboard';
import UsersManagement    from './pages/admin/UsersManagement';
import BusinessesManagement from './pages/admin/BusinessesManagement';
import Verifications      from './pages/admin/Verifications';
import VacancyModeration  from './pages/admin/VacancyModeration';
import ReportsManagement  from './pages/admin/ReportsManagement';
import Analytics          from './pages/admin/Analytics';

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Routes>
        {/* ── Public ──────────────────────────────────────────────────────── */}
        <Route path="/"                    element={<LandingPage />} />
        <Route path="/login"               element={<LoginPage />} />
        <Route path="/register/worker"     element={<RegisterWorkerPage />} />
        <Route path="/register/shop"       element={<RegisterShopPage />} />
        <Route path="/admin/login"         element={<AdminLoginPage />} />
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
          <Route path="connections" element={<WorkerConnections />} />
          {/* Phase 7 — Chat */}
          <Route path="messages"          element={<MessagesPage />} />
          <Route path="chat/:connectionId" element={<ChatPage />} />
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
          <Route path="connections"           element={<ShopConnections />} />
          {/* Phase 7 — Chat */}
          <Route path="messages"          element={<MessagesPage />} />
          <Route path="chat/:connectionId" element={<ChatPage />} />
        </Route>

        {/* ── Admin ─────────────────────────────────────────────────────────── */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin']} fallback="/admin/login">
              <AppLayout role="admin" />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UsersManagement />} />
          <Route path="businesses" element={<BusinessesManagement />} />
          <Route path="verifications" element={<Verifications />} />
          <Route path="vacancies" element={<VacancyModeration />} />
          <Route path="reports" element={<ReportsManagement />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>

        {/* ── 404 ─────────────────────────────────────────────────────────── */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}
