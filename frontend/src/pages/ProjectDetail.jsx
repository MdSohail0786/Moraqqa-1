import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import Seo from '../components/Seo.jsx';
import CloudImage from '../components/CloudImage.jsx';
import Gallery from '../components/Gallery.jsx';
import BeforeAfter from '../components/BeforeAfter.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import CtaBand from '../components/CtaBand.jsx';
import { DetailSkeleton } from '../components/Skeletons.jsx';
import { ErrorState } from '../components/States.jsx';
import { Reveal, TextReveal } from '../components/Reveal.jsx';
import useFetch from '../hooks/useFetch.js';
import { fetchProject, fetchRelatedProjects } from '../services/endpoints.js';
import { useHeroNav, useWhatsAppTopic } from '../context/LayoutContext.jsx';
import { paragraphs } from '../utils/helpers.js';
import { SITE_URL } from '../config/site.js';
import NotFound from './NotFound.jsx';

function Related({ slug }) {
  const { data } = useFetch(() => fetchRelatedProjects(slug), [slug]);
  const list = data?.data || [];
  if (!list.length) return null;
  return (
    <section className="section section--alt">
      <div className="container">
        <div className="shead">
          <div>
            <p className="eyebrow">Continue exploring</p>
            <TextReveal text="Related Projects" className="h2" />
          </div>
          <Link to="/projects" className="link-arrow">All projects</Link>
        </div>
        <div className="col-grid">
          {list.map((p) => (
            <ProjectCard key={p._id} project={p} ratio="4 / 5" sizes="(max-width: 900px) 100vw, 33vw" />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ProjectDetail({ slug }) {
  useHeroNav();
  const heroRef = useRef(null);
  const { data, loading, error, reload } = useFetch((signal) => fetchProject(slug, signal), [slug]);
  const project = data?.data;
  useWhatsAppTopic(project?.title);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '14%']);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);

  if (loading) return <DetailSkeleton />;
  if (error?.status === 404) return <NotFound />;
  if (error) return <div style={{ paddingTop: 'var(--nav-h)' }}><ErrorState error={error} onRetry={reload} title="This project could not be loaded" /></div>;
  if (!project) return null;

  const category = project.category?.name || project.projectType;
  const overview = [
    ['Client', project.client],
    ['Location', project.location],
    ['Area', project.area],
    ['Year', project.year],
    ['Design type', project.designType],
    ['Status', project.status],
  ].filter(([, v]) => v);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    description: project.description,
    image: project.coverImage?.url,
    url: `${SITE_URL}/projects/${project.slug}`,
    datePublished: project.year ? String(project.year) : undefined,
    locationCreated: project.location || undefined,
    genre: category,
    creator: { '@type': 'Organization', name: 'MORAQQA' },
  };

  return (
    <>
      <Seo title={project.title} description={project.description || `${project.title}, a ${category || ''} interior in ${project.location || ''} by MORAQQA.`} image={project.coverImage?.url} type="article" jsonLd={jsonLd} />

      <section className="phero" ref={heroRef}>
        <motion.div className="phero__media" style={{ y, scale }}>
          <CloudImage src={project.coverImage?.url} alt={project.coverImage?.alt || project.title} fill priority widths={[800, 1280, 1920, 2400]} sizes="100vw" />
        </motion.div>
        <div className="phero__shade" />
        <div className="container phero__content">
          <nav className="crumbs" aria-label="Breadcrumb" style={{ color: 'rgba(244,239,231,0.7)' }}>
            <Link to="/projects">Projects</Link>
            {project.category && (<><span aria-hidden="true">/</span><Link to={`/projects/${project.category.slug}`}>{project.category.name}</Link></>)}
          </nav>
          <TextReveal as="h1" text={project.title} className="phero__title" immediate />
          <p className="phero__meta">
            {project.location && <span>{project.location}</span>}
            {project.year && <span>{project.year}</span>}
            {category && <span>{category}</span>}
          </p>
        </div>
      </section>

      <section className="section--tight container">
        <Reveal>
          <p className="eyebrow">Project overview</p>
          <dl className="overview">
            {overview.map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
        </Reveal>
      </section>

      {(project.story || project.description) && (
        <section className="container section--tight">
          <div className="story">
            <p className="eyebrow">Design story</p>
            <Reveal className="story__body">
              {paragraphs(project.story || project.description).map((p, i) => <p key={i}>{p}</p>)}
            </Reveal>
          </div>
        </section>
      )}

      <section className="container section--tight" aria-label="Project gallery">
        <div className="shead">
          <div>
            <p className="eyebrow">Gallery</p>
            <TextReveal text="Inside the project" className="h2" />
          </div>
          {project.imageCount > 0 && <p className="muted" style={{ margin: 0 }}>{project.imageCount} images</p>}
        </div>
        <Gallery params={{ project: project.slug }} pageSize={18} emptyTitle="Gallery coming soon" emptyText="Photography for this project has not been added yet." />
      </section>

      {project.beforeAfter?.before?.url && project.beforeAfter?.after?.url && (
        <section className="container section--tight">
          <div className="shead">
            <div>
              <p className="eyebrow">Transformation</p>
              <TextReveal text="Before & After" className="h2" />
            </div>
          </div>
          <BeforeAfter before={project.beforeAfter.before} after={project.beforeAfter.after} />
        </section>
      )}

      <Related slug={project.slug} />
      <CtaBand title="Imagine a space like this" />
    </>
  );
}
