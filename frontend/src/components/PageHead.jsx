import { Link } from 'react-router-dom';
import { TextReveal } from './Reveal.jsx';

/** Standard editorial page header with breadcrumbs, big title and lead text. */
export default function PageHead({ eyebrow, title, lead, crumbs = [] }) {
  return (
    <header className="page-head container">
      {crumbs.length > 0 && (
        <nav className="crumbs" aria-label="Breadcrumb">
          {crumbs.map((c, i) => (
            <span key={c.label} style={{ display: 'contents' }}>
              {c.to ? <Link to={c.to}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
              {i < crumbs.length - 1 && <span aria-hidden="true">/</span>}
            </span>
          ))}
        </nav>
      )}
      <div className="page-head__row">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <TextReveal as="h1" text={title} className="h1" immediate />
        </div>
        {lead && <p className="lead">{lead}</p>}
      </div>
    </header>
  );
}
