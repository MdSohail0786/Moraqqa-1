import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionValue } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, X, ZoomIn, ZoomOut } from 'lucide-react';
import { cld, viewerWidth } from '../utils/cloudinary.js';
import { useOnEscape, useScrollLock } from '../hooks/useMisc.js';
import { pad } from '../utils/helpers.js';

const ZOOM_LEVELS = [1, 2, 3];

/**
 * Fullscreen image viewer. Only the current image (plus its two neighbours, once the current has loaded)
 * is requested at viewer resolution; grids keep using small thumbnails.
 */
export default function Lightbox({ images, index, total, onClose, onIndexChange, onNearEnd }) {
  const containerRef = useRef(null);
  const closeRef = useRef(null);
  const previouslyFocused = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [direction, setDirection] = useState(1);
  const [zoomIndex, setZoomIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const zoom = ZOOM_LEVELS[zoomIndex];
  const current = images[index];
  const count = total || images.length;
  const canLoop = images.length >= count;

  useScrollLock(true);
  useOnEscape(() => onClose());

  const go = useCallback(
    (step) => {
      let next = index + step;
      if (next >= images.length) {
        if (!canLoop) return; // more pages still loading
        next = 0;
      }
      if (next < 0) next = canLoop ? images.length - 1 : 0;
      setDirection(step);
      onIndexChange(next);
    },
    [index, images.length, canLoop, onIndexChange]
  );

  // Reset zoom/position whenever the image changes
  useEffect(() => {
    setLoaded(false);
    setZoomIndex(0);
    x.set(0);
    y.set(0);
  }, [index, x, y]);

  // Ask the parent for more images when the viewer approaches the end of what is loaded
  useEffect(() => {
    if (index >= images.length - 3) onNearEnd?.();
  }, [index, images.length, onNearEnd]);

  // Preload neighbours at viewer size once the current image is on screen
  useEffect(() => {
    if (!loaded) return;
    [images[index + 1], images[index - 1]].filter(Boolean).forEach((img) => {
      const pre = new Image();
      pre.src = cld(img.cloudinaryUrl, { w: viewerWidth() });
    });
  }, [loaded, index, images]);

  useEffect(() => {
    if (zoom === 1) {
      animate(x, 0, { duration: 0.3 });
      animate(y, 0, { duration: 0.3 });
    }
  }, [zoom, x, y]);

  // Focus management: move focus into the dialog, restore it afterwards
  useEffect(() => {
    previouslyFocused.current = document.activeElement;
    closeRef.current?.focus();
    return () => {
      previouslyFocused.current?.focus?.();
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, []);

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else containerRef.current?.requestFullscreen?.().catch(() => {});
  };

  const changeZoom = (dir) => setZoomIndex((z) => Math.max(0, Math.min(ZOOM_LEVELS.length - 1, z + dir)));

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === '+' || e.key === '=') changeZoom(1);
      else if (e.key === '-') changeZoom(-1);
      else if (e.key.toLowerCase() === 'f') toggleFullscreen();
      else if (e.key === 'Tab') {
        // Keep focus inside the dialog
        const focusables = containerRef.current?.querySelectorAll('button:not([disabled])');
        if (!focusables?.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  const onDragEnd = (_e, info) => {
    if (zoom > 1) return;
    if (info.offset.x < -80 || info.velocity.x < -500) go(1);
    else if (info.offset.x > 80 || info.velocity.x > 500) go(-1);
  };

  if (!current) return null;
  const src = cld(current.cloudinaryUrl, { w: viewerWidth() });

  return (
    <motion.div
      ref={containerRef}
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`Image viewer, image ${index + 1} of ${count}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="lightbox__bar">
        <span className="lightbox__counter" aria-live="polite">
          {pad(index + 1)} <span>/ {pad(count)}</span>
        </span>
        <div className="lightbox__tools">
          <button type="button" onClick={() => changeZoom(-1)} disabled={zoomIndex === 0} aria-label="Zoom out">
            <ZoomOut size={20} />
          </button>
          <button type="button" onClick={() => changeZoom(1)} disabled={zoomIndex === ZOOM_LEVELS.length - 1} aria-label="Zoom in">
            <ZoomIn size={20} />
          </button>
          <button type="button" onClick={toggleFullscreen} aria-label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}>
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          <button type="button" ref={closeRef} onClick={onClose} aria-label="Close viewer">
            <X size={22} />
          </button>
        </div>
      </div>

      {/* The backdrop closes the viewer when clicked */}
      <button type="button" className="lightbox__backdrop" onClick={onClose} aria-label="Close viewer" tabIndex={-1} data-cursor="close" />

      <div className="lightbox__stage">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={current._id}
            className="lightbox__slide"
            custom={direction}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -60 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {!loaded && <span className="lightbox__spinner" role="status" aria-label="Loading image" />}
            <motion.img
              src={src}
              alt={current.altText || current.title || ''}
              className="lightbox__img"
              style={{ x, y, opacity: loaded ? 1 : 0 }}
              animate={{ scale: zoom }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              drag={zoom > 1 ? true : 'x'}
              dragConstraints={zoom > 1 ? undefined : { left: 0, right: 0 }}
              dragElastic={zoom > 1 ? 0 : 0.25}
              dragMomentum={false}
              onDragEnd={onDragEnd}
              onDoubleClick={() => setZoomIndex((z) => (z === 0 ? 1 : 0))}
              onLoad={() => setLoaded(true)}
              onError={() => setLoaded(true)}
              draggable={false}
              data-cursor="drag"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {count > 1 && (
        <>
          <button type="button" className="lightbox__nav lightbox__nav--prev" onClick={() => go(-1)} aria-label="Previous image" disabled={!canLoop && index === 0}>
            <ChevronLeft size={30} />
          </button>
          <button type="button" className="lightbox__nav lightbox__nav--next" onClick={() => go(1)} aria-label="Next image" disabled={!canLoop && index >= images.length - 1}>
            <ChevronRight size={30} />
          </button>
        </>
      )}

      {(current.title || current.altText) && <p className="lightbox__caption">{current.title || current.altText}</p>}
    </motion.div>
  );
}
