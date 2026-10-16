import { Link } from 'react-router-dom';
import CloudImage from './CloudImage.jsx';

const Group = ({ title, children }) => (
  <section className="sresults__group" aria-label={title}>
    <h3 className="eyebrow sresults__heading">{title}</h3>
    {children}
  </section>
);

/** Renders the grouped payload returned by GET /api/search. */
export default function SearchResults({ data, onNavigate, compact = false }) {
  const { projects = [], categories = [], services = [], collections = [], articles = [] } = data || {};
  const nothing = !projects.length && !categories.length && !services.length && !collections.length && !articles.length;
  if (nothing) return null;

  const thumb = (src, alt) => <CloudImage src={src} alt={alt} ratio="1 / 1" widths={[160, 240, 320]} sizes="96px" className="sresults__thumb" />;

  return (
    <div className={`sresults ${compact ? 'sresults--compact' : ''}`}>
      {projects.length > 0 && (
        <Group title="Projects">
          <ul className="sresults__list">
            {projects.map((p) => (
              <li key={p._id}>
                <Link to={`/projects/${p.slug}`} onClick={onNavigate} className="sresults__item">
                  {thumb(p.coverImage?.url, p.title)}
                  <span className="sresults__text">
                    <strong>{p.title}</strong>
                    <small>{[p.location, p.category?.name || p.projectType, p.year].filter(Boolean).join(' · ')}</small>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Group>
      )}

      {categories.length > 0 && (
        <Group title="Categories">
          <ul className="chips">
            {categories.map((c) => (
              <li key={c._id}>
                <Link to={`/projects/${c.slug}`} onClick={onNavigate} className="chip">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </Group>
      )}

      {services.length > 0 && (
        <Group title="Services">
          <ul className="sresults__list">
            {services.map((s) => (
              <li key={s._id}>
                <Link to={`/services/${s.slug}`} onClick={onNavigate} className="sresults__item">
                  {thumb(s.image?.url, s.title)}
                  <span className="sresults__text">
                    <strong>{s.title}</strong>
                    <small>{s.description}</small>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Group>
      )}

      {collections.length > 0 && (
        <Group title="Collections">
          <ul className="sresults__list">
            {collections.map((c) => (
              <li key={c._id}>
                <Link to={`/collections/${c.slug}`} onClick={onNavigate} className="sresults__item">
                  {thumb(c.coverImage?.url, c.title)}
                  <span className="sresults__text">
                    <strong>{c.title}</strong>
                    <small>{c.description}</small>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Group>
      )}

      {articles.length > 0 && (
        <Group title="Journal">
          <ul className="sresults__list">
            {articles.map((a) => (
              <li key={a._id}>
                <Link to={`/journal/${a.slug}`} onClick={onNavigate} className="sresults__item">
                  {thumb(a.coverImage?.url, a.title)}
                  <span className="sresults__text">
                    <strong>{a.title}</strong>
                    <small>{a.excerpt}</small>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Group>
      )}
    </div>
  );
}
