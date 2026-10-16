import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Seo from '../components/Seo.jsx';
import CloudImage from '../components/CloudImage.jsx';
import Hero3DLayer from '../components/Hero3DLayer.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import CtaBand from '../components/CtaBand.jsx';
import { ErrorState } from '../components/States.jsx';
import { ProjectGridSkeleton } from '../components/Skeletons.jsx';
import { ImageReveal, Reveal, ScrollWords, TextReveal } from '../components/Reveal.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useHeroNav } from '../context/LayoutContext.jsx';
import useFetch from '../hooks/useFetch.js';
import { fetchProjects, fetchServices, fetchCollections } from '../services/endpoints.js';
import { pad } from '../utils/helpers.js';
import { SITE_URL } from '../config/site.js';

function Hero() {
  const { settings } = useSettings();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '16%']);
  const scale = useTransform(scrollYProgress, [0, 1], [1.04, 1.18]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section className="hero" ref={ref} aria-label="Introduction">
      <motion.div className="hero__media" style={{ y, scale }}>
        {settings.heroVideoUrl ? (
          <video src={settings.heroVideoUrl} poster={settings.heroImage?.url} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" />
        ) : (
          <motion.div initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1] }} style={{ position: 'absolute', inset: 0 }}>
            <CloudImage src={settings.heroImage?.url} alt={settings.heroImage?.alt || 'Luxury interior designed by MORAQQA'} fill priority widths={[800, 1280, 1920, 2400]} sizes="100vw" />
          </motion.div>
        )}
      </motion.div>
      <div className="hero__shade" />
      <Hero3DLayer />

      <motion.div className="container hero__content" style={{ opacity: fade }}>
        <h1 className="hero__title">
          <TextReveal text={settings.siteName || 'MORAQQA'} as="span" immediate delay={0.2} stagger={0.1} />
        </h1>
        <motion.p className="hero__tag" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 1, ease: [0.22, 1, 0.36, 1] }}>
          “{settings.tagline}”
        </motion.p>
        <motion.div className="hero__ctas" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.15, duration: 1, ease: [0.22, 1, 0.36, 1] }}>
          <Link to="/projects" className="btn btn--light">Explore Projects <ArrowRight size={16} aria-hidden="true" /></Link>
          <Link to="/contact" className="btn btn--light" style={{ borderColor: 'transparent', background: 'rgba(244,239,231,0.12)' }}>Start a Conversation</Link>
        </motion.div>
      </motion.div>

      <a href="#intro" className="hero__scroll" aria-label="Scroll to introduction">
        Scroll <i />
      </a>
    </section>
  );
}

function Intro() {
  const { settings } = useSettings();
  return (
    <section className="section container" id="intro">
      <div className="intro">
        <div className="intro__text">
          <p className="eyebrow">The Studio</p>
          <ScrollWords text={`${settings.siteName || 'MORAQQA'} is an interior design studio creating refined spaces where architecture, material and emotion come together.`} />
          <Reveal className="intro__small">
            <p>From private residences to hotels and workplaces, every project begins with listening and ends with details drawn, made and finished with care.</p>
            <Link to="/about" className="link-arrow">Our philosophy <ArrowRight size={15} aria-hidden="true" /></Link>
          </Reveal>
        </div>
        <ImageReveal className="intro__image">
          <CloudImage src={settings.introImage?.url} alt={settings.introImage?.alt || 'Studio interior detail'} ratio="4 / 5" sizes="(max-width: 860px) 100vw, 40vw" />
        </ImageReveal>
      </div>
    </section>
  );
}

function Featured() {
  const { data, loading, error, reload } = useFetch(() => fetchProjects({ featured: true, limit: 6 }), []);
  const projects = data?.data || [];
  const ratios = ['4 / 5', '3 / 4', '1 / 1', '4 / 5', '3 / 4', '4 / 5'];

  return (
    <section className="section section--alt">
      <div className="container">
        <div className="shead">
          <div>
            <p className="eyebrow">Selected work</p>
            <TextReveal text="Featured Projects" className="h1" />
          </div>
          <Link to="/projects" className="link-arrow">All projects <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>

        {loading && <ProjectGridSkeleton count={4} />}
        {error && <ErrorState error={error} onRetry={reload} title="Featured projects could not be loaded" />}
        {!loading && !error && projects.length === 0 && (
          <p className="muted">Featured projects will appear here once they are published from the admin panel.</p>
        )}
        {projects.length > 0 && (
          <div className="featured">
            {projects.map((p, i) => (
              <ProjectCard key={p._id} project={p} ratio={ratios[i % ratios.length]} sizes={i % 2 ? '(max-width: 860px) 100vw, 40vw' : '(max-width: 860px) 100vw, 58vw'} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ServicesPreview() {
  const { data, loading } = useFetch(() => fetchServices({ featured: true }), []);
  const list = (data?.data || []).slice(0, 4);
  if (!loading && list.length === 0) return null;
  return (
    <section className="section container">
      <div className="shead">
        <div>
          <p className="eyebrow">What we do</p>
          <TextReveal text="Services" className="h1" />
        </div>
        <Link to="/services" className="link-arrow">All services <ArrowRight size={15} aria-hidden="true" /></Link>
      </div>
      <div className="svc-list">
        {list.map((s, i) => (
          <Link key={s._id} to={`/services/${s.slug}`} className="svc" data-cursor="view">
            <span className="svc__num">{pad(i + 1)}</span>
            <h3 className="svc__title">{s.title}</h3>
            <p className="svc__desc">{s.description}</p>
            <div className="svc__thumb"><CloudImage src={s.image?.url} alt={s.image?.alt || s.title} ratio="4 / 3" widths={[240, 400, 640]} sizes="160px" /></div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function CollectionsPreview() {
  const { data } = useFetch(() => fetchCollections(), []);
  const list = (data?.data || []).filter((c) => c.featured).slice(0, 3);
  if (list.length === 0) return null;
  return (
    <section className="section section--dark">
      <div className="container">
        <div className="shead">
          <div>
            <p className="eyebrow">Browse by room</p>
            <TextReveal text="Collections" className="h1" />
          </div>
          <Link to="/collections" className="link-arrow">All collections <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>
        <div className="col-grid">
          {list.map((c) => (
            <Link key={c._id} to={`/collections/${c.slug}`} className="ccard" data-cursor="view">
              <div className="ccard__media"><CloudImage src={c.coverImage?.url} alt={c.coverImage?.alt || c.title} ratio="3 / 4" sizes="(max-width: 900px) 100vw, 33vw" /></div>
              <div className="ccard__meta"><h3 className="ccard__title">{c.title}</h3><span className="ccard__count">{c.imageCount} images</span></div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  useHeroNav();
  const { settings } = useSettings();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    name: settings.siteName || 'MORAQQA',
    description: 'Luxury interior architecture and design studio.',
    url: SITE_URL,
    image: settings.heroImage?.url,
    email: settings.contact?.email || undefined,
    telephone: settings.contact?.phone || undefined,
    address: settings.contact?.address || undefined,
    sameAs: Object.values(settings.social || {}).filter(Boolean),
  };

  return (
    <>
      <Seo title="" description="MORAQQA is a luxury interior architecture and design studio. Crafting spaces beyond imagination." image={settings.heroImage?.url} jsonLd={jsonLd} />
      <Hero />
      <Intro />
      <Featured />
      <ServicesPreview />
      <CollectionsPreview />
      <CtaBand />
    </>
  );
}
