import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Avatar from './Avatar';

function SidebarLink({ to, icon, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
      end
    >
      <span className="sidebar-link-icon">{icon}</span>
      {children}
    </NavLink>
  );
}

export default function Sidebar({ role, mobileOpen, onClose }) {
  const { user, logout } = useAuth();
  const displayName = user?.email?.split('@')[0] || 'User';

  const workerLinks = [
    { to: '/worker', icon: '🏠', label: 'Home' },
    { to: '/worker/jobs', icon: '🔍', label: 'Discover Jobs' },
    { to: '/worker/connections', icon: '🤝', label: 'Connections' },
    { to: '/worker/profile', icon: '👤', label: 'My Profile' },
  ];

  const shopLinks = [
    { to: '/shop', icon: '🏠', label: 'Home' },
    { to: '/shop/vacancies', icon: '📋', label: 'My Vacancies' },
    { to: '/shop/find-workers', icon: '🔍', label: 'Find Workers' },
    { to: '/shop/connections', icon: '🤝', label: 'Connections' },
    { to: '/shop/profile', icon: '🏢', label: 'Business Profile' },
  ];

  const adminLinks = [
    { to: '/admin', icon: '🛡️', label: 'Admin Home' },
  ];

  const links = role === 'worker' ? workerLinks : role === 'shop' ? shopLinks : adminLinks;
  const roleLabel = role === 'worker' ? 'Worker' : role === 'shop' ? 'Business' : 'Admin';

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && <div className="sidebar-overlay visible" onClick={onClose} />}

      <aside className={`sidebar${mobileOpen ? ' open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <Link to="/" className="sidebar-logo-mark" style={{ textDecoration: 'none' }}>W</Link>
          <div>
            <div className="sidebar-logo-text">Work Wagon</div>
            <div className="sidebar-logo-sub">{roleLabel} Portal</div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <div className="sidebar-section-label">Menu</div>
            {links.map(({ to, icon, label }) => (
              <SidebarLink key={to} to={to} icon={icon}>{label}</SidebarLink>
            ))}
          </div>
        </nav>

        {/* User footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={logout} title="Sign out">
            <Avatar name={displayName} size="sm" />
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{displayName}</div>
              <div className="sidebar-user-role">{role} · Sign out</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
