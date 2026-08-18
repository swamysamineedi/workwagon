import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { vacancyService } from '../../services/vacancyService';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import ErrorState from '../../components/common/ErrorState';

const CATEGORIES = ['Hospitality', 'Retail', 'Logistics', 'Healthcare', 'Construction', 'Administration', 'Technology', 'Other'];
const EMP_TYPES  = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'casual',    label: 'Casual' },
  { value: 'contract',  label: 'Contract' },
];
const PAY_PERIODS = [
  { value: 'hourly', label: 'Per hour' }, { value: 'daily', label: 'Per day' },
  { value: 'weekly', label: 'Per week' }, { value: 'annually', label: 'Per year' },
];

function TagsInput({ label, values = [], onChange, placeholder }) {
  const [input, setInput] = useState('');
  const add = () => { const v = input.trim(); if (v && !values.includes(v)) onChange([...values, v]); setInput(''); };
  const remove = (tag) => onChange(values.filter((t) => t !== tag));
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <div className="tags-input">
        {values.map((t) => (
          <span key={t} className="tag-item">
            {t}<button type="button" className="tag-remove" onClick={() => remove(t)}>✕</button>
          </span>
        ))}
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder} />
      </div>
      <p className="form-hint">Press Enter to add</p>
    </div>
  );
}

export default function EditVacancy() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [vacancy, setVacancy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    vacancyService.getById(id)
      .then((res) => {
        const v = res.data.data.vacancy;
        setVacancy(v);
        setForm({
          title: v.title || '',
          description: v.description || '',
          category: v.category || '',
          requiredSkills: v.requiredSkills || [],
          employmentType: v.employmentType || '',
          totalSlots: v.totalSlots || 1,
          payRate: { amount: v.payRate?.amount || '', currency: v.payRate?.currency || 'AUD', period: v.payRate?.period || 'hourly' },
          location: { city: v.location?.city || '', region: v.location?.region || '', country: v.location?.country || 'Australia' },
          startsAt:  v.startsAt  ? v.startsAt.split('T')[0]  : '',
          expiresAt: v.expiresAt ? v.expiresAt.split('T')[0] : '',
        });
      })
      .catch(() => setError('Vacancy not found or you do not have permission to edit it.'))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const setNested = (parent, k) => (e) =>
    setForm((p) => ({ ...p, [parent]: { ...p[parent], [k]: e.target.value } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setServerError('');
    try {
      await vacancyService.update(id, {
        ...form,
        totalSlots: Number(form.totalSlots),
        payRate: { ...form.payRate, amount: form.payRate.amount ? Number(form.payRate.amount) : undefined },
        startsAt:  form.startsAt  || undefined,
        expiresAt: form.expiresAt || undefined,
      });
      navigate('/shop/vacancies');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;
  if (error || !form) return <ErrorState message={error} />;

  return (
    <div className="page fade-in">
      <div className="page-hero">
        <h2 className="page-hero-title">Edit Vacancy ✏️</h2>
        <p className="page-hero-sub">{vacancy?.title}</p>
      </div>

      {serverError && <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>⚠️ {serverError}</div>}

      <form onSubmit={handleSubmit} id="edit-vacancy-form">
        <div className="card section">
          <h3 className="section-title" style={{ marginBottom: '1.25rem' }}>Job Details</h3>
          <FormField id="ev-title" label="Job title" required value={form.title} onChange={set('title')} placeholder="e.g. Experienced Barista" />
          <FormField id="ev-desc" label="Description" type="textarea" rows={6} required value={form.description} onChange={set('description')} style={{ marginTop: '0.875rem' }} />
          <div className="grid-2" style={{ marginTop: '0.875rem' }}>
            <FormField id="ev-cat" label="Category" type="select" required value={form.category} onChange={set('category')} options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
            <FormField id="ev-type" label="Employment type" type="select" required value={form.employmentType} onChange={set('employmentType')} options={EMP_TYPES} />
          </div>
          <div style={{ marginTop: '0.875rem' }}>
            <TagsInput label="Required Skills" values={form.requiredSkills} onChange={(v) => setForm((p) => ({ ...p, requiredSkills: v }))} placeholder="Add skill…" />
          </div>
        </div>

        <div className="card section" style={{ marginTop: '1.25rem' }}>
          <h3 className="section-title" style={{ marginBottom: '0.5rem' }}>Slot Management</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            {vacancy?.filledSlots || 0} slots already filled. Total must be ≥ filled slots.
          </p>
          <FormField id="ev-slots" label="Total slots" type="number" required value={form.totalSlots} onChange={set('totalSlots')} min={vacancy?.filledSlots || 1} max="100" />
        </div>

        <div className="card section" style={{ marginTop: '1.25rem' }}>
          <h3 className="section-title" style={{ marginBottom: '1.25rem' }}>Pay Rate</h3>
          <div className="grid-2">
            <FormField id="ev-pay" label="Amount" type="number" value={form.payRate.amount} onChange={setNested('payRate', 'amount')} placeholder="e.g. 25" min="0" />
            <FormField id="ev-period" label="Period" type="select" value={form.payRate.period} onChange={setNested('payRate', 'period')} options={PAY_PERIODS} />
          </div>
        </div>

        <div className="card section" style={{ marginTop: '1.25rem' }}>
          <h3 className="section-title" style={{ marginBottom: '1.25rem' }}>Location & Scheduling</h3>
          <div className="grid-2">
            <FormField id="ev-city" label="City" value={form.location.city} onChange={setNested('location', 'city')} placeholder="Melbourne" />
            <FormField id="ev-region" label="State" value={form.location.region} onChange={setNested('location', 'region')} placeholder="VIC" />
          </div>
          <div className="grid-2" style={{ marginTop: '0.875rem' }}>
            <FormField id="ev-starts"  label="Start date"  type="date" value={form.startsAt}  onChange={set('startsAt')} />
            <FormField id="ev-expires" label="Expiry date" type="date" value={form.expiresAt} onChange={set('expiresAt')} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <Button type="submit" variant="primary" size="lg" loading={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/shop/vacancies')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
