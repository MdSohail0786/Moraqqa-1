import { Link } from 'react-router-dom';
import PageHead from '../components/PageHead.jsx';
import Seo from '../components/Seo.jsx';
import CloudImage from '../components/CloudImage.jsx';
import CtaBand from '../components/CtaBand.jsx';
import { EmptyState, ErrorState } from '../components/States.jsx';
import { ProjectGridSkeleton } from '../components/Skeletons.jsx';
import { ImageReveal } from '../components/Reveal.jsx';
import useFetch from '../hooks/useFetch.js';
import { fetchCollections } from '../services/endpoints.js';

export default function Collections() {
  const { data, loading, error, reload } = useFetch(() => fetchCollections(), []);
  const list = data?.data || [];
  return (
    <>
      <Seo title="Collections" description="A visual library of living spaces, bedrooms, kitchens, bathrooms, dining rooms, offices, lighting, furniture and materials." />
      <PageHead eyebrow="Visual library" title="Collections" lead="Browse our work by room, object and material." crumbs={[{ label: 'Home', to: '/' }, { label: 'Collections' }]} />
      <section className="container" style={{ paddingBottom: 'var(--section)' }}>
        {loading && <ProjectGridSkeleton count={6} />}
        {error && <ErrorState error={error} onRetry={reload} title="Collections could not be loaded" />}
        {!loading && !error && !list.length && <EmptyState title="No collections yet" text="Collections created in the admin panel will appear here." />}
        <div className="col-grid">
          {list.map((c) => (
            <Link key={c._id} to={`/collections/${c.slug}`} className="ccard" data-cursor="view">
              <ImageReveal className="ccard__media"><CloudImage src={c.coverImage?.url} alt={c.coverImage?.alt || c.title} ratio="3 / 4" sizes="(max-width: 900px) 50vw, 33vw" /></ImageReveal>
              <div className="ccard__meta"><h2 className="ccard__title">{c.title}</h2><span className="ccard__count">{c.imageCount} images</span></div>
            </Link>
          ))}
        </div>
      </section>
      <CtaBand />
    </>
  );
}
