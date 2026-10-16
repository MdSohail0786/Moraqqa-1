import { createContext, useContext, useEffect, useState } from 'react';
import Lenis from 'lenis';
import { prefersReducedMotion } from '../utils/helpers.js';

const LenisContext = createContext(null);
export const useLenis = () => useContext(LenisContext);

/** Lenis smooth scrolling. Disabled for reduced-motion users. */
export default function SmoothScroll({ children }) {
  const [lenis, setLenis] = useState(null);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const instance = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      smoothWheel: true,
    });
    let raf;
    const loop = (time) => {
      instance.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    setLenis(instance);
    return () => {
      cancelAnimationFrame(raf);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
