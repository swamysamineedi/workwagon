import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from './Button';

export default function Navbar() {
  const { isAuthenticated, user } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const navigate = useNavigate();

  const dashboardPath = user?.role === 'worker' ? '/worker'
    : user?.role === 'shop' ? '/shop'
    : user?.role === 'admin' ? '/admin'
    : '/login';

  return (
    <nav className="landing-nav">
      <div className="landing-nav-inner">
        <Link to="/" className="landing-nav-logo">
          <div className="landing-nav-mark">W</div>
          <span className="landing-nav-wordmark">Work Wagon</span>
        </Link>

        <div className="landing-nav-links">
          <a href="#features" className="landing-nav-link">Features</a>
          <a href="#how-it-works" className="landing-nav-link">How It Works</a>
          <a href="#for-workers" className="landing-nav-link">For Workers</a>
          <a href="#for-shops" className="landing-nav-link">For Businesses</a>
        </div>

        <div className="landing-nav-actions">
          {isAuthenticated ? (
            <Link to={dashboardPath}>
              <Button variant="primary" size="sm">Go to Dashboard</Button>
            </Link>
          ) : (
            <>
              <div 
                className={`login-dropdown-wrapper ${isLoginOpen ? 'open' : ''}`}
                onMouseEnter={() => setIsLoginOpen(true)}
                onMouseLeave={() => setIsLoginOpen(false)}
              >
                <button 
                  className="btn btn-ghost btn-sm"
                  onClick={() => setIsLoginOpen(!isLoginOpen)}
                  aria-haspopup="true"
                  aria-expanded={isLoginOpen}
                >
                  Login ▼
                </button>
                <div className="login-dropdown-menu">
                  <Link to="/login" state={{ role: 'worker' }} className="login-dropdown-item" onClick={() => setIsLoginOpen(false)}>
                    👷 Worker
                  </Link>
                  <Link to="/login" state={{ role: 'shop' }} className="login-dropdown-item" onClick={() => setIsLoginOpen(false)}>
                    🏪 Business
                  </Link>
                  <Link to="/admin/login" className="login-dropdown-item" onClick={() => setIsLoginOpen(false)}>
                    👑 Admin
                  </Link>
                </div>
              </div>
              <Link to="/register/worker">
                <Button variant="primary" size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
