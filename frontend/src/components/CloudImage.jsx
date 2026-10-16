import { memo, useEffect, useRef, useState } from 'react';
import { cld, DEFAULT_WIDTHS, placeholder, srcSet } from '../utils/cloudinary.js';
import { cx } from '../utils/helpers.js';

/**
 * Responsive, lazy Cloudinary image with a blurred low-quality placeholder.
 * - `widths`/`sizes` let the browser pick 600 / 1000 / 1600px variants per device
 * - `ratio` (number or "4/5") reserves space so nothing jumps while loading
 * - `fill` stretches the image to its positioned parent
 */
function CloudImage({
  src,
  alt = '',
  width,
  height,
  ratio,
  widths = DEFAULT_WIDTHS,
  sizes = '100vw',
  priority = false,
  fill = false,
  fit = 'cover',
  className,
  imgClassName,
  onLoad,
  ...rest
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  // Cached images can finish loading before React attaches onLoad
  useEffect(() => {
    const el = imgRef.current;
    if (el?.complete && el.naturalWidth > 0) setLoaded(true);
  }, [src]);

  const aspectRatio = ratio || (width && height ? `${width} / ${height}` : undefined);
  const style = { ...(fill ? {} : aspectRatio ? { aspectRatio } : {}) };

  if (!src || failed) {
    return (
      <span className={cx('cimg', 'cimg--empty', fill && 'cimg--fill', className)} style={style} role="img" aria-label={alt || 'Image unavailable'}>
        <span className="cimg__fallback">MORAQQA</span>
      </span>
    );
  }

  return (
    <span
      className={cx('cimg', fill && 'cimg--fill', loaded && 'is-loaded', className)}
      style={{ ...style, backgroundImage: `url("${placeholder(src)}")` }}
      {...rest}
    >
      <img
        ref={imgRef}
        className={cx('cimg__img', imgClassName)}
        src={cld(src, { w: widths[Math.min(2, widths.length - 1)] })}
        srcSet={srcSet(src, widths)}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        fetchpriority={priority ? 'high' : 'auto'}
        decoding="async"
        style={{ objectFit: fit }}
        onLoad={() => {
          setLoaded(true);
          onLoad?.();
        }}
        onError={() => setFailed(true)}
        draggable={false}
      />
    </span>
  );
}

export default memo(CloudImage);
