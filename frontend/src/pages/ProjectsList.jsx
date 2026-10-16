import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHead from '../components/PageHead.jsx';
import Seo from '../components/Seo.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import ProjectFilters from '../components/ProjectFilters.jsx';
import CtaBand from '../components/CtaBand.jsx';
import { EmptyState, ErrorState } from '../components/States.jsx';
import { ProjectGridSkeleton } from '../components/Skeletons.jsx';
import useInfiniteList from '../hooks/useInfiniteList.js';
import { useSentinel } from '../hooks/useMisc.js';
import { fetchProjects } from '../services/endpoints.js';

const FILTER_KEYS = ['category', 'style', 'location', 'year', 'roomType', 'projectType'];

/** Reads multi-valued filters from the URL (?style=modern,minimal&location=Mumbai) so results are shareable. */
function readFilters(params) {
  const out = {};
  FILTER_KEYS.forEach((k) => {
    const v = params.get(k);
    if (v) out[k] = v.split(',').filter(Boolean);
  });
  return out;
}

const PAGE_SIZE = 12;

export default function ProjectsList({ category }) {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => readFilters(params), [params]);

  // The category in the path is always applied on top of the filter panel
  const query = useMemo(() => {
    const q = {};
    FILTER_KEYS.forEach((k) => {
      if (filters[k]?.length) q[k] = filters[k].join(',');
    });
    if (category) q.category = [category.slug, ...(filters.category || [])].filter((v, i, a) => a.indexOf(v) === i).join(',');
    return q;
  }, [filters, category]);
  const queryKey = JSON.stringify(query);

  const { items, total, loading, loadingMore, error, hasMore, loadMore, retry } = useInfiniteList(
    (page, signal) => fetchProjects({ ...query, page, limit: PAGE_SIZE }, signal),
    [queryKey]
  );
  const sentinel = useSentinel(loadMore, { enabled: hasMore && !error && !loading });

  const onChange = useCallback(
    (next) => {
      const sp = new URLSearchParams();
      Object.entries(next).forEach(([k, v]) => v?.length && sp.set(k, v.join(',')));
      setParams(sp, { replace: true });
    },
    [setParams]
  );

  const title = category ? category.name : 'Projects';
  const crumbs = [{ label: 'Home', to: '/' }, ...(category ? [{ label: 'Projects', to: '/projects' }, { label: category.name }] : [{ label: 'Projects' }])];
  const hasFilters = Object.keys(filters).length > 0;

  return (
    <>
      <Seo
        title={category ? `${category.name} Interior Design Projects` : 'Interior Design Projects'}
        description={category?.description || 'Explore residential, commercial and hospitality interior design projects by MORAQQA.'}
        image={category?.coverImage?.url}
      />
      <PageHead
        eyebrow="Portfolio"
        title={title}
        lead={category?.description || 'A selection of interiors across homes, workplaces and hospitality, each designed around the people who use them.'}
        crumbs={crumbs}
      />

      <section className="container" style={{ paddingBottom: 'var(--section)' }}>
        <ProjectFilters value={filters} onChange={onChange} total={total} loading={loading} />

        {loading && <ProjectGridSkeleton count={6} />}
        {error && !items.length && <ErrorState error={error} onRetry={retry} title="Projects could not be loaded" />}
        {!loading && !error && items.length === 0 && (
          <EmptyState
            title={hasFilters ? 'No projects match these filters' : 'No projects yet'}
            text={hasFilters ? 'Try removing a filter to see more of our work.' : 'Published projects will appear here.'}
            action={hasFilters && <button type="button" className="btn btn--line" onClick={() => onChange({})}>Clear filters</button>}
          />
        )}

        {items.length > 0 && (
          <>
            <div className="project-grid">
              {items.map((p, i) => (
                <ProjectCard key={p._id} project={p} ratio={i % 3 === 0 ? '4 / 5' : i % 3 === 1 ? '1 / 1' : '3 / 4'} priority={i < 2} reveal />
              ))}
            </div>
            <div ref={sentinel} aria-hidden="true" style={{ height: 1 }} />
            <div className="loadmore">
              <p>Showing {items.length} of {total}</p>
              {error && <ErrorState compact error={error} onRetry={retry} title="More projects could not be loaded" />}
              {hasMore && !error && (
                <button type="button" className="btn btn--line" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? 'Loading…' : 'Load more projects'}
                </button>
              )}
            </div>
          </>
        )}
      </section>
      <CtaBand />
    </>
  );
}
