import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { NAV_LINKS, SOCIAL_KEYS } from '../config/site.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { subscribeNewsletter } from '../services/endpoints.js';
import { EMAIL_RX } from '../utils/helpers.js';

function Newsletter() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ loading: false, done: false, error: '' });

  const submit = async (e) => {
    e.preventDefault();
    if (!EMAIL_RX.test(email.trim())) {
      setStatus({ loading: false, done: false, error: 'Please enter a valid email address.' });
      return;
    }
    setStatus({ loading: true, done: false, error: '' });
    try {
      const res = await subscribeNewsletter(email.trim());
      setStatus({ loading: false, done: true, error: '' });
      setEmail('');
      toast.success(res.message);
    } catch (err) {
      setStatus({ loading: false, done: false, error: err.message });
    }
  };

  return (
    <form className="newsletter" onSubmit={submit} noValidate>
      <label htmlFor="newsletter-email" className="eyebrow">
        Newsletter
      </label>
      <p className="newsletter__text">Occasional notes on new projects, materials and studio news.</p>
      <div className="newsletter__row">
        <input
          id="newsletter-email"
          type="email"
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          aria-invalid={Boolean(status.error)}
          aria-describedby="newsletter-msg"
          required
        />
        <button type="submit" className="newsletter__btn" disabled={status.loading} aria-label="Subscribe">
          {status.loading ? '…' : <ArrowRight size={20} />}
        </button>
      </div>
      <p id="newsletter-msg" className={`newsletter__msg ${status.error ? 'is-error' : ''}`} role="status">
        {status.error || (status.done ? 'Thank you, you are subscribed.' : '')}
      </p>
    </form>
  );
}

export default function Footer() {
  const { settings, types } = useSettings();
  const socials = SOCIAL_KEYS.filter((s) => settings.social?.[s.key]);
  const { email, phone, address } = settings.contact || {};

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <p className="footer__wordmark">{settings.siteName || 'MORAQQA'}</p>
            <p className="footer__tagline">{settings.tagline}</p>
          </div>
          <Newsletter />
        </div>

        <div className="footer__grid">
          <nav aria-label="Footer navigation">
            <p className="eyebrow">Navigation</p>
            <ul>
              {NAV_LINKS.map((l) => (
                <li key={l.to}>
                  <Link to={l.to}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="eyebrow">Projects</p>
            <ul>
              <li>
                <Link to="/projects">All projects</Link>
              </li>
              {types.map((c) => (
                <li key={c._id}>
                  <Link to={`/projects/${c.slug}`}>{c.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="eyebrow">Services</p>
            <ul>
              <li>
                <Link to="/services">All services</Link>
              </li>
              <li>
                <Link to="/collections">Collections</Link>
              </li>
              <li>
                <Link to="/contact">Contact</Link>
              </li>
            </ul>
          </div>

          <address className="footer__contact">
            <p className="eyebrow">Studio</p>
            <ul>
              {address && <li>{address}</li>}
              {email && (
                <li>
                  <a href={`mailto:${email}`}>{email}</a>
                </li>
              )}
              {phone && (
                <li>
                  <a href={`tel:${phone.replace(/\s/g, '')}`}>{phone}</a>
                </li>
              )}
            </ul>
            {socials.length > 0 && (
              <ul className="footer__social">
                {socials.map((s) => (
                  <li key={s.key}>
                    <a href={settings.social[s.key]} target="_blank" rel="noopener noreferrer">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </address>
        </div>

        <div className="footer__bottom">
          <p>
            © {new Date().getFullYear()} {settings.siteName || 'MORAQQA'}. All rights reserved.
          </p>
          <ul>
            <li>
              <Link to="/privacy">Privacy Policy</Link>
            </li>
            <li>
              <Link to="/terms">Terms</Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
