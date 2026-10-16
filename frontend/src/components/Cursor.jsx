import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { isFinePointer, prefersReducedMotion } from '../utils/helpers.js';

/**
 * Custom cursor with states driven by `data-cursor` attributes:
 *   (none) normal · "hover" links/buttons · "image" · "view" · "drag" · "close"
 * Only mounted on devices with a fine pointer (never on touch).
 */
const LABELS = { view: 'View', drag: 'Drag', close: 'Close' };

export default function Cursor() {
  const [enabled] = useState(() => isFinePointer() && !prefersReducedMotion());
  const [mode, setMode] = useState('default');
  const [hidden, setHidden] = useState(true);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.35 });
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.35 });

  useEffect(() => {
    if (!enabled) return undefined;
    document.documentElement.classList.add('has-cursor');

    const move = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setHidden(false);
      const target = e.target instanceof Element ? e.target : null;
      const marked = target?.closest('[data-cursor]');
      if (marked) setMode(marked.dataset.cursor);
      else if (target?.closest('a, button, input, select, textarea, label, [role="button"]')) setMode('hover');
      else setMode('default');
    };
    const leave = () => setHidden(true);
    const enter = () => setHidden(false);

    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);
    document.documentElement.addEventListener('pointerenter', enter);
    return () => {
      document.documentElement.classList.remove('has-cursor');
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', leave);
      document.documentElement.removeEventListener('pointerenter', enter);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;
  const label = LABELS[mode];

  return (
    <motion.div
      className={`cursor cursor--${mode} ${hidden ? 'is-hidden' : ''}`}
      style={{ x: sx, y: sy }}
      aria-hidden="true"
    >
      <span className="cursor__ring">{label && <span className="cursor__label">{label}</span>}</span>
      <span className="cursor__dot" />
    </motion.div>
  );
}
