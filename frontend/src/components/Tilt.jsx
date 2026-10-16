import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { isFinePointer, prefersReducedMotion } from '../utils/helpers.js';

/**
 * Pointer-driven depth: the card tilts slightly toward the cursor and the
 * inner content shifts for a layered parallax feel. Does nothing on touch devices.
 */
export default function Tilt({ children, max = 5, depth = 12, className, as = 'div', ...rest }) {
  const ref = useRef(null);
  const enabled = useRef(isFinePointer() && !prefersReducedMotion());
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 140, damping: 18, mass: 0.4 });
  const sy = useSpring(py, { stiffness: 140, damping: 18, mass: 0.4 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [-max, max]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [max, -max]);
  const shiftX = useTransform(sx, [-0.5, 0.5], [-depth, depth]);
  const shiftY = useTransform(sy, [-0.5, 0.5], [-depth, depth]);

  const onMove = (e) => {
    if (!enabled.current || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const reset = () => {
    px.set(0);
    py.set(0);
  };

  const Tag = motion[as] || motion.div;
  if (!enabled.current) return <Tag className={className} {...rest}>{children}</Tag>;

  return (
    <Tag
      ref={ref}
      className={className}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ rotateX, rotateY, transformPerspective: 1000, transformStyle: 'preserve-3d' }}
      {...rest}
    >
      <motion.div className="tilt__inner" style={{ x: shiftX, y: shiftY }}>
        {children}
      </motion.div>
    </Tag>
  );
}
