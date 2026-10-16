import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';

/**
 * Runs `fetcher(signal)` whenever `deps` change. Handles cancellation and stale responses.
 * Returns { data, loading, error, reload }.
 */
export default function useFetch(fetcher, deps = [], { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, loading: enabled, error: null });
  const [nonce, setNonce] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!enabled) return undefined;
    const controller = new AbortController();
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.resolve(fetcherRef.current(controller.signal))
      .then((data) => alive && setState({ data, loading: false, error: null }))
      .catch((error) => {
        if (!alive || axios.isCancel(error)) return;
        setState({ data: null, loading: false, error });
      });
    return () => {
      alive = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce, enabled]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, reload };
}
