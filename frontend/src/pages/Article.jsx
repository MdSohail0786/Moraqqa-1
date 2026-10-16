import { Link, useParams } from 'react-router-dom';
import Seo from '../components/Seo.jsx';
import CloudImage from '../components/CloudImage.jsx';
import CtaBand from '../components/CtaBand.jsx';
import { ErrorState } from '../components/States.jsx';
import { PageSkeleton } from '../components/Skeletons.jsx';
import { ImageReveal, Reveal, TextReveal } from '../components/Reveal.jsx';
import useFetch from '../hooks/useFetch.js';
import { fetchArticle } from '../services/endpoints.js';
import { formatDate, paragraphs } from '../utils/helpers.js';
import { SITE_URL } from '../config/site.js';
import NotFound from './NotFound.jsx';

export default function Article() {
  const { slug } = useParams();
  const { data, loading, error, reload } = useFetch(() => fetchArticle(slug), [slug]);
  const article = data?.data;

  if (loading) return <PageSkeleton />;
  if (error?.status === 404) return <NotFound />;
  if (error) return <div className="page-top"><ErrorState error={error} onRetry={reload} title="This article could not be loaded" /></div>;
  if (!article) return null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    image: article.coverImage?.url,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: { '@type': 'Person', name: article.author },
    mainEntityOfPage: `${SITE_URL}/journal/${article.slug}`,
  };

  return (
    <>
      <Seo title={article.title} description={article.excerpt || article.content.slice(0, 160)} image={article.coverImage?.url} type="article" jsonLd={jsonLd} />
      <header className="page-head container">
        <nav className="crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span><Link to="/journal">Journal</Link></nav>
        <p className="eyebrow">{[article.category, formatDate(article.publishedAt || article.createdAt)].filter(Boolean).join(' · ')}</p>
        <TextReveal as="h1" text={article.title} className="h1" immediate />
        <p className="muted" style={{ marginTop: 24 }}>By {article.author}</p>
      </header>
      {article.coverImage?.url && (
        <section className="container section--tight">
          <ImageReveal><CloudImage src={article.coverImage.url} alt={article.coverImage.alt || article.title} ratio="16 / 8" widths={[800, 1280, 1920]} sizes="100vw" priority /></ImageReveal>
        </section>
      )}
      <section className="container section--tight">
        <Reveal className="article article__body">{paragraphs(article.content).map((p, i) => <p key={i}>{p}</p>)}</Reveal>
        {article.tags?.length > 0 && (
          <ul className="chips article" style={{ marginTop: 32 }}>{article.tags.map((t) => <li key={t}><span className="chip">{t}</span></li>)}</ul>
        )}
      </section>
      <CtaBand />
    </>
  );
}
