import { useEffect, useState } from 'react';
import axios from 'axios';
import { searchSite } from '../services/endpoints.js';
import { useDebounce } from './useMisc.js';

/** Debounced global search against GET /api/search. */
export default function useSiteSearch(query, { delay = 350 } = {}) {
  const debounced = useDebounce(query.trim(), delay);
  const [state, setState] = useState({ data: null, loading: false, error: null });
  const waiting = query.trim() !== debounced;

  useEffect(() => {
    if (debounced.length < 2) {
      setState({ data: null, loading: false, error: null });
      return undefined;
    }
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    searchSite(debounced, controller.signal)
      .then((res) => setState({ data: res.data, loading: false, error: null }))
      .catch((error) => {
        if (axios.isCancel(error)) return;
        setState({ data: null, loading: false, error });
      });
    return () => controller.abort();
  }, [debounced]);

  const hasResults = Boolean(
    state.data && Object.values(state.data).some((list) => Array.isArray(list) && list.length)
  );
  return { ...state, query: debounced, searching: state.loading || waiting, hasResults, tooShort: debounced.length < 2 };
}
