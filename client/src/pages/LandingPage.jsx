import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';

const FEATURES = [
  {
    icon: '🧑‍💼', title: 'Professional Profiles',
    desc: 'Showcase your skills, experience, and availability. Workers stand out; shops build trusted business identities.',
  },
  {
    icon: '📍', title: 'Local Job Discovery',
    desc: 'Find opportunities near you. Filter by location, category, pay, and employment type.',
  },
  {
    icon: '🪣', title: 'Vacancy & Slot Management',
    desc: 'Shops post vacancies with a slot system — fill positions transparently with real-time availability.',
  },
  {
    icon: '🤝', title: 'Mutual Connections',
    desc: 'Both sides must agree. Connections only form when a worker and a shop both want to work together.',
  },
  {
    icon: '🟢', title: 'Availability Status',
    desc: 'Workers signal when they\'re ready to work. Shops only see workers who are actively looking.',
  },
  {
    icon: '✅', title: 'Trusted Businesses',
    desc: 'Verified business badges help workers identify professional, legitimate employers.',
  },
];

const WORKER_STEPS = [
  { title: 'Create Your Profile', desc: 'Add your skills, experience, job categories, and set your availability.' },
  { title: 'Discover Opportunities', desc: 'Browse open vacancies filtered by your location, category, and preferences.' },
  { title: 'Express Interest', desc: 'Request to connect with shops that match your career goals.' },
  { title: 'Get Connected', desc: 'When the shop accepts, a mutual connection is formed — your next job awaits.' },
];

const SHOP_STEPS = [
  { title: 'Create Business Profile', desc: 'Set up your verified business identity with industry, location, and contact details.' },
  { title: 'Post a Vacancy', desc: 'Specify the role, skills, pay, and how many slots you need to fill.' },
  { title: 'Discover Workers', desc: 'Browse available workers by skill, category, and location.' },
  { title: 'Connect & Hire', desc: 'Invite or accept workers. Slots are tracked automatically.' },
];

export default function LandingPage() {
  return (
    <div>
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-eyebrow">
              <span>🚀</span>
              Employment Platform for Modern Work
            </div>
            <h1 className="hero-title">
              Find the right work.<br />
              Find the <span className="highlight">right people.</span>
            </h1>
            <p className="hero-desc">
              Work Wagon connects skilled workers with businesses that need them.
              Professional profiles, real vacancies, mutual connections — employment
              the way it should work.
            </p>
            <div className="hero-ctas">
              <Link to="/register/worker">
                <button className="btn btn-primary btn-xl">Find Work</button>
              </Link>
              <Link to="/register/shop">
                <button className="btn btn-accent btn-xl">Find Workers</button>
              </Link>
            </div>
            <div className="hero-proof">
              <div className="hero-proof-item">
                <div className="hero-proof-dot" />
                Workers & Shops
              </div>
              <div className="hero-proof-divider" />
              <div className="hero-proof-item">
                <div className="hero-proof-dot" />
                Real Vacancies
              </div>
              <div className="hero-proof-divider" />
              <div className="hero-proof-item">
                <div className="hero-proof-dot" />
                Mutual Connections
              </div>
            </div>
          </div>

          {/* Floating demo cards */}
          <div className="hero-visual" aria-hidden="true">
            <div className="hero-float-card hfc-worker">
              <div className="hfc-label">👤 Worker Profile</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#0d9488,#0f766e)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                }}>JD</div>
                <div>
                  <div className="hfc-name">Jordan D.</div>
                  <div className="hfc-sub">Barista · Hospitality</div>
                </div>
              </div>
              <div style={{ marginTop: '0.625rem', display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                {['Coffee', 'Latte Art', 'POS'].map(s => (
                  <span key={s} className="chip chip-sm chip-primary">{s}</span>
                ))}
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <span className="badge badge-success">🟢 Available</span>
              </div>
            </div>

            <div className="hero-float-card hfc-match" style={{ background: 'var(--surface-2)' }}>
              <div className="hfc-label">✅ New Connection</div>
              <div className="hfc-name" style={{ color: 'var(--success)' }}>Match Confirmed!</div>
              <div className="hfc-sub">Jordan ↔ The Brew House</div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Slot 2 of 3 filled
              </div>
            </div>

            <div className="hero-float-card hfc-shop">
              <div className="hfc-label">🏢 Business Profile</div>
              <div className="hfc-name">The Brew House</div>
              <div className="hfc-sub">Café · Melbourne CBD</div>
              <div style={{ marginTop: '0.625rem' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                  Barista Vacancy — 3 slots
                </div>
                <div className="slot-bar" style={{ height: 6 }}>
                  <div className="slot-fill moderate" style={{ width: '67%' }} />
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  1 slot remaining
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────── */}
      <section className="features-section" id="features">
        <div className="container">
          <p className="section-eyebrow">What We Offer</p>
          <h2 className="section-heading">Everything you need to connect</h2>
          <p className="section-desc">
            From professional profiles to vacancy management, Work Wagon gives
            workers and businesses the tools they need to find each other.
          </p>
          <div className="features-grid">
            {FEATURES.map(({ icon, title, desc }) => (
              <div className="feature-card" key={title}>
                <div className="feature-icon">{icon}</div>
                <h3 className="feature-title">{title}</h3>
                <p className="feature-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section className="how-section" id="how-it-works">
        <div className="container">
          <p className="section-eyebrow">How It Works</p>
          <h2 className="section-heading">Simple. Transparent. Mutual.</h2>
          <p className="section-desc">
            Whether you're looking for work or looking to hire,
            the process is straightforward and fair.
          </p>
          <div className="how-grid">
            {/* Worker */}
            <div id="for-workers">
              <h3 className="how-panel-title">
                <span className="how-panel-badge worker">Worker</span>
                Find Your Next Role
              </h3>
              <div className="how-steps">
                {WORKER_STEPS.map(({ title, desc }, i) => (
                  <div className="how-step" key={title}>
                    <div className="how-step-num">{i + 1}</div>
                    <div className="how-step-content">
                      <h4>{title}</h4>
                      <p>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/register/worker" style={{ display: 'inline-block', marginTop: '1.5rem' }}>
                <button className="btn btn-primary">Get Started as a Worker →</button>
              </Link>
            </div>

            {/* Shop */}
            <div id="for-shops">
              <h3 className="how-panel-title">
                <span className="how-panel-badge shop">Business</span>
                Build Your Team
              </h3>
              <div className="how-steps">
                {SHOP_STEPS.map(({ title, desc }, i) => (
                  <div className="how-step" key={title}>
                    <div className="how-step-num">{i + 1}</div>
                    <div className="how-step-content">
                      <h4>{title}</h4>
                      <p>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/register/shop" style={{ display: 'inline-block', marginTop: '1.5rem' }}>
                <button className="btn btn-accent">Get Started as a Business →</button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="cta-section">
        <div className="cta-inner">
          <h2 className="cta-title">Ready to get started?</h2>
          <p className="cta-sub">
            Join Work Wagon today. Create your profile, discover opportunities,
            and make the right connections — for free.
          </p>
          <div className="cta-btns">
            <Link to="/register/worker">
              <button className="btn btn-primary btn-xl">I'm looking for work</button>
            </Link>
            <Link to="/register/shop">
              <button className="btn btn-accent btn-xl">I'm hiring</button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <span>🚛</span> Work Wagon
          </div>
          <span className="landing-footer-copy">© {new Date().getFullYear()} Work Wagon. All rights reserved.</span>
          <div className="landing-footer-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <Link to="/login">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
