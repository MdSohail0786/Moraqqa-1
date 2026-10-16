import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { ErrorBoundary } from './States.jsx';
import { canRunHeavy3D } from '../utils/helpers.js';

const Hero3D = lazy(() => import('./Hero3D.jsx'));

/**
 * Mounts the WebGL scene only on capable desktop devices. Phones, tablets, reduced-motion,
 * save-data and low-memory devices never download the 3D bundle. Rendering pauses off-screen.
 */
export default function Hero3DLayer() {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(true);
  const ref = useRef(null);

  useEffect(() => {
    // Wait for the page to settle before starting WebGL
    const id = window.setTimeout(() => setEnabled(canRunHeavy3D()), 900);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!enabled || !ref.current) return undefined;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [enabled]);

  return (
    <div ref={ref} className="hero__3d" aria-hidden="true">
      {enabled && (
        <ErrorBoundary silent>
          <Suspense fallback={null}>
            <Hero3D active={visible} />
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  );
}
