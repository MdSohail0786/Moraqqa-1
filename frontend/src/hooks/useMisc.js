import { useCallback, useEffect, useRef, useState } from 'react';
import { useLenis } from '../components/SmoothScroll.jsx';

export function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function useMediaQuery(query) {
  const get = () => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/** Calls `onVisible` whenever the returned ref's element scrolls into view. */
export function useSentinel(onVisible, { enabled = true, rootMargin = '600px 0px' } = {}) {
  const cbRef = useRef(onVisible);
  cbRef.current = onVisible;
  const [node, setNode] = useState(null);
  useEffect(() => {
    if (!enabled || !node) return undefined;
    const io = new IntersectionObserver(
      (entries) => entries.some((e) => e.isIntersecting) && cbRef.current(),
      { rootMargin }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [node, enabled, rootMargin]);
  return setNode;
}

/** Locks page scroll (works with and without Lenis). */
export function useScrollLock(locked) {
  const lenis = useLenis();
  useEffect(() => {
    if (!locked) return undefined;
    document.documentElement.classList.add('scroll-locked');
    lenis?.stop();
    return () => {
      document.documentElement.classList.remove('scroll-locked');
      lenis?.start();
    };
  }, [locked, lenis]);
}

/** Number of masonry columns for the current viewport. */
export function useColumns() {
  const calc = () => {
    if (typeof window === 'undefined') return 3;
    const w = window.innerWidth;
    if (w < 640) return 2;
    if (w < 1100) return 3;
    return 4;
  };
  const [cols, setCols] = useState(calc);
  useEffect(() => {
    let raf;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setCols(calc()));
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
    };
  }, []);
  return cols;
}

export function useOnEscape(handler, enabled = true) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!enabled) return undefined;
    const fn = (e) => e.key === 'Escape' && ref.current(e);
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [enabled]);
}

export function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  return [on, useCallback(() => setOn((v) => !v), []), setOn];
}
