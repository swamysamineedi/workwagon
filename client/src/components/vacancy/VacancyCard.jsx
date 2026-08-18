import { Link } from 'react-router-dom';
import Badge from '../common/Badge';

const STATUS_VARIANTS = {
  open: 'success', paused: 'warning', closed: 'muted',
  filled: 'primary', expired: 'error', draft: 'muted',
};

const TYPE_LABELS = {
  'full-time': 'Full-time', 'part-time': 'Part-time',
  'casual': 'Casual', 'contract': 'Contract',
};

function SlotBar({ filled, total }) {
  const available = Math.max(0, total - filled);
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
  const cls = pct >= 100 ? 'full' : pct >= 80 ? 'low' : pct >= 40 ? 'moderate' : 'open';
  return (
    <div className="slot-indicator">
      <div className="slot-counts">
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
          <strong style={{ color: available > 0 ? 'var(--success)' : 'var(--error)' }}>
            {available}
          </strong> slot{available !== 1 ? 's' : ''} available
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          {filled}/{total} filled
        </span>
      </div>
      <div className="slot-bar">
        <div className={`slot-fill ${cls}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function VacancyCard({ vacancy, showShop = true, actions }) {
  const { _id, title, category, employmentType, status, payRate,
    totalSlots, filledSlots, availableSlots, shop, location } = vacancy;

  const available = availableSlots ?? Math.max(0, totalSlots - (filledSlots || 0));

  return (
    <div className="vacancy-card fade-in">
      <div className="vacancy-card-header">
        {showShop && shop?.logoUrl ? (
          <img
            src={shop.logoUrl} alt={shop.businessName}
            style={{ width: 44, height: 44, borderRadius: 'var(--r)', objectFit: 'cover', flexShrink: 0 }}
          />
        ) : (
          <div style={{
            width: 44, height: 44, borderRadius: 'var(--r)', flexShrink: 0,
            background: 'var(--primary-glow)', border: '1px solid var(--primary-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
          }}>🏢</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="vacancy-card-title truncate">{title}</div>
          {showShop && shop && (
            <div className="vacancy-card-shop truncate">{shop.businessName}</div>
          )}
        </div>
        <Badge variant={STATUS_VARIANTS[status] || 'muted'}>{status}</Badge>
      </div>

      <div className="vacancy-card-meta">
        {category && <span className="chip chip-sm">{category}</span>}
        {employmentType && <span className="chip chip-sm">{TYPE_LABELS[employmentType] || employmentType}</span>}
        {location?.city && (
          <span className="chip chip-sm">📍 {location.city}</span>
        )}
        {payRate?.amount && (
          <span className="chip chip-sm">
            💰 {payRate.currency || 'AUD'} {payRate.amount}/{payRate.period || 'hr'}
          </span>
        )}
      </div>

      <SlotBar filled={filledSlots || 0} total={totalSlots || 1} />

      <div className="vacancy-card-footer">
        <Link to={`/worker/jobs/${_id}`} style={{ textDecoration: 'none' }}>
          <button className="btn btn-secondary btn-sm">View Details</button>
        </Link>
        {actions && <div style={{ display: 'flex', gap: '0.375rem' }}>{actions}</div>}
      </div>
    </div>
  );
}
