import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import { useAuth } from '../hooks/useAuth';

const PAGE_TITLES = {
  '/worker':          'Dashboard',
  '/worker/jobs':     'Discover Jobs',
  '/worker/profile':  'My Profile',
  '/worker/messages': 'Messages',
  '/shop':            'Dashboard',
  '/shop/vacancies':  'My Vacancies',
  '/shop/find-workers': 'Find Workers',
  '/shop/profile':    'Business Profile',
  '/shop/vacancies/new': 'Post a Vacancy',
  '/shop/messages':   'Messages',
  '/admin':           'Admin Dashboard',
  '/admin/users':     'Manage Workers',
  '/admin/businesses': 'Manage Businesses',
  '/admin/verifications': 'Pending Verifications',
  '/admin/vacancies': 'Vacancy Moderation',
  '/admin/reports':   'Platform Reports',
  '/admin/analytics': 'Platform Analytics',
};

export default function AppLayout({ role }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'Work Wagon';
  const displayName = user?.email?.split('@')[0] || 'User';

  return (
    <div className="app-layout">
      <Sidebar
        role={role}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <button
              className="topbar-hamburger"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
            >☰</button>
            <h1 className="topbar-title">{title}</h1>
          </div>
          <div className="topbar-actions">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {displayName}
            </span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={logout}
              style={{ fontSize: '0.8rem' }}
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
