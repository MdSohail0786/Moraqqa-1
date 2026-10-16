import { lazy } from 'react';
import { useParams } from 'react-router-dom';
import ProjectsList from './ProjectsList.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { PageSkeleton } from '../components/Skeletons.jsx';

const ProjectDetail = lazy(() => import('./ProjectDetail.jsx'));

/**
 * /projects/:slug is either a category page (/projects/residential) or a project (/projects/marine-drive-residence).
 * Categories come from MongoDB via the settings context, so there is no hardcoded list.
 */
export default function ProjectsRoute() {
  const { slug } = useParams();
  const { categories, loading } = useSettings();
  if (!slug) return <ProjectsList />;

  const category = categories.find((c) => c.slug === slug);
  if (category) return <ProjectsList key={slug} category={category} />;
  if (loading) return <PageSkeleton />;
  return <ProjectDetail key={slug} slug={slug} />;
}
