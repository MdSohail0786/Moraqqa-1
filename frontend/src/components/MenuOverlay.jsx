import { useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { NAV_LINKS, SOCIAL_KEYS } from '../config/site.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { useOnEscape, useScrollLock } from '../hooks/useMisc.js';
import { pad } from '../utils/helpers.js';

const EASE = [0.22, 1, 0.36, 1];

/** Full-screen navigation overlay: the mobile menu and the desktop "Menu" button. */
export default function MenuOverlay({ onClose }) {
  const { settings, types } = useSettings();
  const ref = useRef(null);

  useScrollLock(true);
  useOnEscape(onClose);

  useEffect(() => {
    ref.current?.querySelector('a')?.focus();
  }, []);

  const socials = SOCIAL_KEYS.filter((s) => settings.social?.[s.key]);

  return (
    <motion.div
      ref={ref}
      className="menu"
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      initial={{ clipPath: 'inset(0 0 100% 0)' }}
      animate={{ clipPath: 'inset(0 0 0% 0)' }}
      exit={{ clipPath: 'inset(0 0 100% 0)' }}
      transition={{ duration: 0.8, ease: EASE }}
    >
      <div className="menu__inner container" data-lenis-prevent>
        <nav className="menu__links" aria-label="Primary">
          <ul>
            {NAV_LINKS.map((link, i) => (
              <li key={link.to}>
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.06, duration: 0.8, ease: EASE }}
                >
                  <NavLink to={link.to} end={link.to === '/'} onClick={onClose} className="menu__link">
                    <span className="menu__num">{pad(i + 1)}</span>
                    {link.label}
                  </NavLink>
                </motion.div>
              </li>
            ))}
          </ul>
        </nav>

        <motion.aside
          className="menu__aside"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
        >
          {types.length > 0 && (
            <div>
              <p className="eyebrow">Projects</p>
              <ul className="menu__sub">
                {types.map((c) => (
                  <li key={c._id}>
                    <Link to={`/projects/${c.slug}`} onClick={onClose}>
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <p className="eyebrow">Studio</p>
            <ul className="menu__sub">
              {settings.contact?.email && (
                <li>
                  <a href={`mailto:${settings.contact.email}`}>{settings.contact.email}</a>
                </li>
              )}
              {settings.contact?.phone && (
                <li>
                  <a href={`tel:${settings.contact.phone.replace(/\s/g, '')}`}>{settings.contact.phone}</a>
                </li>
              )}
              {settings.contact?.address && <li>{settings.contact.address}</li>}
            </ul>
            {socials.length > 0 && (
              <ul className="menu__social">
                {socials.map((s) => (
                  <li key={s.key}>
                    <a href={settings.social[s.key]} target="_blank" rel="noopener noreferrer">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </motion.aside>
      </div>
    </motion.div>
  );
}
