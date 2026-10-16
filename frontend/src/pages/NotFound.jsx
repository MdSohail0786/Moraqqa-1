import { Link } from 'react-router-dom';
import Seo from '../components/Seo.jsx';

export default function NotFound() {
  return (
    <section className="nf">
      <Seo title="Page not found" noindex />
      <p className="nf__code" aria-hidden="true">404</p>
      <p className="eyebrow">Page not found</p>
      <h1 className="h2" style={{ marginBottom: 20 }}>This space does not exist</h1>
      <p className="lead" style={{ marginBottom: 36 }}>The page you are looking for may have moved or never existed.</p>
      <div className="state__actions">
        <Link to="/" className="btn btn--solid">Back home</Link>
        <Link to="/projects" className="btn btn--line">View projects</Link>
      </div>
    </section>
  );
}
