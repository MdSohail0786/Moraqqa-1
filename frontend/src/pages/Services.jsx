import { Link } from 'react-router-dom';
import PageHead from '../components/PageHead.jsx';
import Seo from '../components/Seo.jsx';
import CloudImage from '../components/CloudImage.jsx';
import CtaBand from '../components/CtaBand.jsx';
import { EmptyState, ErrorState } from '../components/States.jsx';
import { TextSkeleton } from '../components/Skeletons.jsx';
import { Reveal } from '../components/Reveal.jsx';
import useFetch from '../hooks/useFetch.js';
import { fetchServices } from '../services/endpoints.js';
import { pad } from '../utils/helpers.js';

export default function Services() {
  const { data, loading, error, reload } = useFetch(() => fetchServices(), []);
  const list = data?.data || [];

  return (
    <>
      <Seo title="Services" description="Interior architecture, residential and commercial interiors, hospitality design, space planning, furniture and lighting design, and turnkey delivery." />
      <PageHead eyebrow="What we do" title="Services" lead="From the first sketch to the final styling, a complete interior design practice under one roof." crumbs={[{ label: 'Home', to: '/' }, { label: 'Services' }]} />
      <section className="container" style={{ paddingBottom: 'var(--section)' }}>
        {loading && <TextSkeleton lines={8} />}
        {error && <ErrorState error={error} onRetry={reload} title="Services could not be loaded" />}
        {!loading && !error && list.length === 0 && <EmptyState title="Services coming soon" />}
        <div className="svc-list">
          {list.map((s, i) => (
            <Reveal key={s._id} y={20}>
              <Link to={`/services/${s.slug}`} className="svc" data-cursor="view">
                <span className="svc__num">{pad(i + 1)}</span>
                <h2 className="svc__title">{s.title}</h2>
                <p className="svc__desc">{s.description}</p>
                <div className="svc__thumb"><CloudImage src={s.image?.url} alt={s.image?.alt || s.title} ratio="4 / 3" widths={[240, 400, 640]} sizes="160px" /></div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
      <CtaBand />
    </>
  );
}
