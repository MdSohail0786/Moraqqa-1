import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import PageHead from '../components/PageHead.jsx';
import Seo from '../components/Seo.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { submitEnquiry } from '../services/endpoints.js';
import { BUDGETS, PROJECT_TYPES } from '../config/site.js';
import { EMAIL_RX, PHONE_RX } from '../utils/helpers.js';

const EMPTY = { name: '', email: '', phone: '', city: '', projectType: '', budget: '', area: '', message: '' };

function validate(v) {
  const e = {};
  if (v.name.trim().length < 2) e.name = 'Please enter your name.';
  if (!EMAIL_RX.test(v.email.trim())) e.email = 'Please enter a valid email address.';
  if (!PHONE_RX.test(v.phone.trim())) e.phone = 'Please enter a valid phone number.';
  if (!v.projectType) e.projectType = 'Please choose a project type.';
  if (!v.budget) e.budget = 'Please choose a budget range.';
  if (v.message.trim().length < 10) e.message = 'Please tell us a little more (at least 10 characters).';
  return e;
}

function Field({ id, label, error, children, className = '' }) {
  return (
    <div className={`field ${error ? 'has-error' : ''} ${className}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      <p className="field__error" id={`${id}-error`} role={error ? 'alert' : undefined}>{error}</p>
    </div>
  );
}

export default function Contact() {
  const { settings } = useSettings();
  const toast = useToast();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ loading: false, done: false, error: '' });

  const set = (k) => (e) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };
  const aria = (k) => ({ id: k, 'aria-invalid': Boolean(errors[k]), 'aria-describedby': `${k}-error`, value: values[k], onChange: set(k) });

  const submit = async (e) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(Object.keys(found)[0])?.focus();
      return;
    }
    setStatus({ loading: true, done: false, error: '' });
    try {
      const res = await submitEnquiry(Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()])));
      setStatus({ loading: false, done: true, error: '' });
      setValues(EMPTY);
      toast.success(res.message || 'Enquiry submitted');
    } catch (err) {
      // Show server-side field errors next to their inputs
      if (err.details?.length) {
        setErrors(Object.fromEntries(err.details.map((d) => [d.field, d.message])));
      }
      setStatus({ loading: false, done: false, error: err.message });
      toast.error(err.message);
    }
  };

  const { email, phone, address } = settings.contact || {};

  return (
    <>
      <Seo title="Contact" description="Start a conversation with MORAQQA about your residential, commercial or hospitality interior design project." />
      <PageHead eyebrow="Enquire" title="Start a conversation" lead="Tell us about your space. We reply to every enquiry personally, usually within two working days." crumbs={[{ label: 'Home', to: '/' }, { label: 'Contact' }]} />

      <section className="container" style={{ paddingBottom: 'var(--section)' }}>
        <div className="contact">
          <aside className="contact__info">
            {address && <div><p className="eyebrow">Studio</p><address>{address}</address></div>}
            {email && <div><p className="eyebrow">Email</p><a href={`mailto:${email}`}>{email}</a></div>}
            {phone && <div><p className="eyebrow">Phone</p><a href={`tel:${phone.replace(/\s/g, '')}`}>{phone}</a></div>}
            <div><p className="eyebrow">Hours</p><p>Monday to Saturday<br />10:00 – 18:30</p></div>
          </aside>

          {status.done ? (
            <div className="contact__success" role="status">
              <CheckCircle2 size={36} style={{ color: 'var(--c-metal)', marginBottom: 20 }} aria-hidden="true" />
              <h2 className="h2" style={{ marginBottom: 16 }}>Thank you</h2>
              <p className="lead">Your enquiry has reached our studio. We will be in touch shortly.</p>
              <button type="button" className="btn btn--line" style={{ marginTop: 28 }} onClick={() => setStatus({ loading: false, done: false, error: '' })}>Send another enquiry</button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate aria-label="Enquiry form">
              <div className="form-grid">
                <Field id="name" label="Name *" error={errors.name}><input type="text" autoComplete="name" maxLength={100} {...aria('name')} /></Field>
                <Field id="email" label="Email *" error={errors.email}><input type="email" autoComplete="email" maxLength={160} {...aria('email')} /></Field>
                <Field id="phone" label="Phone *" error={errors.phone}><input type="tel" autoComplete="tel" maxLength={20} {...aria('phone')} /></Field>
                <Field id="city" label="City" error={errors.city}><input type="text" autoComplete="address-level2" maxLength={100} {...aria('city')} /></Field>
                <Field id="projectType" label="Project type *" error={errors.projectType}>
                  <select {...aria('projectType')}><option value="">Select…</option>{PROJECT_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
                </Field>
                <Field id="budget" label="Budget range *" error={errors.budget}>
                  <select {...aria('budget')}><option value="">Select…</option>{BUDGETS.map((b) => <option key={b}>{b}</option>)}</select>
                </Field>
                <Field id="area" label="Approximate area" error={errors.area} className="full"><input type="text" placeholder="e.g. 2,400 sq ft" maxLength={60} {...aria('area')} /></Field>
                <Field id="message" label="Message *" error={errors.message} className="full"><textarea rows={5} maxLength={3000} {...aria('message')} /></Field>
              </div>
              <button type="submit" className="btn btn--solid" style={{ marginTop: 36 }} disabled={status.loading}>
                {status.loading ? 'Sending…' : 'Submit enquiry'}
              </button>
              {status.error && <p className="form-status is-error" role="alert">{status.error}</p>}
            </form>
          )}
        </div>
      </section>
    </>
  );
}
