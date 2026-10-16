import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Search, X } from 'lucide-react';
import SearchResults from './SearchResults.jsx';
import { ErrorState } from './States.jsx';
import useSiteSearch from '../hooks/useSiteSearch.js';
import { useOnEscape, useScrollLock } from '../hooks/useMisc.js';

export default function SearchOverlay({ onClose }) {
  const [q, setQ] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { data, error, searching, hasResults, tooShort, query } = useSiteSearch(q);

  useScrollLock(true);
  useOnEscape(onClose);
  useEffect(() => inputRef.current?.focus(), []);

  const submit = (e) => {
    e.preventDefault();
    if (q.trim().length < 2) return;
    onClose();
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <motion.div
      className="search-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="search-overlay__inner container" data-lenis-prevent>
        <div className="search-overlay__top">
          <p className="eyebrow">Search</p>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close search">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={submit} role="search" className="search-overlay__form">
          <Search size={26} aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Try “modern bedroom”"
            aria-label="Search projects, categories, services and collections"
            autoComplete="off"
            maxLength={80}
          />
          <button type="submit" className="icon-btn" aria-label="See all results" disabled={q.trim().length < 2}>
            <ArrowRight size={24} />
          </button>
        </form>

        <div className="search-overlay__body" aria-live="polite">
          {tooShort && <p className="muted">Type at least two characters to search projects, categories, services and collections.</p>}
          {!tooShort && searching && !data && <p className="muted">Searching…</p>}
          {error && <ErrorState compact error={error} title="Search is unavailable" />}
          {!tooShort && !searching && !error && !hasResults && <p className="muted">No results for “{query}”. Try a room, a style or a city.</p>}
          {hasResults && <SearchResults data={data} onNavigate={onClose} compact />}
        </div>
      </div>
    </motion.div>
  );
}
