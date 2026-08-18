import { useState, useEffect } from 'react';
import { shopService } from '../../services/shopService';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import ErrorState from '../../components/common/ErrorState';

const INDUSTRIES = [
  'Hospitality', 'Retail', 'Logistics', 'Healthcare', 'Construction',
  'Administration', 'Technology', 'Education', 'Other',
];
const BIZ_TYPES = [
  'Café', 'Restaurant', 'Bar', 'Warehouse', 'Retail Store', 'Hotel',
  'Office', 'Factory', 'Other',
];

export default function ShopProfile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    shopService.getMyProfile()
      .then((res) => {
        const p = res.data.data.profile;
        setProfile(p);
        setForm({
          businessName: p.businessName || '',
          businessType: p.businessType || '',
          industry:     p.industry     || '',
          description:  p.description  || '',
          phone:        p.phone        || '',
          website:      p.website      || '',
          abn:          p.abn          || '',
          location: {
            address:  p.location?.address  || '',
            city:     p.location?.city     || '',
            region:   p.location?.region   || '',
            country:  p.location?.country  || 'Australia',
            postcode: p.location?.postcode || '',
          },
          isPublic: p.isPublic ?? true,
        });
      })
      .catch(() => setError('Failed to load your business profile.'))
      .finally(() => setLoading(false));
  }, []);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const setNested = (parent, k) => (e) =>
    setForm((p) => ({ ...p, [parent]: { ...p[parent], [k]: e.target.value } }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setSuccess(''); setError('');
    try {
      const res = await shopService.updateMyProfile(form);
      setProfile(res.data.data.profile);
      setSuccess('Profile saved successfully!');
      setTimeout(() => setSuccess(''), 3500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;
  if (!form) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  const completeness = profile?.profileCompleteness ?? 0;

  return (
    <div className="page fade-in">
      <div className="page-hero">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 'var(--r)',
            background: 'var(--primary-glow)', border: '1px solid var(--primary-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
          }}>🏢</div>
          <div>
            <h2 className="page-hero-title">{form.businessName || 'Your Business'}</h2>
            <p className="page-hero-sub">Profile completeness: {completeness}%</p>
            <div className="progress-bar-wrap" style={{ marginTop: '0.5rem', maxWidth: 220 }}>
              <div className="progress-bar-fill" style={{ width: `${completeness}%` }} />
            </div>
          </div>
          {profile?.isVerified && (
            <span className="badge badge-success" style={{ alignSelf: 'flex-start' }}>✓ Verified Business</span>
          )}
        </div>
      </div>

      {success && <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>✅ {success}</div>}
      {error   && <div className="alert alert-error"   style={{ marginBottom: '1.25rem' }}>⚠️ {error}</div>}

      <form onSubmit={handleSave} id="shop-profile-form">
        {/* Business identity */}
        <div className="card section">
          <h3 className="section-title" style={{ marginBottom: '1.25rem' }}>Business Information</h3>
          <FormField id="sp-bname" label="Business name" value={form.businessName} onChange={set('businessName')} required />
          <div className="grid-2" style={{ marginTop: '0.875rem' }}>
            <FormField
              id="sp-btype" label="Business type" type="select"
              value={form.businessType} onChange={set('businessType')}
              placeholder="Select type…"
              options={BIZ_TYPES.map((t) => ({ value: t, label: t }))}
            />
            <FormField
              id="sp-industry" label="Industry" type="select"
              value={form.industry} onChange={set('industry')}
              placeholder="Select industry…"
              options={INDUSTRIES.map((i) => ({ value: i, label: i }))}
            />
          </div>
          <FormField
            id="sp-desc" label="Business description" type="textarea" rows={5}
            value={form.description} onChange={set('description')}
            placeholder="Tell workers about your business, culture, and what makes it a great place to work…"
            hint={`${form.description.length}/1000`}
            style={{ marginTop: '0.875rem' }}
          />
          <div className="grid-2" style={{ marginTop: '0.875rem' }}>
            <FormField id="sp-phone" label="Phone" type="tel" value={form.phone} onChange={set('phone')} placeholder="+61 3 xxxx xxxx" />
            <FormField id="sp-website" label="Website" type="url" value={form.website} onChange={set('website')} placeholder="https://yourbusiness.com" />
          </div>
          <FormField id="sp-abn" label="ABN (Australian Business Number)" value={form.abn} onChange={set('abn')} placeholder="12 345 678 901" style={{ marginTop: '0.875rem' }} />
        </div>

        {/* Location */}
        <div className="card section" style={{ marginTop: '1.25rem' }}>
          <h3 className="section-title" style={{ marginBottom: '1.25rem' }}>Business Location</h3>
          <FormField id="sp-address" label="Street address" value={form.location.address} onChange={setNested('location', 'address')} placeholder="123 Main Street" />
          <div className="grid-2" style={{ marginTop: '0.875rem' }}>
            <FormField id="sp-city"     label="City"     value={form.location.city}     onChange={setNested('location', 'city')}     placeholder="Melbourne" />
            <FormField id="sp-postcode" label="Postcode" value={form.location.postcode} onChange={setNested('location', 'postcode')} placeholder="3000" />
          </div>
          <div className="grid-2" style={{ marginTop: '0.875rem' }}>
            <FormField id="sp-region"  label="State / Region" value={form.location.region}  onChange={setNested('location', 'region')}  placeholder="VIC" />
            <FormField id="sp-country" label="Country"        value={form.location.country} onChange={setNested('location', 'country')} placeholder="Australia" />
          </div>
        </div>

        {/* Visibility */}
        <div className="card section" style={{ marginTop: '1.25rem' }}>
          <h3 className="section-title" style={{ marginBottom: '0.75rem' }}>Profile Visibility</h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.isPublic}
              onChange={(e) => setForm((p) => ({ ...p, isPublic: e.target.checked }))}
              style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
            />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.875rem' }}>Public profile</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Allow workers to discover your business</div>
            </div>
          </label>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <Button type="submit" variant="primary" size="lg" loading={saving}>
            {saving ? 'Saving…' : 'Save Profile'}
          </Button>
        </div>
      </form>
    </div>
  );
}
