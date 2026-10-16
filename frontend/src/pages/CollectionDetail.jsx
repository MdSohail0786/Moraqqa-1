import { useParams } from 'react-router-dom';
import PageHead from '../components/PageHead.jsx';
import Seo from '../components/Seo.jsx';
import Gallery from '../components/Gallery.jsx';
import CtaBand from '../components/CtaBand.jsx';
import { ErrorState } from '../components/States.jsx';
import { PageSkeleton } from '../components/Skeletons.jsx';
import useFetch from '../hooks/useFetch.js';
import { fetchCollection } from '../services/endpoints.js';
import { useWhatsAppTopic } from '../context/LayoutContext.jsx';
import NotFound from './NotFound.jsx';

export default function CollectionDetail() {
  const { slug } = useParams();
  const { data, loading, error, reload } = useFetch(() => fetchCollection(slug), [slug]);
  const collection = data?.data;
  useWhatsAppTopic(collection?.title);

  if (loading) return <PageSkeleton />;
  if (error?.status === 404) return <NotFound />;
  if (error) return <div className="page-top"><ErrorState error={error} onRetry={reload} title="This collection could not be loaded" /></div>;
  if (!collection) return null;

  return (
    <>
      <Seo title={`${collection.title} Collection`} description={collection.description} image={collection.coverImage?.url} />
      <PageHead eyebrow="Collection" title={collection.title} lead={collection.description} crumbs={[{ label: 'Home', to: '/' }, { label: 'Collections', to: '/collections' }, { label: collection.title }]} />
      <section className="container" style={{ paddingBottom: 'var(--section)' }}>
        <Gallery params={{ collection: collection.slug }} pageSize={18} emptyTitle="This collection is empty" emptyText="Images assigned to this collection will appear here." />
      </section>
      <CtaBand />
    </>
  );
}
