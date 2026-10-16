import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { EMAIL_RX } from '../../utils/helpers.js';
import { Field } from '../components/ui.jsx';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!EMAIL_RX.test(email.trim())) found.email = 'Enter a valid email address';
    if (!password) found.password = 'Enter your password';
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    setFormError('');
    try {
      await login(email.trim(), password);
      toast.success('Welcome back');
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setFormError(err.message);
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="alogin">
      <div className="alogin__box">
        <div className="alogin__brand">MORAQQA</div>
        <p className="eyebrow" style={{ margin: 0 }}>Admin sign in</p>
        <form onSubmit={submit} noValidate>
          <Field label="Email" htmlFor="email" error={errors.email}>
            <input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          </Field>
          <Field label="Password" htmlFor="password" error={errors.password}>
            <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          {formError && <div className="alert" role="alert">{formError}</div>}
          <button type="submit" className="abtn abtn--primary" disabled={busy} style={{ justifyContent: 'center', padding: 14 }}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p style={{ marginTop: 24, fontSize: 13 }}><Link to="/">← Back to website</Link></p>
      </div>
    </div>
  );
}
