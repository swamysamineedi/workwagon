import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { vacancyService } from '../../services/vacancyService';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';

const CATEGORIES = ['Hospitality', 'Retail', 'Logistics', 'Healthcare', 'Construction', 'Administration', 'Technology', 'Other'];
const EMP_TYPES  = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'casual',    label: 'Casual' },
  { value: 'contract',  label: 'Contract' },
];
const PAY_PERIODS = [
  { value: 'hourly',   label: 'Per hour' },
  { value: 'daily',    label: 'Per day' },
  { value: 'weekly',   label: 'Per week' },
  { value: 'annually', label: 'Per year' },
];

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
            <button type="button" className="tag-remove" onClick={() => remove(t)}>✕</button>
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

export default function CreateVacancy() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', category: '',
    requiredSkills: [],
    employmentType: '', totalSlots: 1,
    payRate: { amount: '', currency: 'AUD', period: 'hourly' },
    location: { city: '', region: '', country: 'Australia' },
    startsAt: '', expiresAt: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const setNested = (parent, k) => (e) =>
    setForm((p) => ({ ...p, [parent]: { ...p[parent], [k]: e.target.value } }));

  const validate = () => {
    const e = {};
    if (!form.title.trim())       e.title = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.category)           e.category = 'Category is required';
    if (!form.employmentType)     e.employmentType = 'Employment type is required';
    if (!form.totalSlots || Number(form.totalSlots) < 1) e.totalSlots = 'At least 1 slot required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await vacancyService.create({
        ...form,
        totalSlots: Number(form.totalSlots),
        payRate: {
          ...form.payRate,
          amount: form.payRate.amount ? Number(form.payRate.amount) : undefined,
        },
        startsAt:  form.startsAt  || undefined,
        expiresAt: form.expiresAt || undefined,
      });
      navigate('/shop/vacancies');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to create vacancy.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page fade-in">
      <div className="page-hero">
        <h2 className="page-hero-title">Post a Vacancy ➕</h2>
        <p className="page-hero-sub">Create a new job listing for workers to discover</p>
      </div>

      {serverError && (
        <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>⚠️ {serverError}</div>
      )}

      <form onSubmit={handleSubmit} id="create-vacancy-form">
        {/* Job details */}
        <div className="card section">
          <h3 className="section-title" style={{ marginBottom: '1.25rem' }}>Job Details</h3>
          <FormField
            id="cv-title" label="Job title" required
            value={form.title} onChange={set('title')}
            error={errors.title} placeholder="e.g. Experienced Barista"
          />
          <FormField
            id="cv-desc" label="Job description" type="textarea" rows={6} required
            value={form.description} onChange={set('description')}
            error={errors.description}
            placeholder="Describe the role, responsibilities, working conditions, and what you're looking for…"
            style={{ marginTop: '0.875rem' }}
          />
          <div className="grid-2" style={{ marginTop: '0.875rem' }}>
            <FormField
              id="cv-cat" label="Category" type="select" required
              value={form.category} onChange={set('category')}
              error={errors.category} placeholder="Select a category…"
              options={CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
            <FormField
              id="cv-type" label="Employment type" type="select" required
              value={form.employmentType} onChange={set('employmentType')}
              error={errors.employmentType} placeholder="Select type…"
              options={EMP_TYPES}
            />
          </div>
          <div style={{ marginTop: '0.875rem' }}>
            <TagsInput
              label="Required Skills"
              values={form.requiredSkills}
              onChange={(v) => setForm((p) => ({ ...p, requiredSkills: v }))}
              placeholder="e.g. barista, latte art, POS system…"
            />
          </div>
        </div>

        {/* Slots */}
        <div className="card section" style={{ marginTop: '1.25rem' }}>
          <h3 className="section-title" style={{ marginBottom: '0.5rem' }}>Slot Management</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Slots define how many workers you want for this role.
            Available slots = Total − Filled. The system tracks this automatically.
          </p>
          <FormField
            id="cv-slots" label="Total slots" type="number" required
            value={form.totalSlots} onChange={set('totalSlots')}
            error={errors.totalSlots}
            min="1" max="100" hint="How many workers do you need for this position?"
          />
        </div>

        {/* Pay */}
        <div className="card section" style={{ marginTop: '1.25rem' }}>
          <h3 className="section-title" style={{ marginBottom: '1.25rem' }}>Pay Rate (Optional)</h3>
          <div className="grid-2">
            <FormField
              id="cv-pay" label="Pay amount" type="number"
              value={form.payRate.amount} onChange={setNested('payRate', 'amount')}
              placeholder="e.g. 25" min="0"
            />
            <FormField
              id="cv-period" label="Pay period" type="select"
              value={form.payRate.period} onChange={setNested('payRate', 'period')}
              options={PAY_PERIODS}
            />
          </div>
        </div>

        {/* Location */}
        <div className="card section" style={{ marginTop: '1.25rem' }}>
          <h3 className="section-title" style={{ marginBottom: '1.25rem' }}>Work Location</h3>
          <div className="grid-2">
            <FormField id="cv-city"   label="City"   value={form.location.city}   onChange={setNested('location', 'city')}   placeholder="Melbourne" />
            <FormField id="cv-region" label="State"  value={form.location.region} onChange={setNested('location', 'region')} placeholder="VIC" />
          </div>
        </div>

        {/* Scheduling */}
        <div className="card section" style={{ marginTop: '1.25rem' }}>
          <h3 className="section-title" style={{ marginBottom: '1.25rem' }}>Scheduling (Optional)</h3>
          <div className="grid-2">
            <FormField id="cv-starts"  label="Start date"  type="date" value={form.startsAt}  onChange={set('startsAt')} />
            <FormField id="cv-expires" label="Expiry date" type="date" value={form.expiresAt} onChange={set('expiresAt')} hint="Vacancy closes automatically after this date" />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <Button type="submit" variant="primary" size="lg" loading={loading}>
            {loading ? 'Posting…' : 'Post Vacancy'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/shop/vacancies')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
