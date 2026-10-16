import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';

/**
 * Server-side paginated list with "load more".
 * `fetchPage(page, signal)` must resolve to { data, total, hasMore } (the API's pagination shape).
 * The list resets whenever `deps` change.
 */
export default function useInfiniteList(fetchPage, deps = []) {
  const [state, setState] = useState({
    items: [],
    total: 0,
    page: 0,
    hasMore: true,
    loading: true,
    loadingMore: false,
    error: null,
  });
  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;
  const stateRef = useRef(state);
  stateRef.current = state;
  const requestId = useRef(0);
  const busy = useRef(false);
  const controllerRef = useRef(null);

  const load = useCallback(async (page, reset) => {
    const id = ++requestId.current;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    busy.current = true;
    setState((s) => ({
      ...s,
      ...(reset ? { items: [], total: 0, page: 0, hasMore: true, loading: true } : { loadingMore: true }),
      error: null,
    }));
    try {
      const res = await fetchRef.current(page, controller.signal);
      if (id !== requestId.current) return;
      setState((s) => ({
        items: reset ? res.data : [...s.items, ...res.data.filter((d) => !s.items.some((i) => i._id === d._id))],
        total: res.total,
        page,
        hasMore: res.hasMore,
        loading: false,
        loadingMore: false,
        error: null,
      }));
    } catch (error) {
      if (axios.isCancel(error) || id !== requestId.current) return;
      setState((s) => ({ ...s, loading: false, loadingMore: false, error }));
    } finally {
      if (id === requestId.current) busy.current = false;
    }
  }, []);

  useEffect(() => {
    load(1, true);
    return () => controllerRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const loadMore = useCallback(() => {
    const s = stateRef.current;
    if (busy.current || s.error || !s.hasMore || s.loading || s.loadingMore) return;
    load(s.page + 1, false);
  }, [load]);

  const retry = useCallback(() => {
    const s = stateRef.current;
    if (s.items.length === 0) load(1, true);
    else load(s.page + 1, false);
  }, [load]);

  return { ...state, loadMore, retry, reload: () => load(1, true) };
}
