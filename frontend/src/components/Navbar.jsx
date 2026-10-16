import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import MenuOverlay from './MenuOverlay.jsx';
import SearchOverlay from './SearchOverlay.jsx';
import { NAV_LINKS } from '../config/site.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { useLayout } from '../context/LayoutContext.jsx';
import { cld } from '../utils/cloudinary.js';
import { cx } from '../utils/helpers.js';

export default function Navbar() {
  const { settings } = useSettings();
  const { heroNav } = useLayout();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      // Tuck the bar away while reading down the page, bring it back on scroll up
      const dy = y - lastY.current;
      if (Math.abs(dy) > 4) {
        setHidden(y > 500 && dy > 0);
        lastY.current = y;
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close overlays whenever the route changes
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const overlay = heroNav && !scrolled && !menuOpen;
  const logo = settings.logo?.url;

  return (
    <>
      <header className={cx('nav', overlay ? 'nav--overlay' : 'nav--solid', hidden && !menuOpen && 'nav--hidden', menuOpen && 'nav--menu-open')}>
        <div className="nav__inner">
          <Link to="/" className="nav__brand" aria-label={`${settings.siteName} — home`}>
            {logo ? (
              <img className="nav__logo" src={cld(logo, { w: 320 })} alt={settings.siteName} height="34" />
            ) : (
              <span className="nav__wordmark">{settings.siteName || 'MORAQQA'}</span>
            )}
          </Link>

          <nav className="nav__links" aria-label="Primary">
            {NAV_LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) => cx('nav__link', isActive && 'is-active')}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="nav__actions">
            <button type="button" className="nav__icon" onClick={() => setSearchOpen(true)} aria-label="Search" aria-haspopup="dialog">
              <Search size={19} />
            </button>
            <button
              type="button"
              className={cx('nav__menu-btn', menuOpen && 'is-open')}
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              <span className="nav__menu-label">{menuOpen ? 'Close' : 'Menu'}</span>
              <span className="burger" aria-hidden="true">
                <span />
                <span />
              </span>
            </button>
            <Link to="/contact" className="nav__cta">
              Enquire
            </Link>
          </div>
        </div>
      </header>

      <AnimatePresence>{menuOpen && <MenuOverlay onClose={() => setMenuOpen(false)} />}</AnimatePresence>
      <AnimatePresence>{searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}</AnimatePresence>
    </>
  );
}
