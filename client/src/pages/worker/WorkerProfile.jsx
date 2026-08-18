import { useState, useEffect } from 'react';
import { workerService } from '../../services/workerService';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import Avatar from '../../components/common/Avatar';
import Loading from '../../components/common/Loading';
import ErrorState from '../../components/common/ErrorState';

function TagsInput({ label, values = [], onChange, placeholder }) {
  const [input, setInput] = useState('');

  const add = () => {
    const v = input.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput('');
  };

  const remove = (tag) => onChange(values.filter((t) => t !== tag));

  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <div className="tags-input">
        {values.map((t) => (
          <span key={t} className="tag-item">
            {t}
            <button className="tag-remove" type="button" onClick={() => remove(t)}>✕</button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
        />
      </div>
      <p className="form-hint">Press Enter to add</p>
    </div>
  );
}

function AvailabilityToggle({ isAvailable, onChange }) {
  return (
    <button
      type="button"
      className={`availability-toggle ${isAvailable ? 'available' : 'unavailable'}`}
      onClick={() => onChange(!isAvailable)}
    >
      <div className={`toggle-switch ${isAvailable ? 'on' : ''}`}>
        <div className="toggle-knob" />
      </div>
      <div>
        <div className={`toggle-label ${isAvailable ? 'available' : 'unavailable'}`}>
          {isAvailable ? '🟢 Available for work' : '🔴 Not available'}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
          {isAvailable ? 'Shops can discover your profile' : 'Your profile is hidden from shops'}
        </div>
      </div>
    </button>
  );
}

export default function WorkerProfile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    workerService.getMyProfile()
      .then((res) => {
        const p = res.data.data.profile;
        setProfile(p);
        setForm({
          firstName: p.firstName || '',
          lastName:  p.lastName  || '',
          bio:       p.bio       || '',
          phone:     p.phone     || '',
          skills:    p.skills    || [],
          jobCategories: p.jobCategories || [],
          experienceYears: p.experienceYears ?? '',
          availability: {
            isAvailable:    p.availability?.isAvailable    ?? true,
            preferredHours: p.availability?.preferredHours ?? 'flexible',
          },
          location: {
            city:    p.location?.city    || '',
            region:  p.location?.region  || '',
            country: p.location?.country || 'Australia',
          },
          isPublic: p.isPublic ?? true,
        });
      })
      .catch(() => setError('Failed to load your profile.'))
      .finally(() => setLoading(false));
  }, []);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const setNested = (parent, k) => (e) =>
    setForm((p) => ({ ...p, [parent]: { ...p[parent], [k]: e.target.value } }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(''); setError('');
    try {
      const res = await workerService.updateMyProfile({
        ...form,
        experienceYears: form.experienceYears !== '' ? Number(form.experienceYears) : undefined,
      });
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

  const displayName = `${form.firstName} ${form.lastName}`.trim();
  const completeness = profile?.profileCompleteness ?? 0;

  return (
    <div className="page fade-in">
      <div className="page-hero">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Avatar name={displayName} src={profile?.avatarUrl} size="xl" />
          <div>
            <h2 className="page-hero-title">{displayName || 'Your Profile'}</h2>
            <p className="page-hero-sub">Profile completeness: {completeness}%</p>
            <div className="progress-bar-wrap" style={{ marginTop: '0.5rem', maxWidth: 220 }}>
              <div className="progress-bar-fill" style={{ width: `${completeness}%` }} />
            </div>
          </div>
        </div>
      </div>

      {success && <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>✅ {success}</div>}
      {error   && <div className="alert alert-error"   style={{ marginBottom: '1.25rem' }}>⚠️ {error}</div>}

      <form onSubmit={handleSave} id="worker-profile-form">
        {/* Identity */}
        <div className="card section">
          <h3 className="section-title" style={{ marginBottom: '1.25rem' }}>Personal Information</h3>
          <div className="grid-2">
            <FormField id="wp-first" label="First name" value={form.firstName} onChange={set('firstName')} required />
            <FormField id="wp-last"  label="Last name"  value={form.lastName}  onChange={set('lastName')}  required />
          </div>
          <FormField id="wp-phone" label="Phone number" type="tel" value={form.phone} onChange={set('phone')} placeholder="+61 4xx xxx xxx" style={{ marginTop: '0.875rem' }} />
          <FormField
            id="wp-bio" label="About you" type="textarea" rows={4}
            value={form.bio} onChange={set('bio')}
            placeholder="Describe your experience, what you're looking for, and what makes you a great hire…"
            hint={`${form.bio.length}/500`}
            style={{ marginTop: '0.875rem' }}
          />
        </div>

        {/* Skills */}
        <div className="card section" style={{ marginTop: '1.25rem' }}>
          <h3 className="section-title" style={{ marginBottom: '1.25rem' }}>Skills & Experience</h3>
          <TagsInput
            label="Skills"
            values={form.skills}
            onChange={(v) => setForm((p) => ({ ...p, skills: v }))}
            placeholder="e.g. barista, forklift, customer service…"
          />
          <div style={{ marginTop: '0.875rem' }}>
            <TagsInput
              label="Job Categories"
              values={form.jobCategories}
              onChange={(v) => setForm((p) => ({ ...p, jobCategories: v }))}
              placeholder="e.g. hospitality, logistics, retail…"
            />
          </div>
          <div style={{ marginTop: '0.875rem' }}>
            <FormField
              id="wp-exp" label="Years of experience" type="number"
              value={form.experienceYears} onChange={set('experienceYears')}
              placeholder="0" min="0" max="60"
            />
          </div>
        </div>

        {/* Availability */}
        <div className="card section" style={{ marginTop: '1.25rem' }}>
          <h3 className="section-title" style={{ marginBottom: '1.25rem' }}>Availability</h3>
          <AvailabilityToggle
            isAvailable={form.availability.isAvailable}
            onChange={(v) => setForm((p) => ({ ...p, availability: { ...p.availability, isAvailable: v } }))}
          />
          <div style={{ marginTop: '0.875rem' }}>
            <FormField
              id="wp-hours" label="Preferred hours" type="select"
              value={form.availability.preferredHours}
              onChange={(e) => setForm((p) => ({ ...p, availability: { ...p.availability, preferredHours: e.target.value } }))}
              options={[
                { value: 'full-time', label: 'Full-time' },
                { value: 'part-time', label: 'Part-time' },
                { value: 'casual',    label: 'Casual' },
                { value: 'flexible',  label: 'Flexible' },
              ]}
            />
          </div>
        </div>

        {/* Location */}
        <div className="card section" style={{ marginTop: '1.25rem' }}>
          <h3 className="section-title" style={{ marginBottom: '1.25rem' }}>Location</h3>
          <div className="grid-2">
            <FormField id="wp-city"    label="City"    value={form.location.city}    onChange={setNested('location', 'city')}    placeholder="Melbourne" />
            <FormField id="wp-region"  label="State / Region" value={form.location.region} onChange={setNested('location', 'region')} placeholder="VIC" />
          </div>
          <div style={{ marginTop: '0.875rem' }}>
            <FormField id="wp-country" label="Country" value={form.location.country} onChange={setNested('location', 'country')} placeholder="Australia" />
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
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Allow shops to discover your profile</div>
            </div>
          </label>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
          <Button type="submit" variant="primary" size="lg" loading={saving}>
            {saving ? 'Saving…' : 'Save Profile'}
          </Button>
        </div>
      </form>
    </div>
  );
}
