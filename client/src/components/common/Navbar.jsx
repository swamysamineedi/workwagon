import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from './Button';

export default function Navbar() {
  const { isAuthenticated, user } = useAuth();

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
              <Link to="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
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
