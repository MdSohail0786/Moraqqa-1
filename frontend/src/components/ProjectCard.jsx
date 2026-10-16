import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import CloudImage from './CloudImage.jsx';
import Tilt from './Tilt.jsx';
import { ImageReveal } from './Reveal.jsx';
import { cx } from '../utils/helpers.js';

/**
 * Project tile: large image, hover zoom, curtain reveal and pointer depth.
 *   Project name
 *   Mumbai, India · Residential · 2025
 */
function ProjectCard({ project, ratio = '4 / 5', sizes = '(max-width: 768px) 100vw, 50vw', className, reveal = true, priority = false }) {
  const category = project.category?.name || project.projectType;
  const image = (
    <CloudImage
      src={project.coverImage?.url}
      alt={project.coverImage?.alt || `${project.title}, ${project.location || 'interior design project'}`}
      ratio={ratio}
      sizes={sizes}
      priority={priority}
    />
  );

  return (
    <article className={cx('pcard', className)}>
      <Link to={`/projects/${project.slug}`} className="pcard__link" data-cursor="view" aria-label={`${project.title} — view project`}>
        <Tilt className="pcard__tilt" max={4} depth={10}>
          <div className="pcard__media">{reveal ? <ImageReveal>{image}</ImageReveal> : image}</div>
        </Tilt>
        <div className="pcard__meta">
          <h3 className="pcard__title">{project.title}</h3>
          <ArrowUpRight className="pcard__arrow" size={20} aria-hidden="true" />
          <p className="pcard__sub">
            {[project.location, category, project.year].filter(Boolean).map((part, i) => (
              <span key={i}>{part}</span>
            ))}
          </p>
        </div>
      </Link>
    </article>
  );
}

export default memo(ProjectCard);
