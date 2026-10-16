import { Link } from 'react-router-dom';
import PageHead from '../components/PageHead.jsx';
import Seo from '../components/Seo.jsx';
import CloudImage from '../components/CloudImage.jsx';
import CtaBand from '../components/CtaBand.jsx';
import { EmptyState, ErrorState } from '../components/States.jsx';
import { ProjectGridSkeleton } from '../components/Skeletons.jsx';
import { ImageReveal } from '../components/Reveal.jsx';
import useInfiniteList from '../hooks/useInfiniteList.js';
import { useSentinel } from '../hooks/useMisc.js';
import { fetchArticles } from '../services/endpoints.js';
import { formatDate } from '../utils/helpers.js';

export default function Journal() {
  const { items, loading, loadingMore, error, hasMore, loadMore, retry } = useInfiniteList((page) => fetchArticles({ page, limit: 9 }), []);
  const sentinel = useSentinel(loadMore, { enabled: hasMore && !error && !loading });

  return (
    <>
      <Seo title="Journal" description="Notes on design, materials, lighting and craft from the MORAQQA studio." />
      <PageHead eyebrow="Journal" title="Notes from the studio" lead="Thoughts on materials, light, craft and the making of interiors." crumbs={[{ label: 'Home', to: '/' }, { label: 'Journal' }]} />
      <section className="container" style={{ paddingBottom: 'var(--section)' }}>
        {loading && <ProjectGridSkeleton count={3} />}
        {error && !items.length && <ErrorState error={error} onRetry={retry} title="The journal could not be loaded" />}
        {!loading && !error && !items.length && <EmptyState title="No articles yet" text="Published articles will appear here." />}
        <div className="j-grid">
          {items.map((a) => (
            <Link key={a._id} to={`/journal/${a.slug}`} className="jcard" data-cursor="view">
              <ImageReveal className="jcard__media"><CloudImage src={a.coverImage?.url} alt={a.coverImage?.alt || a.title} ratio="4 / 3" sizes="(max-width: 900px) 50vw, 33vw" /></ImageReveal>
              <p className="jcard__meta">{[a.category, formatDate(a.publishedAt || a.createdAt, { year: 'numeric', month: 'short', day: 'numeric' })].filter(Boolean).join(' · ')}</p>
              <h2 className="jcard__title">{a.title}</h2>
              {a.excerpt && <p className="jcard__ex">{a.excerpt}</p>}
            </Link>
          ))}
        </div>
        <div ref={sentinel} aria-hidden="true" style={{ height: 1 }} />
        {hasMore && !error && (
          <div className="loadmore"><button type="button" className="btn btn--line" onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Loading…' : 'Load more articles'}</button></div>
        )}
      </section>
      <CtaBand />
    </>
  );
}
