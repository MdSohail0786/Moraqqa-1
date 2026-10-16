import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { changePassword, updateSettings } from '../../services/endpoints.js';
import { SOCIAL_KEYS } from '../../config/site.js';
import AssetInput from '../components/AssetInput.jsx';
import { Field, PageHead } from '../components/ui.jsx';

export default function SettingsPage() {
  const { settings, reload } = useSettings();
  const toast = useToast();
  const [v, setV] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwErr, setPwErr] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    setV({
      siteName: settings.siteName || '', tagline: settings.tagline || '', logo: settings.logo, heroImage: settings.heroImage,
      heroVideoUrl: settings.heroVideoUrl || '', introImage: settings.introImage,
      social: { instagram: '', pinterest: '', facebook: '', linkedin: '', ...settings.social },
      contact: { email: '', phone: '', address: '', ...settings.contact }, team: settings.team || [],
    });
  }, [settings]);

  if (!v) return null;
  const setField = (k, val) => setV((c) => ({ ...c, [k]: val }));
  const nested = (group, k) => (e) => setV((c) => ({ ...c, [group]: { ...c[group], [k]: e.target.value } }));

  const save = async (e) => {
    e.preventDefault();
    if (v.siteName.trim().length < 2) return toast.error('Site name is required.');
    for (const [k, url] of Object.entries(v.social)) {
      if (url && !/^https?:\/\//i.test(url)) return toast.error(`${k} link must start with http:// or https://`);
    }
    setSaving(true);
    try {
      await updateSettings({ ...v, logo: v.logo || null, heroImage: v.heroImage || null, introImage: v.introImage || null, team: v.team.filter((m) => m.name?.trim()) });
      await reload();
      toast.success('Settings saved');
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const submitPw = async (e) => {
    e.preventDefault();
    setPwErr('');
    if (pw.newPassword.length < 10) return setPwErr('New password must be at least 10 characters.');
    if (pw.newPassword !== pw.confirm) return setPwErr('New passwords do not match.');
    setPwBusy(true);
    try {
      await changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      toast.success('Password updated');
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) { setPwErr(err.message); } finally { setPwBusy(false); }
  };

  return (
    <>
      <PageHead title="Settings" subtitle="Logo, homepage imagery, contact details and social links." />
      <form onSubmit={save} noValidate>
        <div className="acard">
          <h2>Brand</h2>
          <div className="agrid agrid--2">
            <Field label="Site name" htmlFor="st-name"><input id="st-name" type="text" value={v.siteName} onChange={(e) => setField('siteName', e.target.value)} /></Field>
            <Field label="Tagline" htmlFor="st-tag"><input id="st-tag" type="text" value={v.tagline} onChange={(e) => setField('tagline', e.target.value)} /></Field>
            <AssetInput label="Logo" folder="brand" value={v.logo} onChange={(val) => setField('logo', val)} hint="Optional. Without one, the MORAQQA wordmark is shown. Use a dark logo on transparent background." />
            <AssetInput label="Homepage hero image" folder="home" value={v.heroImage} onChange={(val) => setField('heroImage', val)} />
            <AssetInput label="Homepage intro image" folder="home" value={v.introImage} onChange={(val) => setField('introImage', val)} />
            <Field label="Hero video URL (optional)" htmlFor="st-vid" hint="Direct .mp4 / Cloudinary video URL. Replaces the hero image on the homepage."><input id="st-vid" type="url" value={v.heroVideoUrl} onChange={(e) => setField('heroVideoUrl', e.target.value)} placeholder="https://…" /></Field>
          </div>
        </div>

        <div className="acard">
          <h2>Contact &amp; social</h2>
          <div className="agrid agrid--2">
            <Field label="Email" htmlFor="st-email"><input id="st-email" type="email" value={v.contact.email} onChange={nested('contact', 'email')} /></Field>
            <Field label="Phone" htmlFor="st-phone"><input id="st-phone" type="text" value={v.contact.phone} onChange={nested('contact', 'phone')} /></Field>
            <Field label="Address" htmlFor="st-addr" className="full"><input id="st-addr" type="text" value={v.contact.address} onChange={nested('contact', 'address')} /></Field>
            {SOCIAL_KEYS.map(({ key, label }) => (
              <Field key={key} label={label} htmlFor={`st-${key}`}><input id={`st-${key}`} type="url" value={v.social[key]} onChange={nested('social', key)} placeholder="https://…" /></Field>
            ))}
          </div>
          <p className="afield__hint" style={{ marginTop: 12 }}>The WhatsApp number is set with the WHATSAPP_NUMBER environment variable on the server.</p>
        </div>

        <div className="acard">
          <h2>Team (About page)</h2>
          <div className="agrid">
            {v.team.map((m, i) => (
              <div key={i} className="acard" style={{ background: '#fcfbf8' }}>
                <div className="agrid agrid--2">
                  <Field label="Name"><input className="ainput" type="text" value={m.name || ''} onChange={(e) => setField('team', v.team.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} aria-label={`Team member ${i + 1} name`} /></Field>
                  <Field label="Role"><input className="ainput" type="text" value={m.role || ''} onChange={(e) => setField('team', v.team.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))} aria-label={`Team member ${i + 1} role`} /></Field>
                  <Field label="Bio" className="full"><input className="ainput" type="text" value={m.bio || ''} onChange={(e) => setField('team', v.team.map((x, j) => (j === i ? { ...x, bio: e.target.value } : x)))} aria-label={`Team member ${i + 1} bio`} /></Field>
                  <AssetInput label="Photo" folder="team" value={m.image} onChange={(val) => setField('team', v.team.map((x, j) => (j === i ? { ...x, image: val } : x)))} />
                </div>
                <button type="button" className="abtn abtn--sm abtn--danger" style={{ marginTop: 12 }} onClick={() => setField('team', v.team.filter((_, j) => j !== i))}><Trash2 size={14} /> Remove member</button>
              </div>
            ))}
            <div><button type="button" className="abtn abtn--sm" onClick={() => setField('team', [...v.team, { name: '', role: '', bio: '' }])}><Plus size={14} /> Add team member</button></div>
          </div>
        </div>

        <div style={{ margin: '20px 0' }}><button type="submit" className="abtn abtn--primary" disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button></div>
      </form>

      <form className="acard" onSubmit={submitPw} noValidate>
        <h2>Change password</h2>
        <div className="agrid agrid--3">
          <Field label="Current password" htmlFor="pw-cur"><input id="pw-cur" type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></Field>
          <Field label="New password" htmlFor="pw-new" hint="At least 10 characters"><input id="pw-new" type="password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></Field>
          <Field label="Confirm new password" htmlFor="pw-conf"><input id="pw-conf" type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field>
        </div>
        {pwErr && <div className="alert" role="alert" style={{ marginTop: 14 }}>{pwErr}</div>}
        <button type="submit" className="abtn" style={{ marginTop: 16 }} disabled={pwBusy || !pw.currentPassword}>{pwBusy ? 'Updating…' : 'Update password'}</button>
      </form>
    </>
  );
}
