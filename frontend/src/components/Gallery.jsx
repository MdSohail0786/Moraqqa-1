import { memo, useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import CloudImage from './CloudImage.jsx';
import Lightbox from './Lightbox.jsx';
import Tilt from './Tilt.jsx';
import { EmptyState, ErrorState } from './States.jsx';
import { GallerySkeleton } from './Skeletons.jsx';
import useInfiniteList from '../hooks/useInfiniteList.js';
import { useColumns, useSentinel } from '../hooks/useMisc.js';
import { fetchImages } from '../services/endpoints.js';
import { pad } from '../utils/helpers.js';

const SIZES = '(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 25vw';

const GalleryItem = memo(function GalleryItem({ image, index, onOpen }) {
  const ratio = image.width && image.height ? image.width / image.height : 4 / 5;
  return (
    <motion.figure
      className="gallery-item"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <Tilt max={3.5} depth={6}>
        <button type="button" className="gallery-item__btn" onClick={() => onOpen(index)} aria-label={`Open image ${index + 1}: ${image.title || image.altText || 'gallery image'}`} data-cursor="view">
          <CloudImage
            src={image.cloudinaryUrl}
            alt={image.altText || image.title || ''}
            ratio={ratio}
            widths={[320, 480, 640, 960]}
            sizes={SIZES}
          />
          <span className="gallery-item__index">{pad(index + 1)}</span>
        </button>
      </Tilt>
    </motion.figure>
  );
});

/**
 * Masonry gallery backed by GET /api/images (server-side pagination).
 * Loads `pageSize` images first and more as the visitor scrolls (or presses "Load more").
 * Items are distributed into columns by height, so earlier images never move when more load.
 */
export default function Gallery({ params, pageSize = 18, emptyTitle = 'No images yet', emptyText }) {
  const columns = useColumns();
  const [openIndex, setOpenIndex] = useState(null);
  const paramsKey = JSON.stringify(params);

  const { items, total, loading, loadingMore, error, hasMore, loadMore, retry } = useInfiniteList(
    (page, signal) => fetchImages({ ...params, page, limit: pageSize }, signal),
    [paramsKey, pageSize]
  );

  const sentinelRef = useSentinel(loadMore, { enabled: hasMore && !error && !loading });

  const cols = useMemo(() => {
    const heights = Array(columns).fill(0);
    const out = Array.from({ length: columns }, () => []);
    items.forEach((image, index) => {
      const ratio = image.width && image.height ? image.width / image.height : 0.8;
      const target = heights.indexOf(Math.min(...heights));
      out[target].push({ image, index });
      heights[target] += 1 / ratio;
    });
    return out;
  }, [items, columns]);

  const open = useCallback((i) => setOpenIndex(i), []);

  if (loading) return <GallerySkeleton columns={columns} count={pageSize} />;
  if (error && !items.length) return <ErrorState error={error} onRetry={retry} title="The gallery could not be loaded" />;
  if (!items.length) return <EmptyState title={emptyTitle} text={emptyText} />;

  return (
    <div className="gallery">
      <div className="masonry" style={{ '--cols': columns }}>
        {cols.map((col, c) => (
          <div className="masonry__col" key={c}>
            {col.map(({ image, index }) => (
              <GalleryItem key={image._id} image={image} index={index} onOpen={open} />
            ))}
          </div>
        ))}
      </div>

      <div ref={sentinelRef} className="gallery__sentinel" aria-hidden="true" />

      <div className="gallery__footer">
        <p className="gallery__count">
          Showing {items.length} of {total}
        </p>
        {error && <ErrorState compact error={error} onRetry={retry} title="More images could not be loaded" />}
        {hasMore && !error && (
          <button type="button" className="btn btn--line" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        )}
      </div>

      <AnimatePresence>
        {openIndex !== null && (
          <Lightbox
            images={items}
            index={Math.min(openIndex, items.length - 1)}
            total={total}
            onClose={() => setOpenIndex(null)}
            onIndexChange={setOpenIndex}
            onNearEnd={loadMore}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
