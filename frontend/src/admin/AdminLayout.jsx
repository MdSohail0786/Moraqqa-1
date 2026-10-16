import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, FolderTree, Images, LayoutDashboard, LogOut, Mail, Menu, Layers, Settings, Sparkles, Building2, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { adminStats } from '../services/endpoints.js';

const LINKS = [
  { to: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: 'projects', label: 'Projects', icon: Building2 },
  { to: 'images', label: 'Images', icon: Images },
  { to: 'categories', label: 'Categories', icon: FolderTree },
  { to: 'collections', label: 'Collections', icon: Layers },
  { to: 'services', label: 'Services', icon: Sparkles },
  { to: 'enquiries', label: 'Enquiries', icon: Mail, badge: true },
  { to: 'journal', label: 'Journal', icon: BookOpen },
  { to: 'settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => setOpen(false), [pathname]);

  // Unread enquiry count for the sidebar badge
  useEffect(() => {
    let alive = true;
    adminStats().then((r) => alive && setUnread(r.data.unread)).catch(() => {});
    return () => { alive = false; };
  }, [pathname]);

  const signOut = async () => {
    await logout();
    toast.info('You have been signed out.');
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="admin">
      <div className="admin__topbar">
        <strong style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.3em' }}>MORAQQA</strong>
        <button type="button" onClick={() => setOpen(true)} aria-label="Open admin menu"><Menu size={22} /></button>
      </div>
      {open && <div className="admin__scrim" onClick={() => setOpen(false)} />}
      <aside className={`admin__side ${open ? 'is-open' : ''}`} aria-label="Admin">
        <div className="admin__brand">MORAQQA</div>
        <p className="admin__sub">Studio admin</p>
        <nav className="admin__nav">
          {LINKS.map(({ to, label, icon: Icon, badge }) => (
            <NavLink key={to} to={to} className="admin__link">
              <Icon size={17} aria-hidden="true" />
              {label}
              {badge && unread > 0 && <span className="admin__badge" aria-label={`${unread} unread`}>{unread}</span>}
            </NavLink>
          ))}
          <a className="admin__link" href="/" target="_blank" rel="noopener noreferrer"><ExternalLink size={17} aria-hidden="true" /> View website</a>
        </nav>
        <div className="admin__user">
          <strong>{user?.name}</strong>
          {user?.email}
          <br />
          <button type="button" onClick={signOut}><LogOut size={14} /> Sign out</button>
        </div>
      </aside>
      <main className="admin__main"><Outlet /></main>
    </div>
  );
}
