import { cx } from '../utils/helpers.js';

export const SkeletonBlock = ({ className, style }) => <span className={cx('skeleton', className)} style={style} aria-hidden="true" />;

export function TextSkeleton({ lines = 3, className }) {
  return (
    <div className={cx('skeleton-text', className)} role="status" aria-label="Loading">
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonBlock key={i} className="skeleton--line" style={{ width: i === lines - 1 ? '60%' : '100%' }} />
      ))}
    </div>
  );
}

export function ProjectCardSkeleton({ ratio = '4 / 5' }) {
  return (
    <div className="pcard pcard--skeleton" role="status" aria-label="Loading project">
      <SkeletonBlock className="skeleton--img" style={{ aspectRatio: ratio }} />
      <SkeletonBlock className="skeleton--line" style={{ width: '70%', marginTop: 18 }} />
      <SkeletonBlock className="skeleton--line" style={{ width: '40%' }} />
    </div>
  );
}

export function ProjectGridSkeleton({ count = 6 }) {
  const ratios = ['4 / 5', '3 / 4', '1 / 1', '4 / 5', '3 / 4', '1 / 1'];
  return (
    <div className="project-grid" aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <ProjectCardSkeleton key={i} ratio={ratios[i % ratios.length]} />
      ))}
    </div>
  );
}

export function GallerySkeleton({ count = 12, columns = 3 }) {
  const heights = [1.25, 0.8, 1, 1.4, 0.9, 1.1];
  return (
    <div className="masonry" aria-busy="true" style={{ '--cols': columns }}>
      {Array.from({ length: columns }, (_, c) => (
        <div className="masonry__col" key={c}>
          {Array.from({ length: Math.ceil(count / columns) }, (_, i) => (
            <SkeletonBlock key={i} className="skeleton--img" style={{ aspectRatio: `1 / ${heights[(c + i * 2) % heights.length]}` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="page-skeleton container" role="status" aria-label="Loading page">
      <SkeletonBlock className="skeleton--line" style={{ width: '12%', marginTop: '18vh' }} />
      <SkeletonBlock className="skeleton--title" />
      <SkeletonBlock className="skeleton--title" style={{ width: '55%' }} />
      <TextSkeleton lines={3} />
      <SkeletonBlock className="skeleton--img" style={{ aspectRatio: '16 / 8', marginTop: 56 }} />
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div role="status" aria-label="Loading project">
      <SkeletonBlock className="skeleton--hero" />
      <div className="container section">
        <TextSkeleton lines={4} />
        <GallerySkeleton count={9} />
      </div>
    </div>
  );
}
