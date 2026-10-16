import { createElement, useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { cx } from '../utils/helpers.js';

const EASE = [0.22, 1, 0.36, 1];

/** Fades and lifts its children into view once. */
export function Reveal({ children, delay = 0, y = 32, className, as = 'div', ...rest }) {
  const MotionTag = motion[as] || motion.div;
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.9, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

/** Headline that rises word by word out of a mask. */
export function TextReveal({ text, as = 'h2', className, delay = 0, stagger = 0.05, immediate = false }) {
  const words = String(text).split(' ');
  const MotionSpan = motion.span;
  const trigger = immediate ? { animate: 'visible' } : { whileInView: 'visible', viewport: { once: true, margin: '0px 0px -10% 0px' } };

  return createElement(
    as,
    { className: cx('text-reveal', className), 'aria-label': text },
    words.map((word, i) => (
      <span className="text-reveal__mask" key={`${word}-${i}`} aria-hidden="true">
        <MotionSpan
          className="text-reveal__word"
          initial="hidden"
          variants={{ hidden: { y: '110%' }, visible: { y: '0%' } }}
          transition={{ duration: 1, delay: delay + i * stagger, ease: EASE }}
          {...trigger}
        >
          {word}
        </MotionSpan>
        {i < words.length - 1 ? ' ' : ''}
      </span>
    ))
  );
}

function ScrollWord({ word, progress, range }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return (
    <motion.span style={{ opacity }} className="scroll-words__word">
      {word}{' '}
    </motion.span>
  );
}

/** Large paragraph whose words light up as the reader scrolls. */
export function ScrollWords({ text, className, as = 'p' }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.55'] });
  const words = String(text).split(' ');
  return createElement(
    as,
    { ref, className: cx('scroll-words', className), 'aria-label': text },
    words.map((w, i) => {
      const start = i / words.length;
      const end = Math.min(1, start + 2 / words.length);
      return <ScrollWord key={`${w}-${i}`} word={w} progress={scrollYProgress} range={[start, end]} />;
    })
  );
}

/** Wraps an image with a curtain-style clip reveal and a settling zoom. */
export function ImageReveal({ children, className, direction = 'up', delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  const hidden = { up: 'inset(100% 0 0 0)', down: 'inset(0 0 100% 0)', left: 'inset(0 100% 0 0)', right: 'inset(0 0 0 100%)' }[direction];
  return (
    <motion.div
      ref={ref}
      className={cx('image-reveal', className)}
      initial={{ clipPath: hidden }}
      animate={inView ? { clipPath: 'inset(0 0 0 0)' } : { clipPath: hidden }}
      transition={{ duration: 1.3, delay, ease: EASE }}
    >
      <motion.div
        className="image-reveal__inner"
        initial={{ scale: 1.25 }}
        animate={inView ? { scale: 1 } : { scale: 1.25 }}
        transition={{ duration: 1.8, delay, ease: EASE }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export { EASE };
