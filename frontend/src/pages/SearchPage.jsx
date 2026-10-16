import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import PageHead from '../components/PageHead.jsx';
import Seo from '../components/Seo.jsx';
import SearchResults from '../components/SearchResults.jsx';
import { EmptyState, ErrorState } from '../components/States.jsx';
import { TextSkeleton } from '../components/Skeletons.jsx';
import useSiteSearch from '../hooks/useSiteSearch.js';

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const { data, error, searching, hasResults, tooShort, query } = useSiteSearch(q);

  // Keep the URL in sync so results can be shared
  useEffect(() => {
    if (query.length >= 2) setParams({ q: query }, { replace: true });
  }, [query, setParams]);

  return (
    <>
      <Seo title={query ? `Search: ${query}` : 'Search'} noindex />
      <PageHead eyebrow="Search" title="Find a space" crumbs={[{ label: 'Home', to: '/' }, { label: 'Search' }]} />
      <section className="container" style={{ paddingBottom: 'var(--section)' }}>
        <form className="search-overlay__form" role="search" onSubmit={(e) => e.preventDefault()}>
          <Search size={26} aria-hidden="true" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try “modern bedroom”" aria-label="Search the site" autoFocus maxLength={80} />
        </form>
        <div style={{ marginTop: 48 }} aria-live="polite">
          {tooShort && <p className="muted">Type at least two characters to search projects, categories, services and collections.</p>}
          {!tooShort && searching && !data && <TextSkeleton lines={4} />}
          {error && <ErrorState error={error} title="Search is unavailable" />}
          {!tooShort && !searching && !error && !hasResults && <EmptyState title={`No results for “${query}”`} text="Try a room, a style or a city, for example “minimal kitchen” or “Mumbai”." />}
          {hasResults && <SearchResults data={data} />}
        </div>
      </section>
    </>
  );
}
