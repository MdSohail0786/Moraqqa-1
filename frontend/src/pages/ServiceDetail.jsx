import { useParams } from 'react-router-dom';
import PageHead from '../components/PageHead.jsx';
import Seo from '../components/Seo.jsx';
import CloudImage from '../components/CloudImage.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import CtaBand from '../components/CtaBand.jsx';
import { ErrorState } from '../components/States.jsx';
import { PageSkeleton } from '../components/Skeletons.jsx';
import { ImageReveal, Reveal, TextReveal } from '../components/Reveal.jsx';
import useFetch from '../hooks/useFetch.js';
import { fetchService, fetchServiceProjects } from '../services/endpoints.js';
import { useWhatsAppTopic } from '../context/LayoutContext.jsx';
import { paragraphs, pad } from '../utils/helpers.js';
import NotFound from './NotFound.jsx';

export default function ServiceDetail() {
  const { slug } = useParams();
  const { data, loading, error, reload } = useFetch(() => fetchService(slug), [slug]);
  const { data: related } = useFetch(() => fetchServiceProjects(slug), [slug]);
  const service = data?.data;
  useWhatsAppTopic(service?.title);

  if (loading) return <PageSkeleton />;
  if (error?.status === 404) return <NotFound />;
  if (error) return <div className="page-top"><ErrorState error={error} onRetry={reload} title="This service could not be loaded" /></div>;
  if (!service) return null;
  const projects = related?.data || [];

  return (
    <>
      <Seo title={service.title} description={service.description} image={service.image?.url} />
      <PageHead eyebrow="Service" title={service.title} lead={service.description} crumbs={[{ label: 'Home', to: '/' }, { label: 'Services', to: '/services' }, { label: service.title }]} />

      <section className="container section--tight">
        <ImageReveal><CloudImage src={service.image?.url} alt={service.image?.alt || service.title} ratio="16 / 8" widths={[800, 1280, 1920]} sizes="100vw" priority /></ImageReveal>
      </section>

      {service.content && (
        <section className="container section--tight">
          <div className="story">
            <p className="eyebrow">Approach</p>
            <Reveal className="story__body">{paragraphs(service.content).map((p, i) => <p key={i}>{p}</p>)}</Reveal>
          </div>
        </section>
      )}

      {service.process?.length > 0 && (
        <section className="container section--tight">
          <p className="eyebrow">Process</p>
          <ol className="process">
            {service.process.map((step, i) => (
              <Reveal as="li" key={step.title} delay={i * 0.08}>
                <div className="process__n">{pad(i + 1)}</div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </Reveal>
            ))}
          </ol>
        </section>
      )}

      {projects.length > 0 && (
        <section className="section section--alt">
          <div className="container">
            <div className="shead"><div><p className="eyebrow">In practice</p><TextReveal text="Related projects" className="h2" /></div></div>
            <div className="col-grid">{projects.map((p) => <ProjectCard key={p._id} project={p} ratio="4 / 5" sizes="(max-width: 900px) 100vw, 33vw" />)}</div>
          </div>
        </section>
      )}
      <CtaBand />
    </>
  );
}
